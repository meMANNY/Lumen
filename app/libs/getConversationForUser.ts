import prisma from "@/app/libs/prismadb";
import { objectId } from "@/app/libs/validations";

const getConversationForUser = async (conversationId: string, userId: string) => {
  if (!objectId.safeParse(conversationId).success) {
    return null;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { users: true },
  });

  if (!conversation || !conversation.userIds.includes(userId)) {
    return null;
  }

  return conversation;
};

export default getConversationForUser;
