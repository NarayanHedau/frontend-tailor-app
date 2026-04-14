import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  PlusIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { orderAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await orderAPI.getStats();
      setStats(data.data);
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Welcome back!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Here's what's happening today.</p>
        </div>
        <Link to="/admin/orders/new" className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={stats?.orders?.total ?? 0}
          icon={ClipboardDocumentListIcon}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={stats?.orders?.pending ?? 0}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          label="In Progress"
          value={stats?.orders?.inProgress ?? 0}
          icon={WrenchScrewdriverIcon}
          color="purple"
        />
        <StatCard
          label="Completed"
          value={stats?.orders?.completed ?? 0}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.revenue?.totalRevenue ?? 0)}
          icon={CurrencyRupeeIcon}
          color="blue"
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats?.revenue?.totalCollected ?? 0)}
          icon={CurrencyRupeeIcon}
          color="green"
          sub="Advance payments received"
        />
        <StatCard
          label="Pending Collection"
          value={formatCurrency(stats?.revenue?.totalPending ?? 0)}
          icon={CurrencyRupeeIcon}
          color="red"
          sub="Outstanding balance"
        />
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Recent Orders</h3>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-6 py-3 text-gray-500 font-medium">Order #</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Customer</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Date</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(stats?.recentOrders ?? []).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-3 font-mono text-blue-600 font-medium">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">
                      {order.customer_id?.name}
                    </div>
                    <div className="text-gray-400 text-xs">{order.customer_id?.phone}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(order.order_date)}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(stats?.recentOrders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No orders yet. <Link to="/admin/orders/new" className="text-blue-600">Create your first order</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
