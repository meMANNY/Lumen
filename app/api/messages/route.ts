import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";


export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        const body = await request.json();
        const {
            message,
            image,
            conversationId
        } = body;

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse("unauthorised", { status: 401 });
        }

        // Create message
        const newMessage = await prisma.message.create({
            data: {
                body: message,
                image: image,
                conversationId: conversationId,
                senderId: currentUser.id,
            },
            include: {
                sender: true,
                seen: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Mark message as seen by sender
        await prisma.messageSeen.create({
            data: {
                userId: currentUser.id,
                messageId: newMessage.id
            }
        });

        // Get updated message with seen info
        const messageWithSeen = await prisma.message.findUnique({
            where: { id: newMessage.id },
            include: {
                sender: true,
                seen: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const updatedConversation = await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
            },
            include: {
                users: {
                    include: {
                        user: true
                    }
                },
                messages: {
                    include: {
                        seen: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }

        })
        await pusherServer.trigger(conversationId, 'messages:new', messageWithSeen);
        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        updatedConversation.users.forEach((conversationUser) => {
            if (conversationUser.user.email) {
                pusherServer.trigger(conversationUser.user.email, 'conversation:update', {
                    id: conversationId,
                    messages: [lastMessage]
                })
            }
        });

        return NextResponse.json(messageWithSeen);

    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES");
        return new NextResponse("Internal Error", { status: 500 });

    }
}
