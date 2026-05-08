import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import ForgotPasswordPage from './pages/admin/ForgotPasswordPage';
import ResetPasswordPage from './pages/admin/ResetPasswordPage';
import Dashboard from './pages/admin/Dashboard';
import CreateOrder from './pages/admin/CreateOrder';
import OrdersList from './pages/admin/OrdersList';
import OrderDetails from './pages/admin/OrderDetails';
import InvoicePage from './pages/admin/InvoicePage';
import CustomersList from './pages/admin/CustomersList';
import CustomerDetail from './pages/admin/CustomerDetail';
import CalendarPage from './pages/admin/CalendarPage';
import InventoryPage from './pages/admin/InventoryPage';
import PurchasesPage from './pages/admin/PurchasesPage';
import SalesPage from './pages/admin/SalesPage';
import BusinessOverview from './pages/admin/BusinessOverview';
import TenantsPage from './pages/superadmin/TenantsPage';
import AgentsPage from './pages/superadmin/AgentsPage';
import TrackingPage from './pages/customer/TrackingPage';
import InvoiceViewPage from './pages/customer/InvoiceViewPage';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/admin/login" replace />;
};

const landingPathForRole = (role) => {
  if (role === 'superadmin' || role === 'agent') return '/admin/tenants';
  return '/admin/dashboard';
};

const RoleRoute = ({ allow, children }) => {
  const { user } = useAuthStore();
  if (!user) return null;
  if (!allow.includes(user.role)) {
    return <Navigate to={landingPathForRole(user.role)} replace />;
  }
  return children;
};

const RoleIndexRedirect = () => {
  const { user } = useAuthStore();
  return <Navigate to={landingPathForRole(user?.role)} replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public customer tracking */}
      <Route path="/track/:trackingId" element={<TrackingPage />} />
      <Route path="/stitch-invoice/track/public/:trackingId" element={<TrackingPage />} />
      <Route path="/stitch-invoice/view/public/:trackingId" element={<InvoiceViewPage />} />

      {/* Admin login + public password reset flow */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

      {/* Protected admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleIndexRedirect />} />

        {/* SuperAdmin & Agent — tenant management */}
        <Route path="tenants" element={<RoleRoute allow={['superadmin', 'agent']}><TenantsPage /></RoleRoute>} />

        {/* SuperAdmin only — agent management */}
        <Route path="agents" element={<RoleRoute allow={['superadmin']}><AgentsPage /></RoleRoute>} />

        {/* Admin/Tailor only — tailor-shop operations */}
        <Route path="dashboard" element={<RoleRoute allow={['admin', 'tailor']}><Dashboard /></RoleRoute>} />
        <Route path="orders" element={<RoleRoute allow={['admin', 'tailor']}><OrdersList /></RoleRoute>} />
        <Route path="orders/new" element={<RoleRoute allow={['admin', 'tailor']}><CreateOrder /></RoleRoute>} />
        <Route path="orders/:id" element={<RoleRoute allow={['admin', 'tailor']}><OrderDetails /></RoleRoute>} />
        <Route path="orders/:id/invoice" element={<RoleRoute allow={['admin', 'tailor']}><InvoicePage /></RoleRoute>} />
        <Route path="customers" element={<RoleRoute allow={['admin', 'tailor']}><CustomersList /></RoleRoute>} />
        <Route path="customers/:id" element={<RoleRoute allow={['admin', 'tailor']}><CustomerDetail /></RoleRoute>} />
        <Route path="calendar" element={<RoleRoute allow={['admin', 'tailor']}><CalendarPage /></RoleRoute>} />
        <Route path="inventory" element={<RoleRoute allow={['admin', 'tailor']}><InventoryPage /></RoleRoute>} />
        <Route path="purchases" element={<RoleRoute allow={['admin', 'tailor']}><PurchasesPage /></RoleRoute>} />
        <Route path="sales" element={<RoleRoute allow={['admin', 'tailor']}><SalesPage /></RoleRoute>} />
        <Route path="business" element={<RoleRoute allow={['admin', 'tailor']}><BusinessOverview /></RoleRoute>} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
