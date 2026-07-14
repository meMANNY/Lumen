"use client";

import Avatar from "@/app/components/Avatar";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { HiChevronLeft } from "react-icons/hi";
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
    const isActive = members.indexOf(otherUser?.email!) !== -1;

    const statusText = useMemo(() => {
        if (conversation.isGroup) {
            return `${conversation.users.length} members`;
        }
        return isActive ? 'Active' : 'Offline';
    }, [conversation, isActive])
    return (
        <>
            <ProfileDrawer
                data={conversation}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)} />
             <div
                className="
                  bg-slate-950/75
                  backdrop-blur-md
                  w-full 
                  flex 
                  border-b
                  border-slate-900/50
                  sm:px-4 
                  py-3 
                  px-4 
                  lg:px-6 
                  justify-between 
                  items-center 
                  shadow-sm
                "
            >
                <div className="flex gap-3 items-center">
                    <Link
                        href="/conversations"
                        className="
                          lg:hidden 
                          block 
                          text-indigo-400 
                          hover:text-indigo-300 
                          transition 
                          cursor-pointer
                        "
                    >
                        <HiChevronLeft size={32} />
                    </Link>
                    {conversation.isGroup ? (
                        <AvatarGroup users={conversation.users} />
                    ) : (
                        <Avatar user={otherUser} />
                    )}
 
                    <div className="flex flex-col">
                        <div className="text-slate-100 font-semibold">{conversation.name || otherUser.name}</div>
                        <div className={clsx(
                            "text-xs font-medium",
                            conversation.isGroup ? "text-slate-400" : (isActive ? "text-emerald-400" : "text-slate-500")
                        )}>
                            {statusText}
                        </div>
                    </div>
                </div>
                <HiEllipsisHorizontal
                    size={32}
                    onClick={() => setDrawerOpen(true)}
                    className="
                      text-indigo-400
                      cursor-pointer
                      hover:text-indigo-300
                      hover:scale-105
                      active:scale-95
                      transition-all
                      duration-200
                    "
                />
            </div>
        </>
    )
}

export default Header
