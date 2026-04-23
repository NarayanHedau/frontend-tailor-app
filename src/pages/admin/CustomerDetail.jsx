import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MEASUREMENT_FIELDS = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length', 'neck', 'inseam', 'thigh'];
const PROFILE_LABELS = ['Shirt', 'Pant', 'Suit', 'Kurta', 'Blouse', 'Dress', 'Jacket', 'Other'];

const emptyProfile = () => ({
  label: 'Shirt',
  chest: '', waist: '', hips: '', shoulder: '', sleeve: '',
  length: '', neck: '', inseam: '', thigh: '', notes: '',
});

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile());
  const [saving, setSaving] = useState(false);

  const sanitizeMeasurementValue = (value) => {
    if (value === '') return '';
    const cleaned = value.replace(/[^0-9.]/g, '');
    const [integer, ...decimals] = cleaned.split('.');
    return integer + (decimals.length > 0 ? `.${decimals.join('')}` : '');
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const fetchCustomer = async () => {
    try {
      const { data } = await customerAPI.getById(id);
      setCustomer(data.data);
    } catch {
      toast.error('Failed to load customer');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...profileForm,
        ...Object.fromEntries(
          MEASUREMENT_FIELDS.map((f) => [f, profileForm[f] === '' ? 0 : Number(profileForm[f])])
        ),
      };

      if (editingProfile) {
        await customerAPI.updateProfile(id, editingProfile, payload);
        toast.success('Profile updated');
      } else {
        await customerAPI.addProfile(id, payload);
        toast.success('Profile added');
      }
      setShowProfileForm(false);
      setEditingProfile(null);
      setProfileForm(emptyProfile());
      fetchCustomer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile._id);
    setProfileForm({
      label: profile.label,
      ...Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f, profile[f] || ''])),
      notes: profile.notes || '',
    });
    setShowProfileForm(true);
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Delete this measurement profile?')) return;
    try {
      await customerAPI.deleteProfile(id, profileId);
      toast.success('Profile deleted');
      fetchCustomer();
    } catch {
      toast.error('Failed to delete profile');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!customer) return null;

  const profiles = customer.measurement_profiles || [];
  const orders = customer.orders || [];
  const stats = customer.stats || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/customers')} className="btn-secondary p-2">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{customer.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <Link to="/admin/orders/new" className="btn-primary text-sm">
          <PlusIcon className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Contact & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
            Contact Info
          </h3>
          <div className="space-y-2">
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <PhoneIcon className="w-4 h-4" /> {customer.phone}
            </a>
            {customer.email && (
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" /> {customer.email}
              </p>
            )}
            {customer.address && (
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <MapPinIcon className="w-4 h-4 text-gray-400" /> {customer.address}
              </p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
            Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalOrders || 0}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats.totalSpent || 0)}</p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(stats.totalPaid || 0)}</p>
              <p className="text-xs text-gray-500">Total Paid</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.pendingAmount || 0)}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement Profiles */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            Measurement Profiles ({profiles.length})
          </h3>
          <button
            onClick={() => {
              setEditingProfile(null);
              setProfileForm(emptyProfile());
              setShowProfileForm(!showProfileForm);
            }}
            className="btn-primary text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Profile
          </button>
        </div>

        {/* Profile Form */}
        {showProfileForm && (
          <form onSubmit={handleSaveProfile} className="p-5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <label className="label">Profile Type</label>
                <select
                  className="input"
                  value={profileForm.label}
                  onChange={(e) => setProfileForm({ ...profileForm, label: e.target.value })}
                >
                  {PROFILE_LABELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
              {MEASUREMENT_FIELDS.map((field) => (
                <div key={field}>
                  <label className="label capitalize">{field} (in)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    className="input"
                    placeholder="0"
                    value={profileForm[field]}
                    onChange={(e) => setProfileForm({ ...profileForm, [field]: sanitizeMeasurementValue(e.target.value) })}
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="label">Notes</label>
              <input
                type="text"
                className="input"
                placeholder="Any notes about these measurements..."
                value={profileForm.notes}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowProfileForm(false); setEditingProfile(null); }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : editingProfile ? 'Update Profile' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Profiles List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {profiles.length === 0 && !showProfileForm && (
            <p className="px-5 py-6 text-center text-gray-400 text-sm">
              No measurement profiles saved yet. Add one to auto-fill measurements in future orders.
            </p>
          )}
          {profiles.map((profile) => (
            <div key={profile._id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-semibold">
                    {profile.label}
                  </span>
                  <span className="text-xs text-gray-400">Updated {formatDate(profile.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditProfile(profile)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteProfile(profile._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {MEASUREMENT_FIELDS.map((field) =>
                  profile[field] ? (
                    <div key={field} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400 capitalize">{field}</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{profile[field]}"</p>
                    </div>
                  ) : null
                )}
              </div>
              {profile.notes && (
                <p className="mt-2 text-xs text-gray-500">Note: {profile.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Order History ({orders.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-6 py-3 text-gray-500 font-medium">Order #</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Date</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Items</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Amount</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-3 font-mono text-blue-600 font-medium">{order.order_number}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(order.order_date)}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                    {order.items?.map((i) => i.type).join(', ')}
                  </td>
                  <td className="px-6 py-3 font-medium">{formatCurrency(order.invoice?.total_amount || 0)}</td>
                  <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-3">
                    <Link to={`/admin/orders/${order._id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No orders yet.
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
