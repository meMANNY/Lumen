'use client';

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdOutlineGroupAdd } from 'react-icons/md';
import { HiSearch } from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
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
  const searchRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const session = useSession();

  const { conversationId, isOpen } = useConversation();

  const pusherKey = useMemo(() => {
    return session.data?.user?.id
  }, [session.data?.user?.id])

  const currentUserEmail = session.data?.user?.email;

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

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items, isUnread]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'unread' && !isUnread(item)) {
        return false;
      }
      if (trimmed && !conversationName(item).toLowerCase().includes(trimmed)) {
        return false;
      }
      return true;
    });
  }, [items, filter, query, isUnread, conversationName]);

  const { todayItems, earlierItems } = useMemo(() => {
    const today: FullConversationType[] = [];
    const earlier: FullConversationType[] = [];
    const todayString = new Date().toDateString();
    filteredItems.forEach((item) => {
      const stamp = new Date(item.lastMessageAt).toDateString();
      (stamp === todayString ? today : earlier).push(item);
    });
    return { todayItems: today, earlierItems: earlier };
  }, [filteredItems]);

  useEffect(() => {
    if (!pusherKey) {
      return;
    }

    const channel = pusherClient.subscribe(userChannel(pusherKey));

    const updateHandler = (conversation: FullConversationType) => {
      setItems((current) => current.map((currentConversation) => {
        if (currentConversation.id === conversation.id) {
          return {
            ...currentConversation,
            messages: conversation.messages
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
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300">Lumen / inbox</p>
              <h1 className="mt-1.5 font-serif text-[27px] font-medium tracking-[-0.025em] text-white">Conversations</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              suppressHydrationWarning
              className="
                grid 
                size-10 
                place-items-center 
                rounded-xl 
                bg-white/[0.08] 
                text-slate-200 
                transition-all
                duration-200
                hover:bg-violet-400 
                hover:text-[#171222]
                active:scale-95
              "
              aria-label="New conversation"
            >
              <MdOutlineGroupAdd size={20} />
            </button>
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
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {todayItems.length > 0 && (
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.19em] text-slate-500">Today</p>
          )}
          {todayItems.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              selected={conversationId === item.id}
            />
          ))}
          {earlierItems.length > 0 && (
            <p className={clsx("px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.19em] text-slate-500", todayItems.length > 0 && "pt-4")}>Earlier</p>
          )}
          {earlierItems.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              selected={conversationId === item.id}
            />
          ))}
          {filteredItems.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-500">
              {query.trim() ? 'No conversations match your search.' : filter === 'unread' ? "You're all caught up." : 'No conversations yet — find someone in the directory.'}
            </p>
          )}
        </div>

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
      </aside>
    </>
   );
}
 
export default ConversationList;