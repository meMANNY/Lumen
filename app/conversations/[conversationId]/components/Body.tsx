'use client';

import axios from "axios";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { HiChevronDown } from "react-icons/hi";

import { pusherClient } from "@/app/libs/pusher";
import { conversationChannel } from "@/app/libs/channels";
import useConversation from "@/app/hooks/useConversation";
import useChatSearch from "@/app/hooks/useChatSearch";
import useWallpaper, { WALLPAPERS } from "@/app/hooks/useWallpaper";
import MessageBox from "./MessageBox";
import { FullMessageType } from "@/app/types";
import { find } from "lodash";

interface BodyProps {
  initialMessages: FullMessageType[];
  initialCursor: string | null;
}

const NEAR_BOTTOM_THRESHOLD = 100;
const LOAD_MORE_THRESHOLD = 50;

const Body: React.FC<BodyProps> = ({ initialMessages = [], initialCursor }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const nearBottomRef = useRef(true);

  const [messages, setMessages] = useState(initialMessages);
  const [cursor, setCursor] = useState(initialCursor);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [unseenBelow, setUnseenBelow] = useState(0);

  const { conversationId } = useConversation();
  const session = useSession();

  const currentUserEmail = session.data?.user?.email;
  const currentUserId = session.data?.user?.id;

  const wallpaperKey = useWallpaper((state) => state.byConversation[conversationId]) || 'default';
  const hydrateWallpaper = useWallpaper((state) => state.hydrate);

  useEffect(() => {
    hydrateWallpaper(conversationId);
  }, [conversationId, hydrateWallpaper]);

  // "Delete for me" — messages this user has hidden
  const visibleMessages = useMemo(
    () => messages.filter((message) => !(message.hiddenFromIds || []).includes(currentUserId || '')),
    [messages, currentUserId]
  );

  const searchOpen = useChatSearch((state) => state.isOpen);
  const searchQuery = useChatSearch((state) => state.query);
  const matchIds = useChatSearch((state) => state.matchIds);
  const activeIndex = useChatSearch((state) => state.activeIndex);
  const setMatchIds = useChatSearch((state) => state.setMatchIds);

  const trimmedQuery = searchOpen ? searchQuery.trim().toLowerCase() : '';
  const activeMatchId = matchIds[activeIndex];

  // Publish matching message ids (newest first) whenever messages or query change
  useEffect(() => {
    if (!trimmedQuery) {
      setMatchIds([]);
      return;
    }
    const ids = visibleMessages
      .filter((message) => message.body?.toLowerCase().includes(trimmedQuery))
      .map((message) => message.id)
      .reverse();
    setMatchIds(ids);
  }, [visibleMessages, trimmedQuery, setMatchIds]);

  // Bring the active match into view
  useEffect(() => {
    if (!activeMatchId) {
      return;
    }
    document
      .getElementById(`message-${activeMatchId}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeMatchId]);

  useEffect(() => {
    setMessages(initialMessages);
    setCursor(initialCursor);
    setUnseenBelow(0);

    // Where the "unread messages" divider sits — computed once per load
    const firstUnread = initialMessages.find((message) =>
      message.sender?.email !== currentUserEmail &&
      !(message.seen || []).some((user) => user.email === currentUserEmail)
    );
    setFirstUnreadId(firstUnread?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, initialMessages, initialCursor]);

  useEffect(() => {
    axios.post(`/api/conversations/${conversationId}/seen`);
  }, [conversationId]);

  useEffect(() => {
    bottomRef?.current?.scrollIntoView();
  }, [conversationId]);

  useEffect(() => {
    const channel = pusherClient.subscribe(conversationChannel(conversationId));

    const messageHandler = (message: FullMessageType) => {
      axios.post(`/api/conversations/${conversationId}/seen`);

      const isOwn = message.sender?.email === session.data?.user?.email;

      setMessages((current) => {
        if (find(current, { id: message.id })) {
          return current;
        }

        return [...current, message]
      });

      if (isOwn || nearBottomRef.current) {
        bottomRef?.current?.scrollIntoView();
      } else {
        setUnseenBelow((count) => count + 1);
      }
    };

    const updateMessageHandler = (newMessage: FullMessageType) => {
      setMessages((current) => current.map((currentMessage) => {
        if (currentMessage.id === newMessage.id) {
          return newMessage;
        }

        return currentMessage;
      }))
    };


    channel.bind('messages:new', messageHandler)
    channel.bind('message:update', updateMessageHandler);

    return () => {
      channel.unbind('messages:new', messageHandler)
      channel.unbind('message:update', updateMessageHandler)
      pusherClient.unsubscribe(conversationChannel(conversationId))
    }
  }, [conversationId, session.data?.user?.email]);

  const loadOlderMessages = async () => {
    const el = containerRef.current;

    if (!el || !cursor || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    const prevHeight = el.scrollHeight;
    const prevTop = el.scrollTop;

    try {
      const { data } = await axios.get('/api/messages', {
        params: { conversationId, cursor },
      });

      setMessages((current) => {
        const existingIds = new Set(current.map((m) => m.id));
        const older = data.messages.filter((m: FullMessageType) => !existingIds.has(m.id));
        return [...older, ...current];
      });
      setCursor(data.nextCursor);

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight - prevHeight + prevTop;
        }
      });
    } catch {
      toast.error("Couldn't load older messages");
    } finally {
      loadingRef.current = false;
    }
  };

  const handleScroll = () => {
    const el = containerRef.current;

    if (!el) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    setShowJumpButton(distanceFromBottom > 300);

    if (nearBottomRef.current) {
      setUnseenBelow(0);
    }

    if (el.scrollTop < LOAD_MORE_THRESHOLD && cursor && !loadingRef.current) {
      loadOlderMessages();
    }
  };

  const jumpToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnseenBelow(0);
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`h-full overflow-y-auto ${(WALLPAPERS[wallpaperKey] || WALLPAPERS.default).className}`}
      >
        {visibleMessages.map((message, i) => (
          <Fragment key={message.id}>
            {message.id === firstUnreadId && (
              <div className="my-3 flex w-full items-center gap-3 px-5 sm:px-8">
                <div className="h-px flex-1 bg-violet-300/20" />
                <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-violet-200">
                  Unread messages
                </span>
                <div className="h-px flex-1 bg-violet-300/20" />
              </div>
            )}
            <MessageBox
              isLast={i === visibleMessages.length - 1}
              data={message}
              previousMessage={i > 0 ? visibleMessages[i - 1] : undefined}
              searchQuery={trimmedQuery}
              isActiveMatch={message.id === activeMatchId}
            />
          </Fragment>
        ))}
        <div className="pt-6" ref={bottomRef} />
      </div>

      {showJumpButton && (
        <button
          onClick={jumpToBottom}
          className="
            absolute
            bottom-4
            right-4
            z-20
            grid
            size-10
            place-items-center
            rounded-full
            border
            border-white/10
            bg-[#191c2a]/90
            text-slate-200
            shadow-lg
            shadow-black/40
            backdrop-blur-xl
            transition
            hover:bg-[#232636]
            hover:text-white
          "
          aria-label="Jump to latest messages"
        >
          <HiChevronDown size={18} />
          {unseenBelow > 0 && (
            <span className="absolute -right-1 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violet-300 px-1 font-mono text-[10px] font-bold text-violet-950">
              {unseenBelow}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export default Body;
