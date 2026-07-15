'use client';

import clsx from "clsx";
import axios from "axios";
import Image from "next/image";
import { Fragment, useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Menu, Transition } from "@headlessui/react";
import { HiOutlineReply, HiOutlineTrash, HiOutlineBan, HiDotsVertical, HiOutlineStar, HiStar, HiPencil, HiOutlineDocumentText, HiCheck } from "react-icons/hi";
import { FullMessageType, ReactionMap } from "@/app/types";

import Avatar from "@/app/components/Avatar";
import { gradientFor, initialsFor } from "@/app/libs/avatar";
import { LinkPreview } from "@/app/libs/linkPreview";
import useReply from "@/app/hooks/useReply";
import useEdit from "@/app/hooks/useEdit";
import ImageModal from "./ImageModal";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
  previousMessage?: FullMessageType;
  searchQuery?: string;
  isActiveMatch?: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

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
  const { setReplyTo } = useReply();
  const { setEditing } = useEdit();

  const currentUserId = session.data?.user?.id;
  const isOwn = session.data?.user?.email === data?.sender?.email
  const seenUsers = (data.seen || [])
    .filter((user) => user.email !== data?.sender?.email);

  const reactions = (data.reactions ?? {}) as ReactionMap;
  const reactionEntries = Object.entries(reactions).filter(([, userIds]) => userIds.length > 0);

  const isStarred = (data.starredByIds || []).includes(currentUserId || '');
  const linkPreview = data.linkPreview as unknown as LinkPreview | null;
  const isSeenByOthers = seenUsers.length > 0;

  const toggleStar = () => {
    axios.post(`/api/messages/${data.id}/star`, { starred: !isStarred })
      .catch((error) => toast.error(error?.response?.data?.message || "Couldn't star message"));
  };

  const react = (emoji: string) => {
    axios.post(`/api/messages/${data.id}/react`, { emoji })
      .catch((error) => toast.error(error?.response?.data?.message || "Couldn't react"));
  };

  const deleteMessage = (scope: 'me' | 'everyone') => {
    axios.post(`/api/messages/${data.id}/delete`, { scope })
      .catch((error) => toast.error(error?.response?.data?.message || "Couldn't delete message"));
  };

  const scrollToQuoted = () => {
    if (!data.replyToId) {
      return;
    }
    document
      .getElementById(`message-${data.replyToId}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const container = clsx('group/message flex gap-3 px-5 sm:px-8 py-3', isOwn && 'justify-end');
  const avatar = clsx(isOwn && 'order-2');
  const body = clsx('flex min-w-0 flex-col gap-1', isOwn && 'items-end');
  const message = clsx(
    'text-[14px] w-fit max-w-[85vw] sm:max-w-md lg:max-w-lg overflow-hidden break-words shadow-sm leading-6',
    data.isDeleted
      ? 'border border-white/[0.07] bg-transparent text-slate-500 italic rounded-[19px] py-2.5 px-4'
      : isOwn
        ? 'bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-500 text-white'
        : 'border border-white/[0.07] bg-white/[0.055] text-slate-200',
    !data.isDeleted && (data.image
      ? 'rounded-xl p-0'
      : (isOwn ? 'rounded-[19px] rounded-br-md py-2.5 px-4' : 'rounded-[19px] rounded-tl-md py-2.5 px-4')),
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
            {data.editedAt && !data.isDeleted && (
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-600">edited</span>
            )}
            {isStarred && (
              <HiStar className="size-3 text-amber-300/80" aria-label="Starred" />
            )}
            {isOwn && !data.isDeleted && (
              <span
                className={clsx("flex items-center -space-x-1.5", isSeenByOthers ? "text-violet-300" : "text-slate-600")}
                aria-label={isSeenByOthers ? 'Seen' : 'Sent'}
              >
                <HiCheck className="size-3" />
                {isSeenByOthers && <HiCheck className="size-3" />}
              </span>
            )}
          </div>

          <div className={clsx('flex items-center gap-1.5', isOwn && 'flex-row-reverse')}>
            <div className={message}>
              {<ImageModal src={data.image} isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} />}
              {data.isDeleted ? (
                <div className="flex items-center gap-1.5">
                  <HiOutlineBan className="size-3.5 shrink-0" />
                  This message was deleted
                </div>
              ) : (
                <>
                  {data.replyTo && (
                    <button
                      type="button"
                      onClick={scrollToQuoted}
                      className={clsx(
                        "mb-1.5 block w-full rounded-lg border-l-2 px-2.5 py-1.5 text-left text-xs",
                        isOwn
                          ? "border-white/60 bg-white/15 text-white/90"
                          : "border-violet-300 bg-white/[0.05] text-slate-400",
                        data.image && "mx-2 mt-2 w-auto"
                      )}
                    >
                      <span className={clsx("block font-mono text-[9px] uppercase tracking-[0.13em]", isOwn ? "text-white" : "text-violet-200")}>
                        {data.replyTo.sender?.name || 'Message'}
                      </span>
                      <span className="mt-0.5 block truncate">
                        {data.replyTo.isDeleted
                          ? 'This message was deleted'
                          : data.replyTo.image ? '📷 Photo' : data.replyTo.body}
                      </span>
                    </button>
                  )}
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
                  ) : data.audio ? (
                    <audio
                      controls
                      preload="metadata"
                      src={data.audio}
                      className="w-64 max-w-full"
                    />
                  ) : data.fileUrl ? (
                    <a
                      href={data.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={clsx(
                        "flex items-center gap-2.5 rounded-lg px-1 py-0.5 transition hover:opacity-80",
                        isOwn ? "text-white" : "text-slate-200"
                      )}
                    >
                      <span className={clsx(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        isOwn ? "bg-white/20" : "bg-white/[0.07]"
                      )}>
                        <HiOutlineDocumentText className="size-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{data.fileName || 'File'}</span>
                        <span className={clsx("block font-mono text-[9px] uppercase tracking-[0.12em]", isOwn ? "text-white/70" : "text-slate-500")}>
                          {data.fileType || 'file'}
                        </span>
                      </span>
                    </a>
                  ) : (
                    <div>
                      <div>{data.body ? highlightMatches(data.body, searchQuery || '') : data.body}</div>
                      {linkPreview && (
                        <a
                          href={linkPreview.url}
                          target="_blank"
                          rel="noreferrer"
                          className={clsx(
                            "mt-1.5 block overflow-hidden rounded-lg border transition hover:opacity-90",
                            isOwn ? "border-white/25 bg-white/10" : "border-white/[0.08] bg-black/20"
                          )}
                        >
                          {linkPreview.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={linkPreview.image}
                              alt=""
                              className="max-h-36 w-full object-cover"
                            />
                          )}
                          <span className="block px-2.5 py-2">
                            {linkPreview.siteName && (
                              <span className={clsx("block font-mono text-[8px] uppercase tracking-[0.13em]", isOwn ? "text-white/60" : "text-slate-500")}>
                                {linkPreview.siteName}
                              </span>
                            )}
                            {linkPreview.title && (
                              <span className="block truncate text-xs font-semibold">{linkPreview.title}</span>
                            )}
                            {linkPreview.description && (
                              <span className={clsx("mt-0.5 line-clamp-2 block text-[11px] leading-4", isOwn ? "text-white/75" : "text-slate-400")}>
                                {linkPreview.description}
                              </span>
                            )}
                          </span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {!data.isDeleted && (
              <Menu as="div" className="relative shrink-0">
                <Menu.Button
                  className="
                    grid
                    size-7
                    place-items-center
                    rounded-lg
                    text-slate-500
                    opacity-60
                    transition
                    hover:bg-white/[0.07]
                    hover:text-white
                    sm:opacity-0
                    sm:group-hover/message:opacity-100
                    sm:focus:opacity-100
                    sm:data-[headlessui-state=open]:opacity-100
                  "
                  aria-label="Message actions"
                >
                  <HiDotsVertical size={14} />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Menu.Items
                    className={clsx(
                      "absolute z-30 mt-1 w-48 rounded-2xl border border-white/10 bg-[#191c2a]/95 p-1.5 shadow-xl shadow-black/50 backdrop-blur-xl focus:outline-none",
                      isOwn ? "right-0 origin-top-right" : "left-0 origin-top-left"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-0.5 border-b border-white/[0.07] px-1 pb-1.5">
                      {QUICK_REACTIONS.map((emoji) => (
                        <Menu.Item key={emoji}>
                          <button
                            type="button"
                            onClick={() => react(emoji)}
                            className={clsx(
                              "grid size-7 place-items-center rounded-lg text-base transition hover:bg-white/[0.09] active:scale-90",
                              (reactions[emoji] || []).includes(currentUserId || '') && "bg-violet-400/20"
                            )}
                            aria-label={`React ${emoji}`}
                          >
                            {emoji}
                          </button>
                        </Menu.Item>
                      ))}
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => setReplyTo(data)}
                          className={clsx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-200 transition", active && "bg-white/[0.06] text-white")}
                        >
                          <HiOutlineReply className="size-4 text-slate-400" />
                          Reply
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={toggleStar}
                          className={clsx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-200 transition", active && "bg-white/[0.06] text-white")}
                        >
                          {isStarred
                            ? <HiStar className="size-4 text-amber-300" />
                            : <HiOutlineStar className="size-4 text-slate-400" />}
                          {isStarred ? 'Unstar' : 'Star message'}
                        </button>
                      )}
                    </Menu.Item>
                    {isOwn && !!data.body && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => setEditing(data)}
                            className={clsx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-200 transition", active && "bg-white/[0.06] text-white")}
                          >
                            <HiPencil className="size-4 text-slate-400" />
                            Edit
                          </button>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => deleteMessage('me')}
                          className={clsx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-200 transition", active && "bg-white/[0.06] text-white")}
                        >
                          <HiOutlineTrash className="size-4 text-slate-400" />
                          Delete for me
                        </button>
                      )}
                    </Menu.Item>
                    {isOwn && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => deleteMessage('everyone')}
                            className={clsx("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-300 transition", active && "bg-rose-500/10")}
                          >
                            <HiOutlineTrash className="size-4" />
                            Delete for everyone
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>

          {reactionEntries.length > 0 && !data.isDeleted && (
            <div className={clsx("flex flex-wrap gap-1 -mt-0.5", isOwn && "justify-end")}>
              {reactionEntries.map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => react(emoji)}
                  className={clsx(
                    "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition active:scale-95",
                    userIds.includes(currentUserId || '')
                      ? "border-violet-300/50 bg-violet-400/20 text-violet-100"
                      : "border-white/[0.09] bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"
                  )}
                  aria-label={`${emoji} ${userIds.length}`}
                >
                  <span>{emoji}</span>
                  {userIds.length > 1 && <span className="font-mono text-[10px]">{userIds.length}</span>}
                </button>
              ))}
            </div>
          )}

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
