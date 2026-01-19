'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { FullConversationType } from '@/app/types';
import useOtherUser from '@/app/hooks/useOtherUser';
import Avatar from '@/app/components/Avatar';
import AvatarGroup from '@/app/components/AvatarGroup';

interface ConversationBoxProps {
    data: FullConversationType,
    selected?: boolean;
}


const ConversationBox: React.FC<ConversationBoxProps> = ({ data, selected }) => {

    const otherUser = useOtherUser(data);
    const session = useSession();
    const router = useRouter();

    // Extract User[] from ConversationUser[] for components
    const users = useMemo(() => data.users.map((cu: any) => cu.user), [data.users]);

    const handleClick = useCallback(() => {
        router.push(`/conversations/${data.id}`);
    }, [data.id, router])


    const lastMessage = useMemo(() => {
        const messages = data.messages || [];
        return messages[messages.length - 1];
    }, [data.messages])

    const userEmail = useMemo(() => {
        return session?.data?.user?.email
    }, [session?.data?.user?.email])

    const hasSeen = useMemo(() => {
        if (!lastMessage) {
            return false;
        }

        const seenArray = lastMessage.seen || [];
        if (!userEmail) {
            return false;
        }
        // Access user through MessageSeen junction table
        return seenArray.filter((messageSeen: any) => messageSeen.user.email == userEmail).length != 0;
    }, [userEmail, lastMessage]);

    const lastMessageText = useMemo(() => {
        if (lastMessage?.image) {
            return "sent an image";
        }
        if (lastMessage?.body) {
            return lastMessage?.body;
        }
        return "started a conversation";
    }, [lastMessage]);

    return (
        <div
            onClick={handleClick}
            className={clsx(`
      w-full 
      relative 
      flex 
      items-center 
      space-x-3 
      p-3 
      hover:bg-neutral-100
      rounded-lg
      transition
      cursor-pointer
      `,
                selected ? 'bg-neutral-100' : 'bg-white'
            )}
        >
            {data.isGroup ? (
                <AvatarGroup users={users} />
            ) : (
                <Avatar user={otherUser} />
            )}

            <div className="min-w-0 flex-1">
                <div className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-md font-medium text-gray-900">
                            {data.name || otherUser.name}
                        </p>

                    </div>
                    <p
                        className={clsx(`
            truncate 
            text-sm
            `,
                            hasSeen ? 'text-gray-500' : 'text-black font-medium'
                        )}>
                        {lastMessageText}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ConversationBox
