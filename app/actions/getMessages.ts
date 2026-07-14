import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";
import getConversationForUser from "@/app/libs/getConversationForUser";

export const MESSAGES_PAGE_SIZE = 50;

const getMessages = async (conversationId: string) => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return { messages: [], nextCursor: null };
    }

    const conversation = await getConversationForUser(conversationId, currentUser.id);

    if (!conversation) {
      return { messages: [], nextCursor: null };
    }

    const items = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: true,
        seen: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: MESSAGES_PAGE_SIZE + 1,
    });

    const hasMore = items.length > MESSAGES_PAGE_SIZE;
    const page = hasMore ? items.slice(0, MESSAGES_PAGE_SIZE) : items;
    const messages = page.reverse();

    return {
      messages,
      nextCursor: hasMore ? messages[0].id : null,
    };
  } catch (error: any) {
    return { messages: [], nextCursor: null };
  }
};

export default getMessages;
