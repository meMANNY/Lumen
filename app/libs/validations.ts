import { z } from "zod";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name is too long"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const messageSchema = z
  .object({
    message: z.string().trim().max(5000).optional(),
    image: z.url().optional(),
    audio: z.url().optional(),
    fileUrl: z.url().optional(),
    fileName: z.string().trim().max(200).optional(),
    fileType: z.string().trim().max(50).optional(),
    conversationId: objectId,
    replyToId: objectId.optional(),
  })
  .refine(
    (data) =>
      (data.message?.length ?? 0) > 0 || !!data.image || !!data.audio || !!data.fileUrl,
    { message: "Message content required" }
  );

export const editMessageSchema = z.object({
  message: z.string().trim().min(1, "Message can't be empty").max(5000),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  image: z.url().optional().or(z.literal("")),
});

export const groupConversationSchema = z.object({
  isGroup: z.literal(true),
  name: z.string().trim().min(1, "Group name is required").max(50, "Group name is too long"),
  members: z.array(z.object({ value: objectId })).min(2, "Select at least 2 members"),
});

export const singleConversationSchema = z.object({
  userId: objectId,
});

export const memberActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    members: z.array(z.object({ value: objectId })).min(1, "Select at least 1 member"),
  }),
  z.object({
    action: z.literal('remove'),
    userId: objectId,
  }),
  z.object({
    action: z.literal('promote'),
    userId: objectId,
  }),
  z.object({
    action: z.literal('leave'),
  }),
]);
