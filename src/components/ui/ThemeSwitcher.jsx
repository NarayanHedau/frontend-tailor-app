import { useEffect, useRef, useState } from 'react';
import { SwatchIcon, CheckIcon } from '@heroicons/react/24/outline';
import { THEMES, useThemeStore } from '../../store/themeStore';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Change theme"
      >
        <SwatchIcon className="w-5 h-5" />
        <span
          className="hidden sm:inline-block w-4 h-4 rounded-full border border-white/20 shadow-sm"
          style={{ background: current.swatches[0] }}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
            Color Theme
          </div>
          <ul className="py-1">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      setTheme(t.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex -space-x-1">
                        {t.swatches.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-white dark:border-gray-900 shadow-sm"
                            style={{ background: c }}
                            aria-hidden
                          />
                        ))}
                      </span>
                      <span className="font-medium">{t.label}</span>
                    </span>
                    {active && <CheckIcon className="w-4 h-4 text-primary-600 dark:text-primary-300" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
