'use client';

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { pusherClient } from "@/app/libs/pusher";
import { conversationChannel } from "@/app/libs/channels";
import useConversation from "@/app/hooks/useConversation";
import useChatSearch from "@/app/hooks/useChatSearch";
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

  const { conversationId } = useConversation();
  const session = useSession();

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
    const ids = messages
      .filter((message) => message.body?.toLowerCase().includes(trimmedQuery))
      .map((message) => message.id)
      .reverse();
    setMatchIds(ids);
  }, [messages, trimmedQuery, setMatchIds]);

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

    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;

    if (el.scrollTop < LOAD_MORE_THRESHOLD && cursor && !loadingRef.current) {
      loadOlderMessages();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-[#070b14] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/10 via-[#070b14] to-[#070b14]"
    >
      {messages.map((message, i) => (
        <MessageBox
          isLast={i === messages.length - 1}
          key={message.id}
          data={message}
          previousMessage={i > 0 ? messages[i - 1] : undefined}
          searchQuery={trimmedQuery}
          isActiveMatch={message.id === activeMatchId}
        />
      ))}
      <div className="pt-6" ref={bottomRef} />
    </div>
  );
}

export default Body;
