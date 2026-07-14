# Security + Reliability Pass — Messenger Clone

> **Status (2026-07-14): Implemented.** All 6 phases below plus two extra performance fixes (sidebar `take: -1` on messages, `Promise.all` in the conversations layout) were applied. `npm run build` and `npx tsc --noEmit` both pass clean. Verified live: unauthenticated `POST /api/messages` → 401, invalid `POST /api/register` payload → 400, unauthenticated `POST /api/pusher/auth` → 401. Full manual checklist (two-browser realtime, pagination scroll behavior, presence) still needs a human pass — see the checklist at the bottom. One open item: `npm audit` still reports 7 vulnerabilities (postcss inside Next.js itself — no fix upstream yet; tar/bcrypt need a breaking `bcrypt@6.0.0` bump via `npm audit fix --force`, deliberately not applied without sign-off since it touches password hashing).

## Context

The app (Next.js 15 App Router + NextAuth v5 + Prisma/MongoDB + Pusher + Cloudinary) works on the happy path but has real authorization holes and no production hardening. Goal: make it safe and reliable enough for personal use. Approved scope: **security + reliability** — membership guards, private Pusher channels, Zod validation, message pagination, error handling, env housekeeping. Explicitly out of scope: rate limiting, optimistic sends, typing indicators, tests/CI.

Key problems being fixed:
- **IDOR**: any logged-in user can post to / read / mark-seen any conversation by ID (`app/api/messages/route.ts`, `app/api/conversations/[conversationId]/seen/route.ts`, `app/actions/getMessages.ts`, `app/actions/getConversationsById.ts`).
- **Public Pusher channels keyed on raw email/conversationId** — anyone can subscribe and eavesdrop on updates.
- **No input validation** anywhere; register route returns `hashedPassword` to the client; settings route never returns a response (successful saves show an error toast).
- **No pagination** — full message history loads every open; scroll yanks to bottom unconditionally.
- **No error boundaries**; message send failures are silent.
- Hardcoded Pusher cluster `'ap2'` and Cloudinary preset `"q4wapwim"`; no `.env.example`.

## Implementation (ordered — later phases depend on earlier ones)

### Phase 0 — Deps & env
> Note (2026-07-14): `node_modules` + `.next` were wiped and reinstalled fresh to fix a corrupted mixed-version Next install (`Cannot find module 'next/dist/client/components/builtin/global-not-found'`). Lesson: stop the dev server before running any `npm install` — on Windows, file locks can leave installs half-applied.

1. **Upgrade Next.js**: `next@15.1.6` has a known vulnerability ([CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478), flagged by npm on install). Run `npm install next@15 eslint-config-next@15` to get the latest patched 15.x, then `npm run build` to confirm nothing breaks. Also run `npm audit` afterwards — 20 vulnerabilities (1 critical) were reported on fresh install; most should clear with the Next bump + `npm audit fix` (no `--force`).
2. `npm install zod` (zod v4: use `z.email()` / `z.url()`, not `z.string().email()`).
3. Create **`.env.example`** listing: `DATABASE_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_APP_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_CLUSTER=ap2`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
4. `app/libs/pusher.ts`: cluster from `process.env.NEXT_PUBLIC_PUSHER_CLUSTER!` (both server & client).
5. `Form.tsx`: `uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}`. Add the two new vars to local `.env`, restart dev server.

### Phase 1 — `session.user.id` foundation
`auth.ts` currently has **no callbacks**. Add:
```ts
callbacks: {
  async jwt({ token, user }) { if (user) token.sub = user.id; return token; },
  async session({ session, token }) { if (token.sub) session.user.id = token.sub; return session; },
},
```
Create `types/next-auth.d.ts` module augmentation so `session.user.id: string` typechecks. Prerequisite for the Pusher auth route and ConversationList channel name.

