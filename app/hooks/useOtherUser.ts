import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { FullConversationType } from "../types";
import { User, ConversationUser } from "@prisma/client";

type ConversationWithUsers = FullConversationType | { users: (ConversationUser & { user: User })[] };

const useOtherUser = (conversation: ConversationWithUsers) => {

    const session = useSession();
    const otherUser = useMemo(() => {

        const currentUserEmail = session?.data?.user?.email;

        // Handle junction table structure - extract user from ConversationUser
        const otherUser = conversation.users.filter((conversationUser: any) => {
            const user = 'user' in conversationUser ? conversationUser.user : conversationUser;
            return user.email != currentUserEmail;
        });

        // Return the User object, not the ConversationUser wrapper
        const result = otherUser[0];
        return 'user' in result ? result.user : result;
    }, [session?.data?.user?.email, conversation.users]);

    return otherUser;
}

export default useOtherUser;
