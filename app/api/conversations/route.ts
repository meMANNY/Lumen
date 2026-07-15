import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import { userChannel } from "@/app/libs/channels";
import { groupConversationSchema, singleConversationSchema } from "@/app/libs/validations";

export async function POST(
  request: Request,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    if (body.isGroup) {
      const parsed = groupConversationSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            message: parsed.error.issues[0]?.message ?? 'Invalid group details',
            errors: parsed.error.flatten()
          },
          { status: 400 }
        );
      }

      const { name, members } = parsed.data;
      const memberIds = Array.from(new Set(members.map((member) => member.value))).filter(
        (id) => id !== currentUser.id
      );

      const foundCount = await prisma.user.count({
        where: { id: { in: memberIds } }
      });

      if (foundCount !== memberIds.length) {
        return new NextResponse('Invalid members', { status: 400 });
      }

      const newConversation = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          userIds: [...memberIds, currentUser.id]
        },
        include: {
          users: true,
        }
      });

      // Update all connections with new conversation
      newConversation.users.forEach((user) => {
        pusherServer.trigger(userChannel(user.id), 'conversation:new', newConversation);
      });

      return NextResponse.json(newConversation);
    }

    const parsed = singleConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten(), { status: 400 });
    }

    const { userId } = parsed.data;

    if (userId === currentUser.id) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    const otherUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!otherUser) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    // Check if a 1:1 conversation already exists between these two users
    const existingConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            userIds: {
              equals: [currentUser.id, userId]
            }
          },
          {
            userIds: {
              equals: [userId, currentUser.id]
            }
          }
        ]
      }
    });

    const singleConversation = existingConversations[0];

    if (singleConversation) {
      return NextResponse.json(singleConversation);
    }

    const newConversation = await prisma.conversation.create({
      data: {
        userIds: [currentUser.id, userId]
      },
      include: {
        users: true,
      }
    });

    // Update all connections with new conversation
    newConversation.users.forEach((user) => {
      pusherServer.trigger(userChannel(user.id), 'conversation:new', newConversation);
    });

    return NextResponse.json(newConversation)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}