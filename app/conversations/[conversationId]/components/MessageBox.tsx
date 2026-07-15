'use client';

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { FullMessageType } from "@/app/types";

import Avatar from "@/app/components/Avatar";
import { gradientFor, initialsFor } from "@/app/libs/avatar";
import ImageModal from "./ImageModal";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
  previousMessage?: FullMessageType;
  searchQuery?: string;
  isActiveMatch?: boolean;
}

const highlightMatches = (text: string, query: string) => {
  if (!query) {
    return text;
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="rounded-sm bg-amber-300/40 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const MessageBox: React.FC<MessageBoxProps> = ({
  data,
  isLast,
  previousMessage,
  searchQuery,
  isActiveMatch
}) => {
  const session = useSession();
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const isOwn = session.data?.user?.email === data?.sender?.email
  const seenUsers = (data.seen || [])
    .filter((user) => user.email !== data?.sender?.email);

  const container = clsx('flex gap-3 px-5 sm:px-8 py-3', isOwn && 'justify-end');
  const avatar = clsx(isOwn && 'order-2');
  const body = clsx('flex min-w-0 flex-col gap-1', isOwn && 'items-end');
  const message = clsx(
    'text-[14px] w-fit max-w-[85vw] sm:max-w-md lg:max-w-lg overflow-hidden break-words shadow-sm leading-6',
    isOwn 
      ? 'bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-500 text-white' 
      : 'border border-white/[0.07] bg-white/[0.055] text-slate-200',
    data.image
      ? 'rounded-xl p-0'
      : (isOwn ? 'rounded-[19px] rounded-br-md py-2.5 px-4' : 'rounded-[19px] rounded-tl-md py-2.5 px-4'),
    isActiveMatch && 'ring-2 ring-amber-300/70'
  );

  const isDifferentDay = !previousMessage || 
    new Date(data.createdAt).toDateString() !== new Date(previousMessage.createdAt).toDateString();

  return (
    <div id={`message-${data.id}`} className="flex flex-col w-full">
      {isDifferentDay && (
        <div className="mb-6 mt-4 flex items-center gap-4 w-full px-5 sm:px-8">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {format(new Date(data.createdAt), 'EEEE, d MMMM')}
          </span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>
      )}
      <div className={container}>
        <div className={avatar}>
          <Avatar user={data.sender} size="sm" />
        </div>
        <div className={body}>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {data.sender.name}
            </span>
            <span className="font-mono text-[9px] text-slate-600">
              {format(new Date(data.createdAt), 'p')}
            </span>
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
                  max-w-full
                  h-auto
                  object-cover
                  cursor-pointer
                  hover:scale-105
                  transition
                  duration-300
                "
              />
            ) : (
              <div>{data.body ? highlightMatches(data.body, searchQuery || '') : data.body}</div>
            )}
          </div>
          {isLast && isOwn && seenUsers.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-500 font-medium">Seen</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {seenUsers.map((user) => (
                  <div key={user.id} className="relative h-[18px] w-[18px] rounded-full ring-1 ring-slate-950 overflow-hidden">
                    {user.image ? (
                      <Image
                        fill
                        src={user.image}
                        alt="Seen avatar"
                        className="object-cover"
                      />
                    ) : (
                      <div className={clsx(
                        "flex h-full w-full items-center justify-center text-[7px] font-semibold text-white",
                        gradientFor(user)
                      )}>
                        {initialsFor(user)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBox;