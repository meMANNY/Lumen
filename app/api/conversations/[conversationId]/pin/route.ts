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

const pinSchema = z.object({ pinned: z.boolean() });

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
    const parsed = pinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { pinned } = parsed.data;
    const currentPinnedByIds = conversation.pinnedByIds ?? [];
    const alreadyPinned = currentPinnedByIds.includes(currentUser.id);

    let pinnedByIds = currentPinnedByIds;
    if (pinned && !alreadyPinned) {
      pinnedByIds = [...pinnedByIds, currentUser.id];
    }
    if (!pinned && alreadyPinned) {
      pinnedByIds = pinnedByIds.filter((id) => id !== currentUser.id);
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { pinnedByIds },
    });

    // Keep the user's other tabs/devices in sync
    await pusherServer.trigger(userChannel(currentUser.id), 'conversation:update', {
      id: conversationId,
      pinnedByIds: updated.pinnedByIds,
    });

    return NextResponse.json({ id: updated.id, pinnedByIds: updated.pinnedByIds });
  } catch (error) {
    console.log(error, 'ERROR_CONVERSATION_PIN');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
