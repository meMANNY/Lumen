'use client';

import { User } from "@prisma/client";

 import useActiveList from "../hooks/useActiveList";
import Image from "next/image";

interface AvatarProps {
  user?: User;
};

const Avatar: React.FC<AvatarProps> = ({ user }) => {
  const { members } = useActiveList();
  const isActive = members.indexOf(user?.email!) !== -1;

  return (
    <div className="relative">
      <div className="
        relative 
        inline-block 
        rounded-full 
        overflow-hidden
        h-9 
        w-9 
        md:h-11 
        md:w-11
      ">
        <Image
          fill
          src={user?.image || '/images/placeholder.jpg'}
          alt="Avatar"
        />
      </div>
      {isActive && ( 
        <span 
          className="
            absolute 
            block 
            rounded-full 
            bg-emerald-500 
            animate-pulse-glow
            ring-2 
            ring-slate-950 
            top-0 
            right-0
            h-2.5 
            w-2.5 
            md:h-3.5 
            md:w-3.5
          " 
        />
      )  }
    </div>
  );
}

export default Avatar;