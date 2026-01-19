import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversations = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    return [];
  }

  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        lastMessageAt: 'desc',
      },
      where: {
        users: {
          some: {
            userId: currentUser.id
          }
        }
      },
      include: {
        users: {
          include: {
            user: true
          }
        },
        messages: {
          include: {
            sender: true,
            seen: {
              include: {
                user: true
              }
            },
          }
        },
      }
    });

    return conversations;
  } catch (error: any) {
    return [];
  }
};

export default getConversations;