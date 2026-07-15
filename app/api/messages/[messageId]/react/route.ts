import { NextResponse } from "next/server";
import { z } from "zod";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { objectId } from "@/app/libs/validations";
import { messageInclude } from "@/app/libs/messageInclude";
import { conversationChannel } from "@/app/libs/channels";
import { ReactionMap } from "@/app/types";

interface IParams {
  messageId?: string;
}

const reactSchema = z.object({ emoji: z.string().min(1).max(16) });

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
    const parsed = reactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid reaction' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ message: "Can't react to a deleted message" }, { status: 400 });
    }

    const conversation = await getConversationForUser(message.conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { emoji } = parsed.data;
    const reactions = ((message.reactions ?? {}) as ReactionMap);
    const hadThisReaction = (reactions[emoji] || []).includes(currentUser.id);

    // One reaction per user (WhatsApp-style): remove the user everywhere first
    const next: ReactionMap = {};
    for (const [key, userIds] of Object.entries(reactions)) {
      const remaining = userIds.filter((id) => id !== currentUser.id);
      if (remaining.length > 0) {
        next[key] = remaining;
      }
    }

    // Tapping the same emoji again just removes it; a new emoji replaces the old
    if (!hadThisReaction) {
      next[emoji] = [...(next[emoji] || []), currentUser.id];
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: next },
      include: messageInclude,
    });

    await pusherServer.trigger(
      conversationChannel(message.conversationId),
      'message:update',
      updated
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error, 'ERROR_MESSAGE_REACT');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
