import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle('dark', next);
      },
      initTheme: () => {
        const { darkMode } = get();
        document.documentElement.classList.toggle('dark', darkMode);
      },
    }),
    { name: 'tailor-theme' }
  )
);
