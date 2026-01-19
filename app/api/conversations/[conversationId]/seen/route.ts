import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";

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

    // Find existing conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          include: {
            seen: {
              include: {
                user: true
              }
            }
          },
        },
        users: {
          include: {
            user: true
          }
        },
      },
    });

    if (!conversation) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    // Find last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!lastMessage) {
      return NextResponse.json(conversation);
    }

    // Check if user has already seen the message
    const hasAlreadySeen = lastMessage.seen.some(s => s.userId === currentUser.id);

    if (hasAlreadySeen) {
      return NextResponse.json(conversation);
    }

    // Create seen record using junction table
    await prisma.messageSeen.create({
      data: {
        userId: currentUser.id,
        messageId: lastMessage.id
      }
    });

    // Get updated message with seen info
    const updatedMessage = await prisma.message.findUnique({
      where: {
        id: lastMessage.id
      },
      include: {
        sender: true,
        seen: {
          include: {
            user: true
          }
        },
      }
    });

    // Update all connections with new seen
    await pusherServer.trigger(currentUser.email, 'conversation:update', {
      id: conversationId,
      messages: [updatedMessage]
    });

    // Update last message seen
    await pusherServer.trigger(conversationId!, 'message:update', updatedMessage);

    return new NextResponse('Success');
  } catch (error) {
    console.log(error, 'ERROR_MESSAGES_SEEN')
    return new NextResponse('Error', { status: 500 });
  }
}