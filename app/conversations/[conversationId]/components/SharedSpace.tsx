'use client';

import Image from "next/image";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Conversation, User } from "@prisma/client";
import { HiOutlinePhotograph } from "react-icons/hi";
import { HiEllipsisHorizontal } from "react-icons/hi2";

import Avatar from "@/app/components/Avatar";
import AvatarGroup from "@/app/components/AvatarGroup";
import useOtherUser from "@/app/hooks/useOtherUser";
import useActiveList from "@/app/hooks/useActiveList";
import { FullMessageType } from "@/app/types";
import ProfileDrawer from "./ProfileDrawer";
import ImageModal from "./ImageModal";

interface SharedSpaceProps {
  conversation: Conversation & {
    users: User[];
  };
  messages: FullMessageType[];
}

const SharedSpace: React.FC<SharedSpaceProps> = ({ conversation, messages }) => {
  const otherUser = useOtherUser(conversation);
  const { members } = useActiveList();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isActive = members.indexOf(otherUser?.id!) !== -1;

  const imageMessages = useMemo(() => {
    return messages
      .filter((message) => !!message.image)
      .slice(-5)
      .reverse();
  }, [messages]);

  const statusText = conversation.isGroup
    ? `${conversation.users.length} members`
    : (isActive ? 'Active now' : 'Offline');

  return (
    <>
      <ProfileDrawer
        data={conversation}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <ImageModal
        src={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      <aside className="hidden xl:flex w-[250px] shrink-0 flex-col overflow-y-auto border-l border-white/[0.07] bg-[#10121b]/60 px-6 py-8">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Shared space</p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-slate-500 transition hover:text-white"
            aria-label="Conversation options"
          >
            <HiEllipsisHorizontal className="size-4" />
          </button>
        </div>

        <div className="mt-7 flex flex-col items-center text-center">
          {conversation.isGroup ? (
            <AvatarGroup users={conversation.users} />
          ) : (
            <Avatar user={otherUser} size="lg" />
          )}
          <p className="mt-3 text-sm font-semibold text-white">
            {conversation.name || otherUser?.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {conversation.isGroup ? statusText : otherUser?.email}
          </p>
          {!conversation.isGroup && (
            <p className={`mt-1 text-xs ${isActive ? 'text-emerald-300' : 'text-slate-500'}`}>
              {statusText}
            </p>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="mt-4 rounded-lg border border-white/[0.08] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.13em] text-violet-200 transition hover:bg-white/[0.06]"
          >
            View profile
          </button>
        </div>

        <div className="mt-9 border-t border-white/[0.07] pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">
            {conversation.isGroup ? 'Members' : 'Details'}
          </p>
          {conversation.isGroup ? (
            <div className="mt-4 space-y-3">
              {conversation.users.map((user) => (
                <div key={user.id} className="flex items-center gap-2.5">
                  <Avatar user={user} size="sm" />
                  <span className="truncate text-xs text-slate-300">{user.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-600">Joined</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                {otherUser?.createdAt ? format(new Date(otherUser.createdAt), 'PP') : '—'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Media & files</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {imageMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => setSelectedImage(message.image!)}
                className="relative aspect-square overflow-hidden rounded-lg transition hover:opacity-80"
                aria-label="View shared image"
              >
                <Image
                  fill
                  src={message.image!}
                  alt="Shared media"
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
            {imageMessages.length === 0 && (
              <div className="col-span-3 grid place-items-center rounded-lg bg-white/[0.04] py-6 text-slate-600">
                <HiOutlinePhotograph className="size-5" />
                <p className="mt-2 text-[11px]">No media shared yet</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default SharedSpace;
