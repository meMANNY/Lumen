'use client';

import { User } from "@prisma/client";
import Image from "next/image";
import clsx from "clsx";
import { gradientFor, initialsFor } from "../libs/avatar";

interface AvatarGroupProps {
  users?: User[];
};

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users = []
}) => {
  const slicedUsers = users.slice(0, 3);

  const positionMap = {
    0: 'top-0 left-[12px]',
    1: 'bottom-0',
    2: 'bottom-0 right-0'
  }

  return (
    <div className="relative h-11 w-11">
      {slicedUsers.map((user, index) => (
        <div
          key={user.id}
          className={`
            absolute
            inline-block
            rounded-full
            overflow-hidden
            ring-2
            ring-[#10121d]
            h-[21px]
            w-[21px]
            ${positionMap[index as keyof typeof positionMap]}
          `}>
            {user?.image ? (
              <Image
                fill
                src={user.image}
                alt="Avatar"
                className="object-cover"
              />
            ) : (
              <div
                className={clsx(
                  "flex h-full w-full items-center justify-center text-[8px] font-semibold text-white",
                  gradientFor(user)
                )}
              >
                {initialsFor(user)}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

export default AvatarGroup;
