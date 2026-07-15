'use client';

import { User } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { MdOutlineGroupAdd } from 'react-icons/md';
import { HiSearch } from 'react-icons/hi';
import { HiArchiveBox, HiEllipsisHorizontal, HiSparkles } from 'react-icons/hi2';
import { BsPinAngle } from 'react-icons/bs';
import axios from "axios";
import toast from "react-hot-toast";
import clsx from "clsx";
import { find } from 'lodash';

import useConversation from "@/app/hooks/useConversation";
import { pusherClient } from "@/app/libs/pusher";
import { userChannel } from "@/app/libs/channels";
import GroupChatModal from "./GroupChatModal";
import ConversationBox from "./ConversationBox";
import { FullConversationType } from "@/app/types";

interface ConversationListProps {
  initialItems: FullConversationType[];
  users: User[];
  title?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  initialItems,
  users
}) => {
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectMode, setSelectMode] = useState<'archive' | 'pin' | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();

  const archivedView = searchParams.get('view') === 'archived';

  const { conversationId, isOpen } = useConversation();

  const pusherKey = useMemo(() => {
    return session.data?.user?.id
  }, [session.data?.user?.id])

  const currentUserEmail = session.data?.user?.email;
  const currentUserId = session.data?.user?.id;

  // Leaving/entering the archived view resets any pending selection
  useEffect(() => {
    setSelectMode(null);
    setSelectedIds([]);
  }, [archivedView]);

  // Ctrl+K / Cmd+K focuses the search field
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isArchived = useCallback((conversation: FullConversationType) => {
    if (!currentUserId) {
      return false;
    }
    return (conversation.archivedByIds || []).includes(currentUserId);
  }, [currentUserId]);

  const isPinned = useCallback((conversation: FullConversationType) => {
    if (!currentUserId) {
      return false;
    }
    return (conversation.pinnedByIds || []).includes(currentUserId);
  }, [currentUserId]);

  const conversationName = useCallback((conversation: FullConversationType) => {
    if (conversation.name) {
      return conversation.name;
    }
    const otherUser = conversation.users.find((user) => user.email !== currentUserEmail);
    return otherUser?.name || '';
  }, [currentUserEmail]);

  const isUnread = useCallback((conversation: FullConversationType) => {
    const messages = conversation.messages || [];
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !currentUserEmail) {
      return false;
    }
    return !(lastMessage.seen || []).some((user) => user.email === currentUserEmail);
  }, [currentUserEmail]);

  // Only conversations belonging to the current view (inbox vs archived)
  const visibleItems = useMemo(
    () => items.filter((item) => isArchived(item) === archivedView),
    [items, isArchived, archivedView]
  );

  const unreadCount = useMemo(() => visibleItems.filter(isUnread).length, [visibleItems, isUnread]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return visibleItems.filter((item) => {
      if (filter === 'unread' && !isUnread(item)) {
        return false;
      }
      if (trimmed && !conversationName(item).toLowerCase().includes(trimmed)) {
        return false;
      }
      return true;
    });
  }, [visibleItems, filter, query, isUnread, conversationName]);

  const { pinnedItems, todayItems, earlierItems } = useMemo(() => {
    const pinned: FullConversationType[] = [];
    const today: FullConversationType[] = [];
    const earlier: FullConversationType[] = [];
    const todayString = new Date().toDateString();
    filteredItems.forEach((item) => {
      if (!archivedView && isPinned(item)) {
        pinned.push(item);
        return;
      }
      const stamp = new Date(item.lastMessageAt).toDateString();
      (stamp === todayString ? today : earlier).push(item);
    });
    return { pinnedItems: pinned, todayItems: today, earlierItems: earlier };
  }, [filteredItems, isPinned, archivedView]);

  useEffect(() => {
    if (!pusherKey) {
      return;
    }

    const channel = pusherClient.subscribe(userChannel(pusherKey));

    const updateHandler = (conversation: Partial<FullConversationType> & { id: string }) => {
      setItems((current) => current.map((currentConversation) => {
        if (currentConversation.id === conversation.id) {
          return {
            ...currentConversation,
            ...(conversation.messages ? { messages: conversation.messages } : {}),
            ...(conversation.archivedByIds ? { archivedByIds: conversation.archivedByIds } : {}),
            ...(conversation.pinnedByIds ? { pinnedByIds: conversation.pinnedByIds } : {}),
          };
        }

        return currentConversation;
      }));
    }

    const newHandler = (conversation: FullConversationType) => {
      setItems((current) => {
        if (find(current, { id: conversation.id })) {
          return current;
        }

        return [conversation, ...current]
      });
    }

    const removeHandler = (conversation: FullConversationType) => {
      setItems((current) => {
        return [...current.filter((convo) => convo.id !== conversation.id)]
      });
    }

    channel.bind('conversation:update', updateHandler)
    channel.bind('conversation:new', newHandler)
    channel.bind('conversation:remove', removeHandler)

    return () => {
      channel.unbind('conversation:update', updateHandler)
      channel.unbind('conversation:new', newHandler)
      channel.unbind('conversation:remove', removeHandler)
      pusherClient.unsubscribe(userChannel(pusherKey))
    }
  }, [pusherKey, router]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  }, []);

  const setArchived = useCallback(async (ids: string[], archived: boolean) => {
    if (!ids.length || isMutating) {
      return;
    }
    setIsMutating(true);
    try {
      await Promise.all(
        ids.map((id) => axios.post(`/api/conversations/${id}/archive`, { archived }))
      );
      if (currentUserId) {
        setItems((current) => current.map((item) => {
          if (!ids.includes(item.id)) {
            return item;
          }
          const archivedByIds = archived
            ? Array.from(new Set([...(item.archivedByIds || []), currentUserId]))
            : (item.archivedByIds || []).filter((userId) => userId !== currentUserId);
          return { ...item, archivedByIds };
        }));
      }
      toast.success(
        archived
          ? `Archived ${ids.length} chat${ids.length === 1 ? '' : 's'}`
          : `Unarchived ${ids.length} chat${ids.length === 1 ? '' : 's'}`
      );
      setSelectMode(null);
      setSelectedIds([]);
    } catch {
      toast.error("Couldn't update the archive");
    } finally {
      setIsMutating(false);
    }
  }, [currentUserId, isMutating]);

  const setPinned = useCallback(async (ids: string[], pinned: boolean) => {
    if (!ids.length || isMutating) {
      return;
    }
    setIsMutating(true);
    try {
      await Promise.all(
        ids.map((id) => axios.post(`/api/conversations/${id}/pin`, { pinned }))
      );
      if (currentUserId) {
        setItems((current) => current.map((item) => {
          if (!ids.includes(item.id)) {
            return item;
          }
          const pinnedByIds = pinned
            ? Array.from(new Set([...(item.pinnedByIds || []), currentUserId]))
            : (item.pinnedByIds || []).filter((userId) => userId !== currentUserId);
          return { ...item, pinnedByIds };
        }));
      }
      toast.success(
        pinned
          ? `Pinned ${ids.length} chat${ids.length === 1 ? '' : 's'}`
          : `Unpinned ${ids.length} chat${ids.length === 1 ? '' : 's'}`
      );
      setSelectMode(null);
      setSelectedIds([]);
    } catch {
      toast.error("Couldn't update pins");
    } finally {
      setIsMutating(false);
    }
  }, [currentUserId, isMutating]);

  // Drives the Pin/Unpin toggle in the selection action bar
  const allSelectedPinned = useMemo(() => {
    if (selectedIds.length === 0) {
      return false;
    }
    return selectedIds.every((id) => {
      const item = items.find((conversation) => conversation.id === id);
      return item ? isPinned(item) : false;
    });
  }, [selectedIds, items, isPinned]);

  return (
    <>
      <GroupChatModal
        users={users}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <aside className={clsx(`
        w-full
        md:w-[335px]
        shrink-0
        border-r
        border-white/[0.07]
        bg-[#12141f]/72
        flex
        flex-col
        transition-all
        duration-300
      `, isOpen ? 'hidden md:flex' : 'flex')}>
        <div className="px-6 pb-4 pt-7 flex flex-col shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">
                {archivedView ? 'Lumen / archive' : 'Lumen / inbox'}
              </p>
              <h1 className="mt-1.5 font-serif text-[27px] font-medium tracking-[-0.025em] text-white">
                {archivedView ? 'Archived' : 'Conversations'}
              </h1>
            </div>
            <Menu as="div" className="relative">
              <Menu.Button
                suppressHydrationWarning
                aria-label="Conversation options"
                className="
                  grid
                  size-10
                  place-items-center
                  rounded-xl
                  bg-white/[0.08]
                  text-slate-200
                  transition-all
                  duration-200
                  hover:bg-white/[0.14]
                  hover:text-white
                  active:scale-95
                "
              >
                <HiEllipsisHorizontal size={21} />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-30 mt-2 w-64 origin-top-right rounded-2xl border border-white/10 bg-[#191c2a]/95 p-1.5 shadow-xl shadow-black/50 backdrop-blur-xl focus:outline-none">
                  {!archivedView && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className={clsx(
                            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition",
                            active && "bg-white/[0.06] text-white"
                          )}
                        >
                          <MdOutlineGroupAdd size={17} className="text-slate-400" />
                          New group chat
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => { setSelectMode('archive'); setSelectedIds([]); }}
                        className={clsx(
                          "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition",
                          active && "bg-white/[0.06] text-white"
                        )}
                      >
                        <HiArchiveBox size={16} className="text-slate-400" />
                        {archivedView ? 'Select chats to unarchive' : 'Select chats to archive'}
                      </button>
                    )}
                  </Menu.Item>
                  {!archivedView && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => { setSelectMode('pin'); setSelectedIds([]); }}
                          className={clsx(
                            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition",
                            active && "bg-white/[0.06] text-white"
                          )}
                        >
                          <BsPinAngle size={15} className="text-slate-400" />
                          Select chats to pin
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          <label className="mt-6 flex h-11 items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 text-slate-500 focus-within:border-violet-300/40 focus-within:ring-2 focus-within:ring-violet-400/10">
            <HiSearch className="size-4" />
            <input
              ref={searchRef}
              suppressHydrationWarning
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Search messages"
            />
            <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">⌘K</span>
          </label>
        </div>

        <div className="flex items-center gap-4 border-b border-white/[0.07] px-6 shrink-0">
          <button
            onClick={() => setFilter('all')}
            suppressHydrationWarning
            className={clsx(
              "pb-3 font-mono text-[10px] uppercase tracking-[0.13em] transition",
              filter === 'all'
                ? "border-b-2 border-violet-300 text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            All messages
          </button>
          <button
            onClick={() => setFilter('unread')}
            suppressHydrationWarning
            className={clsx(
              "pb-3 font-mono text-[10px] uppercase tracking-[0.13em] transition",
              filter === 'unread'
                ? "border-b-2 border-violet-300 text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Unread
            {unreadCount > 0 && <span className="ml-1 text-violet-300">{unreadCount}</span>}
          </button>
          {selectMode && (
            <span className="ml-auto pb-3 font-mono text-[10px] uppercase tracking-[0.13em] text-violet-300">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {pinnedItems.length > 0 && (
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.19em] text-slate-500">Pinned</p>
          )}
          {pinnedItems.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              selected={conversationId === item.id}
              selectMode={!!selectMode}
              isChecked={selectedIds.includes(item.id)}
              isPinned
              onToggleSelect={() => toggleSelect(item.id)}
              onSwipeArchive={() => setArchived([item.id], !archivedView)}
              swipeActionLabel={archivedView ? 'Unarchive' : 'Archive'}
            />
          ))}
          {todayItems.length > 0 && (
            <p className={clsx("px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.19em] text-slate-500", pinnedItems.length > 0 && "pt-4")}>Today</p>
          )}
          {todayItems.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              selected={conversationId === item.id}
              selectMode={!!selectMode}
              isChecked={selectedIds.includes(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onSwipeArchive={() => setArchived([item.id], !archivedView)}
              swipeActionLabel={archivedView ? 'Unarchive' : 'Archive'}
            />
          ))}
          {earlierItems.length > 0 && (
            <p className={clsx("px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.19em] text-slate-500", (todayItems.length > 0 || pinnedItems.length > 0) && "pt-4")}>Earlier</p>
          )}
          {earlierItems.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              selected={conversationId === item.id}
              selectMode={!!selectMode}
              isChecked={selectedIds.includes(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onSwipeArchive={() => setArchived([item.id], !archivedView)}
              swipeActionLabel={archivedView ? 'Unarchive' : 'Archive'}
            />
          ))}
          {filteredItems.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-500">
              {query.trim()
                ? 'No conversations match your search.'
                : archivedView
                  ? 'No archived chats — swipe a conversation or use the menu to archive one.'
                  : filter === 'unread'
                    ? "You're all caught up."
                    : 'No conversations yet — find someone in the directory.'}
            </p>
          )}
        </div>

        {selectMode ? (
          <div className="mx-4 mb-5 flex items-center gap-3">
            <button
              onClick={() => { setSelectMode(null); setSelectedIds([]); }}
              className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                selectMode === 'archive'
                  ? setArchived(selectedIds, !archivedView)
                  : setPinned(selectedIds, !allSelectedPinned)
              }
              disabled={selectedIds.length === 0 || isMutating}
              className="
                flex-1
                rounded-2xl
                bg-violet-400
                px-4
                py-3
                text-sm
                font-semibold
                text-[#171222]
                shadow-lg
                shadow-violet-950/40
                transition
                hover:bg-violet-300
                disabled:cursor-default
                disabled:opacity-40
                disabled:hover:bg-violet-400
              "
            >
              {selectMode === 'archive'
                ? (archivedView ? 'Unarchive' : 'Archive')
                : (allSelectedPinned ? 'Unpin' : 'Pin')}
              {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
          </div>
        ) : !archivedView && (
          <button
            onClick={() => setFilter(unreadCount > 0 ? 'unread' : 'all')}
            suppressHydrationWarning
            className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-left transition hover:bg-white/[0.07]"
          >
            <HiSparkles className="size-4 text-amber-300 shrink-0" />
            <span>
              <span className="block text-xs font-semibold text-slate-200">
                {unreadCount > 0
                  ? `${unreadCount} conversation${unreadCount === 1 ? '' : 's'} waiting for you`
                  : "You're all caught up"}
              </span>
              <span className="block pt-0.5 text-[11px] text-slate-500">A calm review of your day</span>
            </span>
          </button>
        )}
      </aside>
    </>
   );
}

export default ConversationList;
