import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  XMarkIcon,
  ScissorsIcon,
  UsersIcon,
  CalendarDaysIcon,
  CubeIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  BuildingStorefrontIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/admin/orders', label: 'All Orders', icon: ClipboardDocumentListIcon },
  { to: '/admin/orders/new', label: 'New Order', icon: PlusCircleIcon },
  { to: '/admin/customers', label: 'Customers', icon: UsersIcon },
  { to: '/admin/calendar', label: 'Deadlines', icon: CalendarDaysIcon },
  { heading: 'Store' },
  { to: '/admin/inventory', label: 'Inventory', icon: CubeIcon },
  { to: '/admin/purchases', label: 'Purchases', icon: ShoppingCartIcon },
  { to: '/admin/sales', label: 'Sales', icon: BanknotesIcon },
  { to: '/admin/business', label: 'Business', icon: ChartBarSquareIcon },
];

const superadminNav = [
  { to: '/admin/tenants', label: 'Tailor Tenants', icon: BuildingStorefrontIcon },
  { to: '/admin/agents', label: 'Agents', icon: IdentificationIcon },
];

const agentNav = [
  { to: '/admin/tenants', label: 'My Tailor Tenants', icon: BuildingStorefrontIcon },
];

const navForRole = (role) => {
  if (role === 'superadmin') return superadminNav;
  if (role === 'agent') return agentNav;
  return adminNav;
};

const panelLabelForRole = (role) => {
  if (role === 'superadmin') return 'Platform Admin';
  if (role === 'agent') return 'Agent Panel';
  return 'Admin Panel';
};

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const navItems = navForRole(user?.role);
  const panelLabel = panelLabelForRole(user?.role);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-[65px] border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <ScissorsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">Tailor Tracker</h1>
              <p className="text-xs text-gray-400 mt-0.5">{panelLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) =>
            item.heading ? (
              <p key={item.heading} className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 pt-4 pb-1">
                {item.heading}
              </p>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
