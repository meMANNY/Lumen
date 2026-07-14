'use client';

import { User } from "@prisma/client";
import useActiveList from "../hooks/useActiveList";
import Image from "next/image";
import clsx from "clsx";

interface AvatarProps {
  user?: User;
  size?: "sm" | "md" | "lg";
};

const Avatar: React.FC<AvatarProps> = ({ user, size = "md" }) => {
  const { members } = useActiveList();
  const isActive = members.indexOf(user?.id!) !== -1;

  const sizes = {
    sm: "h-7 w-7 md:h-8 md:w-8",
    md: "h-9 w-9 md:h-11 md:w-11",
    lg: "h-12 w-12 md:h-14 md:w-14"
  };

  const statusSizes = {
    sm: "h-2 w-2 md:h-2.5 md:w-2.5",
    md: "h-2.5 w-2.5 md:h-3.5 md:w-3.5",
    lg: "h-3.5 w-3.5 md:h-4 md:w-4"
  };

  return (
    <div className="relative shrink-0">
      <div className={clsx("relative inline-block rounded-full overflow-hidden", sizes[size])}>
        <Image
          fill
          src={user?.image || '/images/placeholder.jpg'}
          alt="Avatar"
        />
      </div>
      {isActive && ( 
        <span 
          className={clsx(`
            absolute 
            block 
            rounded-full 
            bg-emerald-500 
            animate-pulse-glow
            ring-2 
            ring-slate-950 
            top-0 
            right-0
          `, statusSizes[size])}
        />
      )}
    </div>
  );
}

export default Avatar;