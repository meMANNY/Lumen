import { create } from 'zustand'
import { FullMessageType } from '@/app/types'

// The message currently being replied to (set from MessageBox, consumed by Form)
interface ReplyStore {
  replyTo: FullMessageType | null;
  setReplyTo: (message: FullMessageType) => void;
  clear: () => void;
}

const useReply = create<ReplyStore>((set) => ({
  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),
  clear: () => set({ replyTo: null }),
}));

export default useReply;
