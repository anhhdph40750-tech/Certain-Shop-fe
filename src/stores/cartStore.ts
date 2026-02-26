import { create } from 'zustand';

interface CartState {
  count: number;
  setCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  count: 0,
  setCount: (count) => set({ count }),
  increment: () => set({ count: get().count + 1 }),
  decrement: () => set({ count: Math.max(0, get().count - 1) }),
}));
