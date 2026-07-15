import { Conversation, Message, User } from "@prisma/client";

export type FullMessageType = Message & {
  sender: User;
  seen: User[];
  replyTo?: (Message & { sender: User }) | null;
};

// Shape of Message.reactions: emoji -> user ids
export type ReactionMap = Record<string, string[]>;

export type FullConversationType = Conversation & {
  users: User[];
  messages: FullMessageType[];
};