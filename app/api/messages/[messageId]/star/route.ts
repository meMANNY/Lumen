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

const starSchema = z.object({ starred: z.boolean() });

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
    const parsed = starSchema.safeParse(body);

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

    const { starred } = parsed.data;
    const current = message.starredByIds ?? [];
    const has = current.includes(currentUser.id);

    let starredByIds = current;
    if (starred && !has) {
      starredByIds = [...current, currentUser.id];
    }
    if (!starred && has) {
      starredByIds = current.filter((id) => id !== currentUser.id);
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { starredByIds },
      include: messageInclude,
    });

    await pusherServer.trigger(
      conversationChannel(message.conversationId),
      'message:update',
      updated
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error, 'ERROR_MESSAGE_STAR');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
