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

        // Create message with sender already marked as seen
        const newMessage = await prisma.message.create({
            data: {
                body: message,
                image: image,
                conversationId: conversationId,
                senderId: currentUser.id,
                seenIds: [currentUser.id]
            },
            include: {
                sender: true,
                seen: true
            }
        });

        const updatedConversation = await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
                messagesIds: {
                    push: newMessage.id
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        seen: true
                    }
                }
            }

        })
        await pusherServer.trigger(conversationId, 'messages:new', newMessage);
        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        updatedConversation.users.forEach((user) => {
            if (user.email) {
                pusherServer.trigger(user.email, 'conversation:update', {
                    id: conversationId,
                    messages: [lastMessage]
                })
            }
        });

        return NextResponse.json(newMessage);

    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES");
        return new NextResponse("Internal Error", { status: 500 });

    }
}
