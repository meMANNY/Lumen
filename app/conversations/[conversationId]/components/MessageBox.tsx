'use client';

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { FullMessageType } from "@/app/types";

import Avatar from "@/app/components/Avatar";
import ImageModal from "./ImageModal";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
}

const MessageBox: React.FC<MessageBoxProps> = ({
  data,
  isLast
}) => {
  const session = useSession();
  const [imageModalOpen, setImageModalOpen] = useState(false);


  const isOwn = session.data?.user?.email === data?.sender?.email
  const seenUsers = (data.seen || [])
    .filter((user) => user.email !== data?.sender?.email);

  const container = clsx('flex gap-3 p-4', isOwn && 'justify-end');
  const avatar = clsx(isOwn && 'order-2');
  const body = clsx('flex flex-col gap-1', isOwn && 'items-end');
  const message = clsx(
    'text-sm w-fit overflow-hidden shadow-sm',
    isOwn 
      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 text-white' 
      : 'bg-slate-900 border border-slate-800/80 text-slate-100',
    data.image 
      ? 'rounded-xl p-0' 
      : (isOwn ? 'rounded-2xl rounded-tr-none py-2.5 px-4' : 'rounded-2xl rounded-tl-none py-2.5 px-4')
  );

  return (
    <div className={container}>
      <div className={avatar}>
        <Avatar user={data.sender} />
      </div>
      <div className={body}>
        <div className="flex items-center gap-1.5">
          <div className="text-xs text-slate-400 font-semibold">
            {data.sender.name}
          </div>
          <div className="text-[10px] text-slate-500">
            {format(new Date(data.createdAt), 'p')}
          </div>
        </div>
        <div className={message}>
          {<ImageModal src={data.image} isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} />}
          {data.image ? (
            <Image
              alt="Image"
              height="288"
              width="288"
              onClick={() => setImageModalOpen(true)}
              src={data.image}
              className="
                object-cover 
                cursor-pointer 
                hover:scale-105 
                transition 
                duration-300
              "
            />
          ) : (
            <div>{data.body}</div>
          )}
        </div>
        {isLast && isOwn && seenUsers.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-slate-500 font-medium">Seen</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {seenUsers.map((user) => (
                <div key={user.id} className="relative h-4.5 w-4.5 rounded-full ring-1 ring-slate-950 overflow-hidden">
                  <Image
                    fill
                    src={user.image || '/images/placeholder.jpg'}
                    alt="Seen avatar"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBox;