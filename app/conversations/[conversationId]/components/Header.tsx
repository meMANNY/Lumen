"use client";

import Avatar from "@/app/components/Avatar";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HiChevronLeft, HiSearch } from "react-icons/hi";
import { HiEllipsisHorizontal } from "react-icons/hi2";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
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
                    <button className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white" aria-label="Search conversation">
                        <HiSearch size={18} />
                    </button>
                    <button 
                        onClick={() => setDrawerOpen(true)} 
                        className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white" 
                        aria-label="More options"
                    >
                        <HiEllipsisHorizontal size={19} />
                    </button>
                </div>
            </div>
        </>
    )
}

export default Header
