import { create } from 'zustand'

// In-conversation message search (WhatsApp-style).
// Header owns the input; Body computes matches and scrolls to them.
// matchIds are ordered newest-first, so index 0 is the most recent match.
interface ChatSearchStore {
  isOpen: boolean;
  query: string;
  activeIndex: number;
  matchIds: string[];
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setMatchIds: (ids: string[]) => void;
  older: () => void;
  newer: () => void;
}

const useChatSearch = create<ChatSearchStore>((set) => ({
  isOpen: false,
  query: '',
  activeIndex: 0,
  matchIds: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '', activeIndex: 0, matchIds: [] }),
  setQuery: (query) => set({ query, activeIndex: 0 }),
  setMatchIds: (matchIds) => set((state) => ({
    matchIds,
    activeIndex: Math.min(state.activeIndex, Math.max(0, matchIds.length - 1)),
  })),
  older: () => set((state) => ({
    activeIndex: state.matchIds.length
      ? Math.min(state.activeIndex + 1, state.matchIds.length - 1)
      : 0,
  })),
  newer: () => set((state) => ({
    activeIndex: Math.max(state.activeIndex - 1, 0),
  })),
}));

export default useChatSearch;
