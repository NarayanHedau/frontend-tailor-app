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
  EnvelopeIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { agentAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const emptyForm = { name: '', email: '', phone: '', password: '' };

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', agent? }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [credsModal, setCredsModal] = useState(null); // { email, password, emailDelivery }

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await agentAPI.getAll(q ? { search: q } : {});
      setAgents(data.data || []);
    } catch {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAgents(search.trim());
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ mode: 'create' });
  };

  const openEdit = (agent) => {
    setForm({
      name: agent.name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      password: '',
    });
    setModal({ mode: 'edit', agent });
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
          phone: form.phone.trim(),
        };
        if (form.password.trim()) payload.password = form.password.trim();
        const { data } = await agentAPI.create(payload);
        toast.success(data.message || 'Agent created');
        setModal(null);
        setForm(emptyForm);
        if (data?.data?.generatedPassword) {
          setCredsModal({
            email: data.data.email,
            password: data.data.generatedPassword,
            emailDelivery: data.data.emailDelivery,
          });
        }
        fetchAgents(search.trim());
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        };
        if (form.password.trim()) payload.password = form.password.trim();
        await agentAPI.update(modal.agent._id, payload);
        toast.success('Agent updated');
        setModal(null);
        setForm(emptyForm);
        fetchAgents(search.trim());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (agent) => {
    try {
      await agentAPI.toggleStatus(agent._id, !agent.isActive);
      toast.success(agent.isActive ? 'Agent deactivated' : 'Agent activated');
      fetchAgents(search.trim());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.name}" (${agent.email})? This cannot be undone.`)) return;
    try {
      await agentAPI.delete(agent._id);
      toast.success('Agent deleted');
      fetchAgents(search.trim());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleResetPassword = async (agent) => {
    if (!window.confirm(`Generate a new password for "${agent.email}"?`)) return;
    try {
      const { data } = await agentAPI.resetPassword(agent._id);
      if (data?.data?.generatedPassword) {
        setCredsModal({
          email: data.data.email,
          password: data.data.generatedPassword,
          emailDelivery: data.data.emailDelivery,
        });
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Agents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {agents.length} agent{agents.length === 1 ? '' : 's'} — they can onboard tailor tenants
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search name, email or phone..."
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
      ) : agents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No agents yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            <PlusIcon className="w-4 h-4" /> Create the first agent
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">Agent</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Tenants Created</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {agents.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white">{a.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        (a.tenantCount || 0) > 0
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                      {a.tenantCount || 0}
                      <span className="hidden sm:inline">
                        {(a.tenantCount || 0) === 1 ? 'tenant' : 'tenants'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <CheckCircleIcon className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <XCircleIcon className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(a)}
                        className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          a.isActive ? 'text-amber-600' : 'text-green-600'
                        }`}
                        title={a.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {a.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(a)}
                        className="p-1.5 rounded text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Reset password"
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
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
                {modal.mode === 'create' ? 'Add Agent' : 'Edit Agent'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
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
                {modal.mode === 'create' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Credentials will be emailed here (if SMTP is configured).
                  </p>
                )}
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
                  {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Agent' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials modal */}
      {credsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Agent Credentials</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {credsModal.emailDelivery?.sent
                  ? 'These credentials have been emailed to the agent. Shown here for your reference — won\'t be shown again.'
                  : 'Email delivery skipped. Copy and share these manually — won\'t be shown again.'}
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className={credsModal.emailDelivery?.sent ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                  {credsModal.emailDelivery?.sent ? 'Email sent successfully' : 'Email not sent — share manually'}
                </span>
              </div>
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
