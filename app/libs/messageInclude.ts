// Shared include for message queries so every payload carries the same shape
// (sender, seen users, and the quoted message for replies).
export const messageInclude = {
  sender: true,
  seen: true,
  replyTo: {
    include: {
      sender: true,
    },
  },
} as const;
