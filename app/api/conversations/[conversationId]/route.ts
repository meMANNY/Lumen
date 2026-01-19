import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from '@/app/libs/prismadb';
import { pusherServer } from "@/app/libs/pusher";

interface IParams {
    conversationId?: string;
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<IParams> }
) {
    try {
        const { conversationId } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const existingConversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                users: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!existingConversation) {
            return new NextResponse("Invalid ID", { status: 400 });
        }

        // Check if current user is part of the conversation
        const isUserInConversation = existingConversation.users.some(
            cu => cu.userId === currentUser.id
        );

        if (!isUserInConversation) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const deletedConversation = await prisma.conversation.delete({
            where: {
                id: conversationId,
            },
        });

        existingConversation.users.forEach((conversationUser) => {
            if (conversationUser.user.email) {
                pusherServer.trigger(conversationUser.user.email, 'conversation:remove', existingConversation);
            }
        })

        return NextResponse.json(deletedConversation)

    } catch (error: any) {
        console.log(error, 'ERROR_CONVERSATION_DELETE');
        return new NextResponse("Internal Error", { status: 500 });
    }
}