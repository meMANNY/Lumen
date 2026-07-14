# Chat Application Redesign Changes

This document records the UI modernization applied to the chat application redesign.

## Visual Direction

The interface now follows an **editorial dark-workspace** direction: ink-black surfaces, muted violet highlights, warm profile accents, and a layered ambient background. The goal is to make the product feel calm, premium, and expressive without reducing message readability.

## Background Treatment

- Replaced the flat page background with a deep `#090b14` ink tone.
- Added multiple low-opacity radial glows in violet, teal, and berry tones.
- Added a subtle grid texture above the background for depth and structure.
- Contained the application in a translucent, bordered workspace with a soft outer shadow.

## Typography

- **Fraunces** for expressive section headings, such as “Conversations”.
- **Manrope** for readable interface and message text.
- **DM Mono** for small labels, dates, keyboard shortcuts, timestamps, and metadata.

This creates clearer hierarchy than using one generic sans-serif family throughout.

## Navigation and App Shell

- Added a desktop icon rail for main navigation, people, notifications, and settings.
- Added a visual active-state marker using a violet side indicator and elevated icon surface.
- Added a dedicated conversation list panel with search, filters, unread counts, and a new-message action.
- Added an optional “Shared space” panel for profile context, pinned notes, and media previews on large screens.

## Conversation List Improvements

- Added avatar color treatments and online presence indicators.
- Introduced an elevated active-conversation state with a violet glow and inset highlight.
- Improved message preview, timestamp, and unread-count hierarchy.
- Added a lightweight AI recap card at the bottom of the list to make the app feel more current and useful.

## Message Experience

- Incoming messages use frosted dark cards with a faint border and asymmetric corner radius.
- Outgoing messages use a violet-to-indigo gradient bubble with delivery/read marks.
- Added a readable date divider between message groups.
- Added a compact file preview card for shared design files.
- Preserved high contrast between content, timestamps, and secondary metadata.

## Composer Updates

- Redesigned the composer as a rounded glass-like surface with a focused border treatment.
- Added attachment and emoji actions.
- Added an elevated violet send button with hover and active feedback.
- Added Enter-to-send behavior and a small keyboard usage hint.

## Responsive Behavior

- The icon rail is hidden below desktop widths.
- The conversation list is hidden below tablet widths, allowing the message thread to take priority.
- The shared-space panel appears only on extra-large screens.

## Design Tokens Updated

The existing Tailwind token contract remains intact. Values in `src/styles/theme.css` were updated to support the new direction, including:

- `--background: #090b14`
- `--card: #12141f`
- `--primary: #c4b5fd`
- `--primary-foreground: #171222`
- `--border: rgba(255, 255, 255, 0.09)`
- `--ring: #a78bfa`
- `--radius: 0.9rem`

## Files Related to the Redesign

- `src/app/App.tsx` — full chat workspace implementation and interactions.
- `src/styles/fonts.css` — Google Font imports.
- `src/styles/theme.css` — updated visual tokens.
