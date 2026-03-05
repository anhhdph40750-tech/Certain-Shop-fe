import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
  isAdmin: () => boolean;
  isNhanVien: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

      logout: () => {
        set({ token: null, user: null });
      },

      isLoggedIn: () => !!get().token,

      isAdmin: () => {
        const role = get().user?.vaiTro;
        return role === 'ADMIN';
      },

      isNhanVien: () => {
        const role = get().user?.vaiTro;
        return role === 'ADMIN' || role === 'NHAN_VIEN';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
