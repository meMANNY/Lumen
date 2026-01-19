import { Conversation, Message, User, MessageSeen, ConversationUser } from "@prisma/client";

export type FullMessageType = Message & {
  sender: User;
  seen: (MessageSeen & { user: User })[];
};

export type FullConversationType = Conversation & {
  users: (ConversationUser & { user: User })[];
  messages: FullMessageType[];
};