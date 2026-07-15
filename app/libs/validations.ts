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
    conversationId: objectId,
  })
  .refine((data) => (data.message?.length ?? 0) > 0 || !!data.image, {
    message: "Message or image required",
  });

export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  image: z.url().optional().or(z.literal("")),
});

export const groupConversationSchema = z.object({
  isGroup: z.literal(true),
  name: z.string().trim().min(1).max(50),
  members: z.array(z.object({ value: objectId })).min(2),
});

export const singleConversationSchema = z.object({
  userId: objectId,
});