### Phase 2 — Validation + membership guard
1. **`app/libs/validations.ts`** (new): `objectId` regex schema (`/^[a-f\d]{24}$/i`), `registerSchema` (name 1–50, `z.email()`, password min 8), `messageSchema` (message ≤5000 optional, image `z.url()` optional, `conversationId` objectId, refine: at least one of message/image), `settingsSchema`, `groupConversationSchema` (`members: z.array(z.object({ value: objectId })).min(2)` — matches GroupChatModal's `{value,label}[]` payload), `singleConversationSchema`.
2. **`app/libs/getConversationForUser.ts`** (new): validates the id with `objectId.safeParse` first (avoids Prisma malformed-ObjectID throw), `findUnique` with `include: { users: true }`, returns `null` unless `conversation.userIds.includes(userId)`.
3. Apply to routes (each: `safeParse` body → 400 on failure; guard → 403):
   - **`app/api/messages/route.ts` POST**: validate + guard. Reuse the guard's conversation for the per-user trigger loop; drop the heavy `messages: {include:{seen}}` include from `conversation.update` and use `newMessage` as the lastMessage (it *is* the newest).
   - **`app/api/conversations/[conversationId]/seen/route.ts` POST**: guard via helper; fetch last message with a scoped `findFirst({ orderBy: { createdAt: 'desc' } })`.
   - **`app/api/conversations/route.ts` POST**: schema per branch; verify target users exist (`prisma.user.count({ where: { id: { in: memberIds } } })` for groups, `findUnique` for 1:1); reject self-conversation; fix Unauthorized status 400 → 401.
   - **`app/api/register/route.ts`**: validate; `select` on create so **`hashedPassword` never leaves the server**; Prisma `P2002` → 409 "Email already in use".
   - **`app/api/settings/route.ts`**: validate; **add the missing `return NextResponse.json(updatedUser)`** (with select excluding hashedPassword) — fixes successful saves showing the error toast.
4. Guard server actions: `app/actions/getMessages.ts` (call `getCurrentUser()` + helper, empty result if not member — signature changes in Phase 4 anyway, do it once) and `app/actions/getConversationsById.ts` (replace raw `findUnique` with the helper; `page.tsx` already renders EmptyState on null).

### Phase 3 — Private Pusher channels
Naming: `private-conversation-<id>`, `private-user-<userId>`; keep `presence-messenger` for the active list (member id switches from email → userId).

1. **`app/libs/channels.ts`** (new): `conversationChannel(id)`, `userChannel(userId)`, `PRESENCE_CHANNEL` — single source of truth for server triggers and client subscriptions.
2. **`app/api/pusher/auth/route.ts`** (new) and **delete `pages/api/pusher/auth.ts`** (same path — leaving both is a build conflict; remove `pages/` if empty). Logic: `auth()` → 401 if no `session.user.id`; parse `formData` (`socket_id`, `channel_name`); then:
   - `presence-messenger` → authorize with `user_id: userId`;
   - `private-user-*` → only if suffix === own userId, else 403;
   - `private-conversation-*` → DB check `conversation.userIds.includes(userId)`, else 403;
   - anything else → 403 (deny-by-default).
   Client already points at `/api/pusher/auth` — no client config change.
3. Server triggers → channel helpers: `messages/route.ts` (`messages:new` on conversationChannel; `conversation:update` on `userChannel(user.id)` — drop email checks), `seen/route.ts`, `conversations/route.ts` (`conversation:new`), `conversations/[conversationId]/route.ts` DELETE (`conversation:remove`).
4. Client subscriptions — also switch from global `pusherClient.bind` to **channel-scoped `channel.bind`** (global binds fire for events from any channel):
   - **`Body.tsx`**: `const channel = pusherClient.subscribe(conversationChannel(conversationId))`, bind/unbind on `channel`.
   - **`ConversationList.tsx`**: `pusherKey = session.data?.user?.id`; subscribe `userChannel(pusherKey)`; **add the missing effect cleanup** (currently never unsubscribes/unbinds — an existing leak).
5. Presence consumers (member id is now userId): `app/components/Avatar.tsx:14` `members.indexOf(user?.id!)`; same change in `Header.tsx:25` and `ProfileDrawer.tsx:31`. `useActiveChannel.ts` unchanged. `MessageBox.tsx` `isOwn` (email-based) still works; optionally switch to `senderId === session.user.id`.

Risk: server triggers + client subscriptions must land together or realtime silently breaks; missing `NEXT_PUBLIC_PUSHER_CLUSTER` throws at client import — documented in `.env.example`.

### Phase 4 — Cursor-based message pagination
1. **`getMessages.ts`**: page size 50; `orderBy createdAt desc`, `take: 51` to detect more, slice + `.reverse()`; return `{ messages, nextCursor }` where `nextCursor` = oldest id in the batch (or null).
2. **`app/api/messages/route.ts` GET** (new handler): query params `conversationId`, optional `cursor`; validate ids, guard with `getConversationForUser`; Prisma `cursor: { id }, skip: 1` pattern; returns ascending messages ready to prepend.
3. **`page.tsx`**: pass `initialMessages` + `initialCursor` to Body.
4. **`Body.tsx`** rework: `containerRef` + `onScroll` on the existing `overflow-y-auto` div; `nearBottomRef` (within ~100px of bottom); `scrollTop < 50 && cursor && !loadingRef` → load older, prepend with id-dedupe, restore scroll position via `el.scrollTop = el.scrollHeight - prevHeight + prevTop` in `requestAnimationFrame`; incoming `messages:new` only auto-scrolls when own message or already near bottom; initial mount scrolls to bottom once.

### Phase 5 — Error handling
1. **`app/error.tsx`** + **`app/conversations/error.tsx`** (new, `'use client'`, `{ error, reset }`): friendly message + "Try again" button; `console.error` in `useEffect`.
2. **`Form.tsx`**: `await` the axios posts in try/catch; on failure `toast.error('Message failed to send')` and restore the draft via `setValue('message', data.message)`. Same for image upload handler. Toaster already mounted via ToasterContext.

## Files created
`.env.example` · `types/next-auth.d.ts` · `app/libs/validations.ts` · `app/libs/getConversationForUser.ts` · `app/libs/channels.ts` · `app/api/pusher/auth/route.ts` (replaces deleted `pages/api/pusher/auth.ts`) · `app/error.tsx` · `app/conversations/error.tsx`

## Files modified
`auth.ts` · `app/libs/pusher.ts` · `app/api/messages/route.ts` · `app/api/conversations/route.ts` · `app/api/conversations/[conversationId]/seen/route.ts` · `app/api/conversations/[conversationId]/route.ts` · `app/api/register/route.ts` · `app/api/settings/route.ts` · `app/actions/getMessages.ts` · `app/actions/getConversationsById.ts` · `app/conversations/[conversationId]/page.tsx` · `Body.tsx` · `Form.tsx` · `app/conversations/components/ConversationList.tsx` · `app/components/Avatar.tsx` · `Header.tsx` · `ProfileDrawer.tsx`

## Verification (manual, two browsers A/B)
1. **Session**: log in via credentials AND Google/GitHub; `session.data.user.id` is a 24-char hex Mongo id both ways.
2. **IDOR closed**: as A, take a conversation id belonging only to B+C: `POST /api/messages` → 403; `POST .../seen` → 403; visit `/conversations/<id>` → EmptyState. Garbage id → 400, not 500.
3. **Pusher auth**: DevTools console `pusherClient.subscribe('private-user-<B's id>')` and a foreign `private-conversation-*` → 403 subscription_error; own channels + presence → 200.
4. **Realtime intact**: A↔B same conversation — text + image send live both directions, sidebar last-message updates, seen receipts, new group pops into B's sidebar, delete removes live.
5. **Presence**: green dot / "Active" still works (now id-keyed).
6. **Validation**: bad email / short password → 400; register response has no `hashedPassword`; duplicate email → 409; settings save succeeds without error toast; empty message → 400.
7. **Pagination**: >50-message conversation loads latest 50; scroll-top loads older with position preserved; stops at first message; incoming message while scrolled up does NOT yank view; own message does.
8. **Errors**: temporary throw in a server component → boundary renders, "Try again" works; kill network + send → toast, draft restored.
9. **Env**: fresh `.env` from `.env.example` boots; Pusher connects (env cluster); upload works (env preset). `npm run build` passes (confirms Pages/App router conflict resolved).
10. **Deps**: `npm ls next` shows a single patched 15.x version (no CVE-2025-66478 warning on install); `npm audit` shows no critical findings.

## Post-implementation notes (2026-07-14)

- **Not yet done**: steps 1, 3, 4, 5, 6, 7 above require a logged-in browser session (or two, for cross-user checks) and haven't been run — do this manually before treating the app as done. Restart the dev server first (`auth.ts` callbacks and the two new `.env` vars need a fresh process, not just hot-reload).
- **`npm audit`**: 22 → 7 vulnerabilities after the Next.js upgrade + `npm audit fix`. Remaining: `postcss` (bundled inside `next@15.5.20` itself, no upstream fix yet — not actionable from this repo), and `tar`/`bcrypt` (fixable only via `npm audit fix --force`, which bumps `bcrypt` to `6.0.0`, a breaking major version — deliberately left alone since it's auth-critical; do this deliberately, not as a drive-by fix).
- **MessageBox.tsx `isOwn`**: left on the existing email-based check (`session.data?.user?.email === data.sender.email`) rather than switching to `senderId === session.user.id` — it still works correctly since `sender.email` is always populated, and the file already had heavy UI-redesign changes in flight that weren't worth re-touching for an optional, non-functional change.
- **`useActiveChannel.ts`**: left unchanged (still subscribes to the literal `'presence-messenger'` string rather than importing `PRESENCE_CHANNEL` from `channels.ts`) — functionally identical, just not using the shared constant. Low-priority cleanup if you touch that file again.
