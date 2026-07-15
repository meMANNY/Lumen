import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import getConversationForUser from "@/app/libs/getConversationForUser";
import { memberActionSchema } from "@/app/libs/validations";
import { userChannel } from "@/app/libs/channels";

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

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const body = await request.json();
    const parsed = memberActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Invalid data' },
        { status: 400 }
      );
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation || !conversation.isGroup) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const adminIds = conversation.adminIds ?? [];
    const isAdmin = adminIds.includes(currentUser.id);

    // Leaving is open to every member; everything else is admin-only
    if (parsed.data.action === 'leave') {
      const remainingUserIds = conversation.userIds.filter((id) => id !== currentUser.id);
      let remainingAdminIds = adminIds.filter((id) => id !== currentUser.id);

      // Group must never be left without an admin
      if (remainingAdminIds.length === 0 && remainingUserIds.length > 0) {
        remainingAdminIds = [remainingUserIds[0]];
      }

      if (remainingUserIds.length === 0) {
        await prisma.conversation.delete({ where: { id: conversationId } });
      } else {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { userIds: remainingUserIds, adminIds: remainingAdminIds },
        });
      }

      await pusherServer.trigger(userChannel(currentUser.id), 'conversation:remove', {
        id: conversationId,
      });

      return NextResponse.json({ left: true });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Only group admins can manage members' },
        { status: 403 }
      );
    }

    if (parsed.data.action === 'promote') {
      const { userId } = parsed.data;

      if (!conversation.userIds.includes(userId)) {
        return NextResponse.json({ message: 'User is not in this group' }, { status: 400 });
      }

      if (adminIds.includes(userId)) {
        return NextResponse.json({ message: 'Already an admin' }, { status: 400 });
      }

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { adminIds: [...adminIds, userId] },
        include: { users: true },
      });

      return NextResponse.json(updated);
    }

    if (parsed.data.action === 'add') {
      const requestedIds = Array.from(new Set(parsed.data.members.map((m) => m.value)));
      const newIds = requestedIds.filter((id) => !conversation.userIds.includes(id));

      if (newIds.length === 0) {
        return NextResponse.json(
          { message: 'Those users are already in the group' },
          { status: 400 }
        );
      }

      const foundCount = await prisma.user.count({ where: { id: { in: newIds } } });
      if (foundCount !== newIds.length) {
        return NextResponse.json({ message: 'Invalid members' }, { status: 400 });
      }

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { userIds: [...conversation.userIds, ...newIds] },
        include: { users: true },
      });

      // New members see the group appear in their inbox immediately
      await Promise.all(
        newIds.map((id) =>
          pusherServer.trigger(userChannel(id), 'conversation:new', updated)
        )
      );

      return NextResponse.json(updated);
    }

    // action === 'remove'
    const { userId } = parsed.data;

    if (!conversation.userIds.includes(userId)) {
      return NextResponse.json({ message: 'User is not in this group' }, { status: 400 });
    }

    if (adminIds.includes(userId)) {
      return NextResponse.json(
        { message: "Admins can't be removed from the group" },
        { status: 400 }
      );
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { userIds: conversation.userIds.filter((id) => id !== userId) },
      include: { users: true },
    });

    // Removed member's inbox drops the group immediately
    await pusherServer.trigger(userChannel(userId), 'conversation:remove', {
      id: conversationId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error, 'ERROR_CONVERSATION_MEMBERS');
    return new NextResponse('Internal Error', { status: 500 });
  }
}
