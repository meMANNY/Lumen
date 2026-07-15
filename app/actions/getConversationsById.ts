import getCurrentUser from "./getCurrentUser";
import getConversationForUser from "@/app/libs/getConversationForUser";

const getConversationById = async (
  conversationId: string
) => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return null;
    }

    return await getConversationForUser(conversationId, currentUser.id);
  } catch (error: any) {
    console.log(error, 'SERVER_ERROR')
    return null;
  }
};

export default getConversationById;
