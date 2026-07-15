import { User } from "@prisma/client";

// Vivid gradient pairs for initials avatars — picked to pop against the dark UI.
const GRADIENTS = [
  "bg-gradient-to-br from-rose-400 to-pink-500",
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-sky-400 to-cyan-500",
  "bg-gradient-to-br from-violet-400 to-purple-500",
  "bg-gradient-to-br from-fuchsia-400 to-pink-500",
  "bg-gradient-to-br from-indigo-400 to-blue-500",
  "bg-gradient-to-br from-lime-400 to-emerald-500",
];

// Same user always gets the same gradient.
export function gradientFor(user?: Pick<User, "id" | "email"> | null): string {
  const seed = user?.id || user?.email || "";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function initialsFor(user?: Pick<User, "name" | "email"> | null): string {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  return (user?.email?.[0] ?? "?").toUpperCase();
}
