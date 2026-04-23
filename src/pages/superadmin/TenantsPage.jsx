import { useEffect, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { tenantAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const emptyForm = { name: '', email: '', shopName: '', phone: '', password: '' };

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', tenant? }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [credsModal, setCredsModal] = useState(null); // { email, password }

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await tenantAPI.getAll(q ? { search: q } : {});
      setTenants(data.data || []);
    } catch {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTenants(search.trim());
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ mode: 'create' });
  };

  const openEdit = (tenant) => {
    setForm({
      name: tenant.name || '',
      email: tenant.email || '',
      shopName: tenant.shopName || '',
      phone: tenant.phone || '',
      password: '',
    });
    setModal({ mode: 'edit', tenant });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          shopName: form.shopName.trim(),
          phone: form.phone.trim(),
        };
        if (form.password.trim()) payload.password = form.password.trim();
        const { data } = await tenantAPI.create(payload);
        toast.success('Tailor tenant created');
        setModal(null);
        setForm(emptyForm);
        if (data?.data?.generatedPassword) {
          setCredsModal({ email: data.data.email, password: data.data.generatedPassword });
        }
        fetchTenants(search.trim());
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          shopName: form.shopName.trim(),
          phone: form.phone.trim(),
        };
        if (form.password.trim()) payload.password = form.password.trim();
        await tenantAPI.update(modal.tenant._id, payload);
        toast.success('Tenant updated');
        setModal(null);
        setForm(emptyForm);
        fetchTenants(search.trim());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tenant) => {
    try {
      await tenantAPI.toggleStatus(tenant._id, !tenant.isActive);
      toast.success(tenant.isActive ? 'Tenant deactivated' : 'Tenant activated');
      fetchTenants(search.trim());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Delete tenant "${tenant.name}" (${tenant.email})? This cannot be undone.`)) return;
    try {
      await tenantAPI.delete(tenant._id);
      toast.success('Tenant deleted');
      fetchTenants(search.trim());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleResetPassword = async (tenant) => {
    if (!window.confirm(`Generate a new password for "${tenant.email}"?`)) return;
    try {
      const { data } = await tenantAPI.resetPassword(tenant._id);
      if (data?.data?.generatedPassword) {
        setCredsModal({ email: data.data.email, password: data.data.generatedPassword });
      }
      toast.success('Password reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tailor Tenants</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tenants.length} tenant{tenants.length === 1 ? '' : 's'} registered
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Tenant
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search name, email, shop or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : tenants.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No tailor tenants yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            <PlusIcon className="w-4 h-4" /> Create the first tenant
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">Tenant</th>
                <th className="text-left px-4 py-3">Shop</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tenants.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.shopName || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{t.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <CheckCircleIcon className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <XCircleIcon className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(t)}
                        className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          t.isActive ? 'text-amber-600' : 'text-green-600'
                        }`}
                        title={t.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {t.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(t)}
                        className="p-1.5 rounded text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Reset password"
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {modal.mode === 'create' ? 'Add Tailor Tenant' : 'Edit Tenant'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Owner name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Shop name</label>
                <input
                  className="input"
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">
                  {modal.mode === 'create' ? 'Password (optional)' : 'New password (optional)'}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={
                    modal.mode === 'create'
                      ? 'Leave blank to auto-generate'
                      : 'Leave blank to keep current password'
                  }
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 6 characters. You'll see the password once after saving.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Tenant' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials modal (shown once after create / reset-password) */}
      {credsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Tenant Credentials</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Copy and share with the tenant now — this password won't be shown again.
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="label">Email</label>
                <div className="flex items-center gap-2">
                  <input className="input flex-1" value={credsModal.email} readOnly />
                  <button
                    type="button"
                    onClick={() => copy(credsModal.email)}
                    className="btn-secondary px-3"
                    title="Copy email"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 font-mono"
                    value={credsModal.password}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => copy(credsModal.password)}
                    className="btn-secondary px-3"
                    title="Copy password"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setCredsModal(null)} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
