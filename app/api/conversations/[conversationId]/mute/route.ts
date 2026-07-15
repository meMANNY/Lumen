import { NextResponse } from "next/server";
import { z } from "zod";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { userChannel } from "@/app/libs/channels";

interface IParams {
  conversationId?: string;
}

const muteSchema = z.object({ muted: z.boolean() });

export async function POST(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId } = await params;

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const body = await request.json();
    const parsed = muteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { muted } = parsed.data;
    const current = conversation.mutedByIds ?? [];
    const has = current.includes(currentUser.id);

    let mutedByIds = current;
    if (muted && !has) {
      mutedByIds = [...current, currentUser.id];
    }
    if (!muted && has) {
      mutedByIds = current.filter((id) => id !== currentUser.id);
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { mutedByIds },
    });

    await pusherServer.trigger(userChannel(currentUser.id), 'conversation:update', {
      id: conversationId,
      mutedByIds: updated.mutedByIds,
    });

    return NextResponse.json({ id: updated.id, mutedByIds: updated.mutedByIds });
  } catch (error) {
    console.log(error, 'ERROR_CONVERSATION_MUTE');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
