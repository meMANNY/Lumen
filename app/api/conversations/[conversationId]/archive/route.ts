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

const archiveSchema = z.object({ archived: z.boolean() });

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
    const parsed = archiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { archived } = parsed.data;
    // Older documents (and a stale Prisma client) may not carry the field yet
    const currentArchivedByIds = conversation.archivedByIds ?? [];
    const alreadyArchived = currentArchivedByIds.includes(currentUser.id);

    let archivedByIds = currentArchivedByIds;
    if (archived && !alreadyArchived) {
      archivedByIds = [...archivedByIds, currentUser.id];
    }
    if (!archived && alreadyArchived) {
      archivedByIds = archivedByIds.filter((id) => id !== currentUser.id);
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { archivedByIds },
    });

    // Let the user's other tabs/devices update their lists
    await pusherServer.trigger(userChannel(currentUser.id), 'conversation:update', {
      id: conversationId,
      archivedByIds: updated.archivedByIds,
    });

    return NextResponse.json({ id: updated.id, archivedByIds: updated.archivedByIds });
  } catch (error) {
    console.log(error, 'ERROR_CONVERSATION_ARCHIVE');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
