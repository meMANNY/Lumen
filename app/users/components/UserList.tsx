'use client';


import { User } from "@prisma/client";

import UserBox from "./UserBox";

interface UserListProps {
  items: User[];
}

const UserList: React.FC<UserListProps> = ({ 
  items, 
}) => {
  return ( 
    <aside 
      className="
        w-full 
        md:w-[335px] 
        shrink-0 
        border-r 
        border-white/[0.07] 
        bg-[#12141f]/72 
        flex 
        flex-col
      "
    >
      <div className="px-6 pb-4 pt-7 flex flex-col shrink-0">
        <div className="flex-col">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Lumen / directory</p>
          <h1 className="mt-1.5 font-serif text-[27px] font-medium tracking-[-0.025em] text-white">Directory</h1>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <UserBox
            key={item.id}
            data={item}
          />
        ))}
      </div>
    </aside>
  );
}
 
export default UserList;