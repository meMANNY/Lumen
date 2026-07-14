import axios from "axios";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {  User } from "@prisma/client";

import Avatar from "@/app/components/Avatar";
import LoadingModal from "@/app/components/LoadingModal";
// import LoadingModal from "@/app/components/modals/LoadingModal";

interface UserBoxProps {
  data: User
}

const UserBox: React.FC<UserBoxProps> = ({ 
  data
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoading(true);

    axios.post('/api/conversations', { userId: data.id })
    .then((data) => {
      router.push(`/conversations/${data.data.id}`);
    })
    .finally(() => setIsLoading(false));
  }, [data, router]);

  return (
    <>
      { isLoading && (<LoadingModal />)
        
       }
      <button
        onClick={handleClick}
        className="
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
          hover:bg-white/[0.045]
        "
      >
        <Avatar user={data} />
        <div className="min-w-0 flex-1">
          <div className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            <div className="flex justify-between items-center mb-1">
              <span className="truncate text-sm font-semibold text-slate-100">
                {data.name}
              </span>
            </div>
          </div>
        </div>
      </button>
    </>
  );
}
 
export default UserBox;