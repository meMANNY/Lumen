import { NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import { objectId } from "@/app/libs/validations";
import { PRESENCE_CHANNEL } from "@/app/libs/channels";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const socketId = formData.get("socket_id") as string | null;
  const channel = formData.get("channel_name") as string | null;

  // Rough "last seen" heartbeat — fire and forget
  prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  }).catch(() => {});

  if (!socketId || !channel) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (channel === PRESENCE_CHANNEL) {
    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: userId,
      user_info: {
        email: session.user.email,
        name: session.user.name,
      },
    });
    return NextResponse.json(authResponse);
  }

  if (channel.startsWith("private-user-")) {
    if (channel !== `private-user-${userId}`) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return NextResponse.json(pusherServer.authorizeChannel(socketId, channel));
  }

  if (channel.startsWith("private-conversation-")) {
    const conversationId = channel.slice("private-conversation-".length);

    if (!objectId.safeParse(conversationId).success) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userIds: true },
    });

    if (!conversation?.userIds.includes(userId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(pusherServer.authorizeChannel(socketId, channel));
  }

  return new NextResponse("Forbidden", { status: 403 });
}
