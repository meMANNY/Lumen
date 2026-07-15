'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { HiCheck } from 'react-icons/hi';
import { HiArchiveBox, HiOutlineBellSlash } from 'react-icons/hi2';
import { BsPinAngleFill } from 'react-icons/bs';
import { FullConversationType } from '@/app/types';
import useOtherUser from '@/app/hooks/useOtherUser';
import Avatar from '@/app/components/Avatar';
import AvatarGroup from '@/app/components/AvatarGroup';

interface ConversationBoxProps {
    data: FullConversationType,
    selected?: boolean;
    selectMode?: boolean;
    isChecked?: boolean;
    isPinned?: boolean;
    isMuted?: boolean;
    onToggleSelect?: () => void;
    // Called when the row is swiped left past the threshold (mobile)
    onSwipeArchive?: () => void;
    swipeActionLabel?: string;
}

const SWIPE_TRIGGER_PX = 80;
const SWIPE_MAX_PX = 120;

const ConversationBox: React.FC<ConversationBoxProps> = ({
    data,
    selected,
    selectMode,
    isChecked,
    isPinned,
    isMuted,
    onToggleSelect,
    onSwipeArchive,
    swipeActionLabel = 'Archive'
}) => {

    const otherUser = useOtherUser(data);
    const session = useSession();
    const router = useRouter();

    const [dragX, setDragX] = useState(0);
    const touchStart = useRef<{ x: number, y: number } | null>(null);
    const isHorizontalSwipe = useRef(false);

    const handleClick = useCallback(() => {
        if (selectMode) {
            onToggleSelect?.();
            return;
        }
        router.push(`/conversations/${data.id}`);
    }, [data.id, router, selectMode, onToggleSelect])

    const handleTouchStart = (event: React.TouchEvent) => {
        if (!onSwipeArchive || selectMode) {
            return;
        }
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        isHorizontalSwipe.current = false;
    };

    const handleTouchMove = (event: React.TouchEvent) => {
        if (!touchStart.current) {
            return;
        }
        const touch = event.touches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;

        if (!isHorizontalSwipe.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            isHorizontalSwipe.current = true;
        }

        if (isHorizontalSwipe.current && dx < 0) {
            setDragX(Math.max(dx, -SWIPE_MAX_PX));
        }
    };

    const handleTouchEnd = () => {
        if (dragX <= -SWIPE_TRIGGER_PX) {
            onSwipeArchive?.();
        }
        setDragX(0);
        touchStart.current = null;
        isHorizontalSwipe.current = false;
    };

    const lastMessage = useMemo(() => {
        const messages = data.messages || [];
        return messages[messages.length - 1];
    }, [data.messages])

    const userEmail = useMemo(() => {
        return session?.data?.user?.email
    }, [session?.data?.user?.email])

    const hasSeen = useMemo(() => {
        // No messages yet -> nothing to read, so don't flag as unread.
        // Keep in sync with isUnread in ConversationList.
        if (!lastMessage) {
            return true;
        }

        const seenArray = lastMessage.seen || [];
        if (!userEmail) {
            return true;
        }
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
        <div className="relative overflow-hidden rounded-2xl">
            {/* Action revealed behind the row while swiping */}
            {dragX < 0 && (
                <div className="absolute inset-0 flex items-center justify-end gap-1.5 rounded-2xl bg-violet-400/20 pr-4 text-violet-200">
                    <HiArchiveBox size={17} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.13em]">{swipeActionLabel}</span>
                </div>
            )}
            <button
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(${dragX}px)`,
                    transition: dragX === 0 ? 'transform 0.2s ease-out' : 'none'
                }}
                className={clsx(`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-2xl
                  px-3
                  py-3
                  text-left
                  transition-colors
                  duration-200
                `,
                    selected && !selectMode
                      ? "bg-gradient-to-r from-violet-400/[0.16] to-transparent shadow-[inset_1px_0_0_rgba(196,181,253,0.65)]"
                      : "hover:bg-white/[0.045]",
                    selectMode && isChecked && "bg-white/[0.05]"
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
                            <span className="flex shrink-0 items-center gap-1.5">
                                {isMuted && (
                                    <HiOutlineBellSlash className="size-3 text-slate-500" aria-label="Muted" />
                                )}
                                {isPinned && (
                                    <BsPinAngleFill className={clsx("size-3", selected ? "text-violet-200" : "text-violet-300/70")} />
                                )}
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
                            </span>
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
                {!selectMode && !hasSeen && !isMuted && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-violet-300 font-mono text-[10px] font-bold text-violet-950">
                        1
                    </span>
                )}
                {selectMode && (
                    <span
                        className={clsx(
                            "grid size-5 shrink-0 place-items-center rounded-full border transition-all duration-150",
                            isChecked
                              ? "border-transparent bg-violet-400 text-violet-950"
                              : "border-white/25 text-transparent"
                        )}
                    >
                        <HiCheck size={13} />
                    </span>
                )}
            </button>
        </div>
    )
}

export default ConversationBox
