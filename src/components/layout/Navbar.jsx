import { Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useThemeStore } from '../../store/themeStore';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'All Orders',
  '/admin/orders/new': 'Create New Order',
};

export default function Navbar({ onMenuClick }) {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { pathname } = useLocation();

  const title = pageTitles[pathname] ||
    (pathname.includes('/invoice') ? 'Invoice' : 'Order Details');

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
