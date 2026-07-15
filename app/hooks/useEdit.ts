import { create } from 'zustand'
import { FullMessageType } from '@/app/types'

// The message currently being edited (set from MessageBox, consumed by Form)
interface EditStore {
  editing: FullMessageType | null;
  setEditing: (message: FullMessageType) => void;
  clear: () => void;
}

const useEdit = create<EditStore>((set) => ({
  editing: null,
  setEditing: (message) => set({ editing: message }),
  clear: () => set({ editing: null }),
}));

export default useEdit;
