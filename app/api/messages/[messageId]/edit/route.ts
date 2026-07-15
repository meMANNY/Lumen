import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { editMessageSchema, objectId } from "@/app/libs/validations";
import { messageInclude } from "@/app/libs/messageInclude";
import { buildLinkPreview } from "@/app/libs/linkPreview";
import { conversationChannel } from "@/app/libs/channels";

interface IParams {
  messageId?: string;
}

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
    const parsed = editMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid data' },
        { status: 400 }
      );
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== currentUser.id) {
      return NextResponse.json({ message: 'You can only edit your own messages' }, { status: 403 });
    }

    if (message.isDeleted || !message.body) {
      return NextResponse.json({ message: 'This message cannot be edited' }, { status: 400 });
    }

    const conversation = await getConversationForUser(message.conversationId, currentUser.id);

    if (!conversation) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const linkPreview = await buildLinkPreview(parsed.data.message);

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        body: parsed.data.message,
        editedAt: new Date(),
        linkPreview: linkPreview ?? undefined,
      },
      include: messageInclude,
    });

    await pusherServer.trigger(
      conversationChannel(message.conversationId),
      'message:update',
      updated
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error, 'ERROR_MESSAGE_EDIT');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
