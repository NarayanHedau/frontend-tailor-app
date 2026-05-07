import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import {
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function DaysLabel({ date }) {
  const days = getDaysUntil(date);
  if (days === null) return <span className="text-gray-400">—</span>;
  if (days < 0)
    return <span className="text-red-600 font-semibold">{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="text-orange-600 font-semibold">Today</span>;
  if (days === 1) return <span className="text-orange-500 font-semibold">Tomorrow</span>;
  return <span className="text-gray-600 dark:text-gray-300">{days} days left</span>;
}

function OrderRow({ order, dateField, dateLabel }) {
  const dateValue = order[dateField];
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-5 py-3">
        <Link to={`/admin/orders/${order._id}`} className="font-mono text-primary-600 font-medium hover:text-primary-700">
          {order.order_number}
        </Link>
      </td>
      <td className="px-5 py-3">
        <div className="font-medium text-gray-800 dark:text-white">{order.customer_id?.name}</div>
        <div className="text-xs text-gray-400">{order.customer_id?.phone}</div>
      </td>
      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{formatDate(dateValue)}</td>
      <td className="px-5 py-3"><DaysLabel date={dateValue} /></td>
      <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
      <td className="px-5 py-3 text-xs text-gray-500">
        {order.progress?.completed}/{order.progress?.total} ready
      </td>
      <td className="px-5 py-3">
        <Link to={`/admin/orders/${order._id}`} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
          View
        </Link>
      </td>
    </tr>
  );
}

function SectionTable({ title, icon: Icon, iconColor, orders, dateField, dateLabel, emptyText }) {
  if (orders.length === 0) return null;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
        <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2.5 py-0.5 font-medium">
          {orders.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
              <th className="px-5 py-3 text-gray-500 font-medium">Order #</th>
              <th className="px-5 py-3 text-gray-500 font-medium">Customer</th>
              <th className="px-5 py-3 text-gray-500 font-medium">{dateLabel}</th>
              <th className="px-5 py-3 text-gray-500 font-medium">Time Left</th>
              <th className="px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="px-5 py-3 text-gray-500 font-medium">Progress</th>
              <th className="px-5 py-3 text-gray-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {orders.map((order) => (
              <OrderRow key={order._id} order={order} dateField={dateField} dateLabel={dateLabel} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      const { data: res } = await orderAPI.getDeadlines();
      setData(res.data);
    } catch {
      toast.error('Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const { overdue = [], upcomingTrials = [], upcomingDeliveries = [], summary = {} } = data || {};

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'overdue', label: `Overdue (${summary.overdueCount || 0})` },
    { key: 'trials', label: `Trials (${summary.upcomingTrialsCount || 0})` },
    { key: 'deliveries', label: `Deliveries (${summary.upcomingDeliveriesCount || 0})` },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <CalendarDaysIcon className="w-6 h-6 text-primary-600" />
          Deadlines & Calendar
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upcoming trials, deliveries, and overdue orders
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`card p-4 ${overdue.length > 0 ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.overdueCount || 0}</p>
              <p className="text-xs text-gray-500">Overdue Orders</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{summary.upcomingTrialsCount || 0}</p>
              <p className="text-xs text-gray-500">Upcoming Trials (14 days)</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{summary.upcomingDeliveriesCount || 0}</p>
              <p className="text-xs text-gray-500">Upcoming Deliveries (14 days)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {(tab === 'all' || tab === 'overdue') && (
          <SectionTable
            title="Overdue Orders"
            icon={ExclamationTriangleIcon}
            iconColor="text-red-500"
            orders={overdue}
            dateField="delivery_date"
            dateLabel="Delivery Date"
            emptyText="No overdue orders"
          />
        )}
        {(tab === 'all' || tab === 'trials') && (
          <SectionTable
            title="Upcoming Trials"
            icon={ClockIcon}
            iconColor="text-yellow-500"
            orders={upcomingTrials}
            dateField="trial_date"
            dateLabel="Trial Date"
            emptyText="No upcoming trials"
          />
        )}
        {(tab === 'all' || tab === 'deliveries') && (
          <SectionTable
            title="Upcoming Deliveries"
            icon={TruckIcon}
            iconColor="text-primary-500"
            orders={upcomingDeliveries}
            dateField="delivery_date"
            dateLabel="Delivery Date"
            emptyText="No upcoming deliveries"
          />
        )}

        {tab === 'all' && overdue.length === 0 && upcomingTrials.length === 0 && upcomingDeliveries.length === 0 && (
          <div className="card p-10 text-center">
            <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming deadlines. All clear!</p>
          </div>
        )}
      </div>
    </div>
  );
}
