'use client';

import DesktopItem from "./DesktopItem";
import useRoutes from "@/app/hooks/useRoutes";
import SettingsModal from "./SettingsModal";
import { useState } from "react";
import Avatar from "../Avatar";
import { User } from "@prisma/client";
import { HiChat } from "react-icons/hi";

interface DesktopSidebarProps {
  currentUser: User
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentUser
}) => {
  const routes = useRoutes();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SettingsModal currentUser={currentUser} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div className="
        hidden 
        lg:flex 
        w-[84px] 
        shrink-0 
        flex-col 
        items-center 
        border-r 
        border-white/[0.07] 
        bg-[#0d0f19]/65 
        py-6 
        justify-between
      ">
        <div className="flex flex-col items-center gap-10">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-rose-300 shadow-lg shadow-fuchsia-950/30 hover:scale-105 transition-transform duration-300">
            <HiChat size={22} className="text-slate-950" />
          </div>
          <nav className="flex flex-col justify-between">
            <ul role="list" className="flex flex-col items-center space-y-4">
              {routes.map((item) => (
                <DesktopItem
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={item.active}
                  onClick={item.onClick}
                />
              ))}
            </ul>
          </nav>
        </div>
        <nav className="flex flex-col justify-between items-center gap-4">
          <div 
            onClick={() => setIsOpen(true)} 
            className="cursor-pointer hover:opacity-75 transition"
          >
            <Avatar user={currentUser} />
          </div>
        </nav>
      </div>
    </>
   );
}

export default DesktopSidebar;