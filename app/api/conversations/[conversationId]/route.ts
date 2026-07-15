import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from '@/app/libs/prismadb';
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { userChannel } from "@/app/libs/channels";

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

        if (!currentUser?.id || !conversationId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const existingConversation = await getConversationForUser(conversationId, currentUser.id);

        if (!existingConversation) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const deletedConversation = await prisma.conversation.delete({
            where: {
                id: conversationId,
            },
        });

        existingConversation.users.forEach((user) => {
            pusherServer.trigger(userChannel(user.id), 'conversation:remove', existingConversation);
        })

        return NextResponse.json(deletedConversation)

    } catch (error: any) {
        console.log(error, 'ERROR_CONVERSATION_DELETE');
        return new NextResponse("Internal Error", { status: 500 });
    }
}