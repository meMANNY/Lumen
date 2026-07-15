"use client";

import Avatar from "@/app/components/Avatar";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronDown, HiChevronLeft, HiChevronUp, HiSearch, HiX } from "react-icons/hi";
import { HiEllipsisHorizontal } from "react-icons/hi2";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
import useChatSearch from "@/app/hooks/useChatSearch";
import clsx from "clsx";


interface HeaderProps {
    conversation: Conversation & {
        users: User[]
    }
};

const Header: React.FC<HeaderProps> = ({ conversation }) => {

    const otherUser = useOtherUser(conversation);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { members } = useActiveList();
    const isActive = members.indexOf(otherUser?.id!) !== -1;

    const search = useChatSearch();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (search.isOpen) {
            searchInputRef.current?.focus();
        }
    }, [search.isOpen]);

    // Close search when leaving the conversation
    useEffect(() => {
        return () => {
            useChatSearch.getState().close();
        };
    }, [conversation.id]);

    const statusText = useMemo(() => {
        if (conversation.isGroup) {
            return `${conversation.users.length} members`;
        }
        return isActive ? 'Active now' : 'Offline';
    }, [conversation, isActive])
    return (
        <>
            <ProfileDrawer
                data={conversation}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)} />
             <div
                className="
                  relative
                  flex
                  h-[88px]
                  items-center
                  justify-between
                  border-b
                  border-white/[0.07]
                  bg-[#11131e]/40
                  px-5
                  sm:px-8
                  w-full
                "
            >
                <div className="flex gap-3 items-center">
                    <Link
                        href="/conversations"
                        className="
                          lg:hidden 
                          block 
                          text-slate-400 
                          hover:text-white 
                          transition 
                          cursor-pointer
                        "
                    >
                        <HiChevronLeft size={28} />
                    </Link>
                    <div className="relative">
                        {conversation.isGroup ? (
                            <AvatarGroup users={conversation.users} />
                        ) : (
                            <Avatar user={otherUser} />
                        )}
                        {isActive && !conversation.isGroup && (
                            <span className="absolute bottom-0.5 right-0.5 size-3 rounded-full border-2 border-[#141621] bg-emerald-400 animate-pulse-glow" />
                        )}
                    </div>
 
                    <div className="flex flex-col">
                        <h2 className="text-[15px] font-semibold text-white">
                            {conversation.name || otherUser.name}
                        </h2>
                        <p className={clsx(
                            "text-xs font-medium mt-0.5",
                            conversation.isGroup ? "text-slate-400" : (isActive ? "text-emerald-300" : "text-slate-500")
                        )}>
                            {statusText}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        suppressHydrationWarning
                        onClick={() => search.isOpen ? search.close() : search.open()}
                        className={clsx(
                            "grid size-10 place-items-center rounded-xl transition",
                            search.isOpen
                              ? "bg-white/[0.07] text-white"
                              : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                        )}
                        aria-label="Search conversation"
                    >
                        <HiSearch size={18} />
                    </button>
                    <button
                        onClick={() => setDrawerOpen(true)}
                        suppressHydrationWarning
                        className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
                        aria-label="More options"
                    >
                        <HiEllipsisHorizontal size={19} />
                    </button>
                </div>
            </div>

            {search.isOpen && (
                <div className="shrink-0 border-b border-white/[0.07] bg-[#0d0f19]/50 px-5 py-3 sm:px-8 [animation:auth-rise_0.25s_ease-out]">
                    <div className="
                      mx-auto
                      flex
                      h-11
                      max-w-3xl
                      items-center
                      gap-2
                      rounded-2xl
                      border
                      border-white/[0.09]
                      bg-white/[0.05]
                      px-3.5
                      shadow-lg
                      shadow-black/20
                      backdrop-blur-xl
                      transition-colors
                      duration-200
                      hover:bg-white/[0.08]
                      focus-within:border-violet-300/40
                      focus-within:bg-white/[0.07]
                      focus-within:ring-2
                      focus-within:ring-violet-400/10
                    ">
                        <HiSearch size={16} className="shrink-0 text-slate-500" />
                        <input
                            ref={searchInputRef}
                            value={search.query}
                            onChange={(event) => search.setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    event.shiftKey ? search.newer() : search.older();
                                }
                                if (event.key === 'Escape') {
                                    search.close();
                                }
                            }}
                            placeholder="Search in conversation"
                            className="w-full min-w-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                        />
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {search.query.trim()
                              ? (search.matchIds.length
                                  ? `${search.activeIndex + 1}/${search.matchIds.length}`
                                  : '0 results')
                              : ''}
                        </span>
                        <button
                            onClick={search.older}
                            disabled={search.activeIndex >= search.matchIds.length - 1}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Older match"
                        >
                            <HiChevronUp size={16} />
                        </button>
                        <button
                            onClick={search.newer}
                            disabled={search.activeIndex <= 0}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Newer match"
                        >
                            <HiChevronDown size={16} />
                        </button>
                        <button
                            onClick={search.close}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                            aria-label="Close search"
                        >
                            <HiX size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default Header
