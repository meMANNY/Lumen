import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { conversationChannel, userChannel } from "@/app/libs/channels";

interface IParams {
  conversationId?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId } = await params;


    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Find last message
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: { seen: true },
    });

    if (!lastMessage) {
      return NextResponse.json(conversation);
    }

    // Check if user has already seen the message
    const hasAlreadySeen = lastMessage.seenIds.includes(currentUser.id);

    if (hasAlreadySeen) {
      return NextResponse.json(conversation);
    }

    // Update message with new seen user using array push
    const updatedMessage = await prisma.message.update({
      where: {
        id: lastMessage.id
      },
      data: {
        seenIds: {
          push: currentUser.id
        }
      },
      include: {
        sender: true,
        seen: true,
      }
    });

    // Update all connections with new seen
    await pusherServer.trigger(userChannel(currentUser.id), 'conversation:update', {
      id: conversationId,
      messages: [updatedMessage]
    });

    // Update last message seen
    await pusherServer.trigger(conversationChannel(conversationId), 'message:update', updatedMessage);

    return new NextResponse('Success');
  } catch (error) {
    console.log(error, 'ERROR_MESSAGES_SEEN')
    return new NextResponse('Error', { status: 500 });
  }
}