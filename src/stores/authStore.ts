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
  isSuperAdmin: () => boolean;
  isNhanVien: () => boolean;
}

// Enterprise pattern: force login on new browser session.
// localStorage keeps state across page refreshes (good UX),
// but a sessionStorage flag detects when the browser was fully closed.
// On new browser session: flag is absent → clear auth → force login.
// On page refresh: flag exists → auth is valid → stay logged in.
const SESSION_FLAG = 'app-session-active';
const isNewBrowserSession = !sessionStorage.getItem(SESSION_FLAG);
if (isNewBrowserSession) {
  localStorage.removeItem('auth-storage');
  sessionStorage.setItem(SESSION_FLAG, '1');
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
        return role === 'ADMIN' || role === 'SUPER_ADMIN';
      },

      isSuperAdmin: () => {
        const role = get().user?.vaiTro;
        return role === 'SUPER_ADMIN';
      },

      isNhanVien: () => {
        const role = get().user?.vaiTro;
        return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'NHAN_VIEN';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
