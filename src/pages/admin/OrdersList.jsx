import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PlusIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'];

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getAll({ search, status, page, limit: 15 });
      setOrders(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(1), 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by order number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              className="input w-40"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s || 'All Status'}</option>
              ))}
            </select>
          </div>
          <Link to="/admin/orders/new" className="btn-primary flex-shrink-0">
            <PlusIcon className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order #</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Delivery</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-5 py-3 font-mono text-primary-600 font-medium text-xs">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {order.customer_id?.name}
                        </div>
                        <div className="text-gray-400 text-xs">{order.customer_id?.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-primary-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${order.progress?.percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {order.progress?.completed}/{order.progress?.total}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {formatDate(order.delivery_date)}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">
                        {formatCurrency(order.invoice?.total_amount || 0)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View order"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/orders/${order._id}/invoice`}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View invoice"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                        No orders found.{' '}
                        <Link to="/admin/orders/new" className="text-primary-600">Create one</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
                <span className="text-gray-500">{pagination.total} total orders</span>
                <div className="flex gap-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchOrders(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        p === pagination.page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
