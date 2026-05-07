import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEMES = [
  { id: 'default', label: 'Royal Blue',   swatches: ['#2563eb', '#3b82f6', '#dbeafe'] },
  { id: 'forest',  label: 'Forest Green', swatches: ['#27664b', '#4c9e79', '#d1e8dc'] },
  { id: 'maroon',  label: 'Maroon',       swatches: ['#a12020', '#e25858', '#fbd7d7'] },
  { id: 'navy',    label: 'Navy & Gold',  swatches: ['#19408a', '#4777c8', '#d3e0f7'] },
];

const VALID_THEMES = THEMES.map((t) => t.id);

const applyTheme = (themeId, darkMode) => {
  const root = document.documentElement;
  // Remove any previous theme-* class, add the new one.
  VALID_THEMES.forEach((id) => root.classList.remove(`theme-${id}`));
  root.classList.add(`theme-${themeId}`);
  root.classList.toggle('dark', darkMode);
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      theme: 'default',

      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        applyTheme(get().theme, next);
      },

      setTheme: (themeId) => {
        if (!VALID_THEMES.includes(themeId)) return;
        set({ theme: themeId });
        applyTheme(themeId, get().darkMode);
      },

      initTheme: () => {
        const { darkMode, theme } = get();
        const safeTheme = VALID_THEMES.includes(theme) ? theme : 'default';
        applyTheme(safeTheme, darkMode);
      },
    }),
    { name: 'tailor-theme' }
  )
);
