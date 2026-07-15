import { create } from 'zustand'

// Per-conversation chat backgrounds, persisted in localStorage (purely client-side).
export const WALLPAPERS: Record<string, { label: string; className: string; swatch: string }> = {
  default: {
    label: 'Default',
    className: 'bg-[#070b14] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/10 via-[#070b14] to-[#070b14]',
    swatch: 'bg-[#0b101d]',
  },
  midnight: {
    label: 'Midnight',
    className: 'bg-[#04060c]',
    swatch: 'bg-[#04060c]',
  },
  violet: {
    label: 'Violet haze',
    className: 'bg-[#0b0a16] bg-[radial-gradient(circle_at_20%_10%,rgba(117,80,219,0.18),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(139,63,122,0.14),transparent_45%)]',
    swatch: 'bg-gradient-to-br from-violet-900 to-[#0b0a16]',
  },
  forest: {
    label: 'Forest',
    className: 'bg-[#06110d] bg-[radial-gradient(circle_at_25%_15%,rgba(16,185,129,0.12),transparent_45%)]',
    swatch: 'bg-gradient-to-br from-emerald-900 to-[#06110d]',
  },
  ember: {
    label: 'Ember',
    className: 'bg-[#140b08] bg-[radial-gradient(circle_at_75%_15%,rgba(251,146,60,0.12),transparent_45%)]',
    swatch: 'bg-gradient-to-br from-orange-900 to-[#140b08]',
  },
  ocean: {
    label: 'Ocean',
    className: 'bg-[#060d16] bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_45%)]',
    swatch: 'bg-gradient-to-br from-sky-900 to-[#060d16]',
  },
};

interface WallpaperStore {
  byConversation: Record<string, string>;
  hydrate: (conversationId: string) => void;
  setWallpaper: (conversationId: string, key: string) => void;
}

const useWallpaper = create<WallpaperStore>((set) => ({
  byConversation: {},
  hydrate: (conversationId) => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(`wallpaper:${conversationId}`);
    if (stored && WALLPAPERS[stored]) {
      set((state) => ({ byConversation: { ...state.byConversation, [conversationId]: stored } }));
    }
  },
  setWallpaper: (conversationId, key) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`wallpaper:${conversationId}`, key);
    }
    set((state) => ({ byConversation: { ...state.byConversation, [conversationId]: key } }));
  },
}));

export default useWallpaper;
