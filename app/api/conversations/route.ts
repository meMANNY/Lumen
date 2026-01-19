import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";

export async function POST(
  request: Request,
) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const {
      userId,
      isGroup,
      members,
      name
    } = body;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 400 });
    }

    if (isGroup && (!members || members.length < 2 || !name)) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    if (isGroup) {
      const newConversation = await prisma.conversation.create({
        data: {
          name,
          isGroup,
          users: {
            create: [
              ...members.map((member: { value: string }) => ({
                userId: member.value
              })),
              {
                userId: currentUser.id
              }
            ]
          }
        },
        include: {
          users: {
            include: {
              user: true
            }
          },
        }
      });

      // Update all connections with new conversation
      newConversation.users.forEach((conversationUser) => {
        if (conversationUser.user.email) {
          pusherServer.trigger(conversationUser.user.email, 'conversation:new', newConversation);
        }
      });

      return NextResponse.json(newConversation);
    }

    // Check if a 1:1 conversation already exists between these two users
    const existingConversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        AND: [
          {
            users: {
              some: {
                userId: currentUser.id
              }
            }
          },
          {
            users: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    });

    // Filter to find exact 2-person conversation
    const singleConversation = existingConversations.find(
      conv => conv.users.length === 2
    );

    if (singleConversation) {
      return NextResponse.json(singleConversation);
    }

    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          create: [
            {
              userId: currentUser.id
            },
            {
              userId: userId
            }
          ]
        }
      },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    });

    // Update all connections with new conversation
    newConversation.users.forEach((conversationUser) => {
      if (conversationUser.user.email) {
        pusherServer.trigger(conversationUser.user.email, 'conversation:new', newConversation);
      }
    });

    return NextResponse.json(newConversation)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}