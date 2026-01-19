import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { FullConversationType } from "../types";
import { User } from "@prisma/client";

type ConversationWithUsers = FullConversationType | { users: User[] };

const useOtherUser = (conversation: ConversationWithUsers) => {

    const session = useSession();
    const otherUser = useMemo(() => {

        const currentUserEmail = session?.data?.user?.email;

        const otherUsers = conversation.users.filter((user) => user.email !== currentUserEmail);

        return otherUsers[0];
    }, [session?.data?.user?.email, conversation.users]);

    return otherUser;
}

export default useOtherUser;
