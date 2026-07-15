import { NextResponse } from "next/server";
import { z } from "zod";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { objectId } from "@/app/libs/validations";
import { messageInclude } from "@/app/libs/messageInclude";
import { conversationChannel } from "@/app/libs/channels";

interface IParams {
  messageId?: string;
}

const deleteSchema = z.object({ scope: z.enum(['me', 'everyone']) });

export async function POST(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { messageId } = await params;

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!messageId || !objectId.safeParse(messageId).success) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    const conversation = await getConversationForUser(message.conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (parsed.data.scope === 'everyone') {
      if (message.senderId !== currentUser.id) {
        return NextResponse.json(
          { message: 'You can only delete your own messages for everyone' },
          { status: 403 }
        );
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, body: null, image: null, reactions: {} },
        include: messageInclude,
      });

      await pusherServer.trigger(
        conversationChannel(message.conversationId),
        'message:update',
        updated
      );

      return NextResponse.json(updated);
    }

    // scope === 'me' — hide it from this user only
    if (message.hiddenFromIds.includes(currentUser.id)) {
      return NextResponse.json({ message: 'Already hidden' });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { hiddenFromIds: { push: currentUser.id } },
      include: messageInclude,
    });

    // Other participants ignore this (it only changes hiddenFromIds),
    // but the user's own other tabs pick it up.
    await pusherServer.trigger(
      conversationChannel(message.conversationId),
      'message:update',
      updated
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error, 'ERROR_MESSAGE_DELETE');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
