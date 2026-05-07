import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { MagnifyingGlassIcon, PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await customerAPI.getAll({ search, page: pagination.page, limit: 15 });
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await customerAPI.delete(id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Customers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total customers
          </p>
        </div>
        <Link to="/admin/orders/new" className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  <th className="px-6 py-3 text-gray-500 font-medium">Customer</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Phone</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Email</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Orders</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Last Order</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Profiles</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3">
                      <Link
                        to={`/admin/customers/${c._id}`}
                        className="font-medium text-gray-800 dark:text-white hover:text-primary-600"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        {c.phone}
                      </a>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                        {c.orderCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(c.lastOrderDate)}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-gray-500">
                        {c.measurement_profiles?.length || 0} saved
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/customers/${c._id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(c._id, c.name)}
                          className="text-red-500 hover:text-red-600 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
