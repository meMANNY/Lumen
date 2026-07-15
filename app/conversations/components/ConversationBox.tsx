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
        // seen is now User[] directly instead of MessageSeen[]
        return seenArray.some((user) => user.email === userEmail);
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
        <button
            onClick={handleClick}
            className={clsx(`
              flex 
              w-full 
              items-center 
              gap-3 
              rounded-2xl 
              px-3 
              py-3 
              text-left 
              transition-all
              duration-200
            `,
                selected 
                  ? "bg-gradient-to-r from-violet-400/[0.16] to-transparent shadow-[inset_1px_0_0_rgba(196,181,253,0.65)]" 
                  : "hover:bg-white/[0.045]"
            )}
        >
            {data.isGroup ? (
                <AvatarGroup users={data.users} />
            ) : (
                <Avatar user={otherUser} />
            )}

            <div className="min-w-0 flex-1">
                <div className="focus:outline-none">
                    <div className="flex justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-100">
                            {data.name || otherUser?.name}
                        </span>
                        {lastMessage?.createdAt && (
                            <span className={clsx(`
                              font-mono 
                              text-[10px]
                            `,
                                selected ? "text-violet-200" : "text-slate-500"
                            )}>
                                {format(new Date(lastMessage.createdAt), 'p')}
                            </span>
                        )}
                    </div>
                    <p
                        className={clsx(`
                          mt-1 
                          truncate 
                          text-[12px]
                        `,
                            hasSeen ? 'text-slate-500' : 'text-slate-200 font-semibold'
                        )}>
                        {lastMessageText}
                    </p>
                </div>
            </div>
            {!hasSeen && (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-300 font-mono text-[10px] font-bold text-violet-950">
                    1
                </span>
            )}
        </button>
    )
}

export default ConversationBox
