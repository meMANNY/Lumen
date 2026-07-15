# Lumen — a real-time messenger

A full-featured, real-time chat application built as a personal project. Dark, glassy "Lumen" design system, WhatsApp-style feature set, and live everything — typing, presence, reactions, and notifications.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Prisma + MongoDB**, **NextAuth v5**, **Pusher**, **Cloudinary**, and **Tailwind CSS**.

## Features

### Messaging
- Real-time 1-on-1 and group messaging (Pusher private channels)
- Message replies/quotes with jump-to-original
- Emoji reactions (one per person, WhatsApp-style)
- Edit your own messages (with an "edited" label)
- Delete for me / delete for everyone (tombstone)
- Voice notes (MediaRecorder → Cloudinary)
- Image sharing with lightbox, plus generic file attachments
- Link previews (server-side OpenGraph cards)
- Emoji picker in the composer
- Seen receipts with avatars, plus ✓ / ✓✓ delivery ticks
- Unread-messages divider and a jump-to-latest button
- Infinite scroll with cursor pagination

### Conversations
- Typing indicator ("Maya is typing…")
- Online presence and "last seen 2 hours ago"
- In-conversation message search with match navigation and highlighting
- Pin conversations (pinned section on top)
- Archive conversations (separate Archived view, per user)
- Mute conversations (no badges, no notifications)
- Star messages, with a Starred panel in the shared space
- Unread badges, unread filter, and inbox search (⌘K)
- Browser notifications for messages arriving while the tab is hidden
- Per-conversation chat wallpapers

### Groups
- Group creation with multi-select member picker
- Group admins: the creator is admin; admins add/remove members and promote new admins
- Leave group (auto-promotes a new admin if the last one leaves)

### Accounts & UI
- Credentials, GitHub, and Google sign-in (NextAuth v5, JWT sessions)
- Profile settings with Cloudinary avatar upload
- Gradient initials avatars for users without a photo
- Fully responsive — desktop rail, tablet split view, mobile bottom tabs with swipe-to-archive
- Alphabetical user directory with search

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# MongoDB (e.g. MongoDB Atlas connection string)
DATABASE_URL=

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=

# GitHub OAuth (create a dev OAuth app with callback
# http://localhost:3000/api/auth/callback/github)
GITHUB_ID=
GITHUB_SECRET=

# Google OAuth (authorized redirect URI
# http://localhost:3000/api/auth/callback/google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Pusher (Channels app)
PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_APP_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Cloudinary (unsigned upload preset)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Notes:
- OAuth is optional — email/password registration works without it.
- Pusher powers all real-time features (messages, typing, presence, notifications).
- Cloudinary powers image, file, voice-note, and avatar uploads.

### 3. Sync the database

```bash
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and start chatting. To test real-time features, open a second account in an incognito window side by side.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |
| `npx prisma db push` | Sync the Prisma schema to MongoDB |
| `npx prisma studio` | Browse the database in a GUI |

## Project structure

```
app/
├── (site)/                 # Login / register page
├── actions/                # Server-side data fetchers (conversations, messages, users)
├── api/                    # Route handlers (auth, messages, conversations, pusher, users)
├── components/             # Shared UI (modals, inputs, avatars, sidebar)
├── conversations/          # Inbox list + chat view (header, body, composer, drawer)
├── users/                  # User directory
├── hooks/                  # Zustand stores + helpers (search, reply, edit, wallpaper…)
├── libs/                   # Prisma, Pusher, validation schemas, link previews
└── types/                  # Shared TypeScript types
prisma/
└── schema.prisma           # User / Conversation / Message models (MongoDB)
```

## Notes & known limitations

- In-conversation search covers currently loaded messages (older pages load as you scroll).
- Link previews fetch arbitrary URLs server-side — fine for a personal project, but review before any public deployment (SSRF).
- Browser notifications require the tab to be open in the background; there is no service-worker push.
- Delivery ticks show sent (✓) and seen (✓✓); there is no separate "delivered" tier.

## License

Personal project — no license specified.
