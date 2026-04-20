import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, orderAPI } from '../../services/api';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ITEM_TYPES = ['Shirt', 'Pant', 'Suit', 'Kurta', 'Blouse', 'Dress', 'Jacket', 'Other'];

const emptyMeasurements = {
  chest: '', waist: '', hips: '', shoulder: '', sleeve: '',
  length: '', neck: '', inseam: '', thigh: '', notes: '',
};

const emptyItem = () => ({
  type: 'Shirt', quantity: 1, price: 0, description: '',
  measurements: { ...emptyMeasurements },
});

export default function CreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [items, setItems] = useState([emptyItem()]);
  const [trialDate, setTrialDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [expandedMeasurements, setExpandedMeasurements] = useState({});

  const [customerProfiles, setCustomerProfiles] = useState([]);

  const searchCustomers = async (q) => {
    if (q.length < 2) { setCustomerResults([]); return; }
    try {
      const { data } = await customerAPI.getAll({ search: q, limit: 5 });
      setCustomerResults(data.data);
    } catch { /* ignore */ }
  };

  // Load measurement profiles when customer is selected
  const selectCustomer = async (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerResults([]);
    try {
      const { data } = await customerAPI.getById(c._id);
      setCustomerProfiles(data.data.measurement_profiles || []);
    } catch { /* ignore */ }
  };

  const applyProfile = (itemIdx, profile) => {
    const updated = [...items];
    const m = {};
    ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length', 'neck', 'inseam', 'thigh'].forEach(
      (f) => { m[f] = profile[f] || ''; }
    );
    m.notes = profile.notes || '';
    updated[itemIdx] = { ...updated[itemIdx], measurements: m };
    setItems(updated);
    setExpandedMeasurements((prev) => ({ ...prev, [itemIdx]: true }));
  };

  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const updateMeasurement = (idx, field, value) => {
    const updated = [...items];
    updated[idx].measurements[field] = value;
    setItems(updated);
  };

  const toggleMeasurements = (idx) => {
    setExpandedMeasurements((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let customerId;

      if (isNewCustomer) {
        if (!newCustomer.name || !newCustomer.phone) {
          toast.error('Customer name and phone are required');
          setLoading(false);
          return;
        }
        try {
          const { data } = await customerAPI.create(newCustomer);
          customerId = data.data._id;
        } catch (err) {
          if (err.response?.status === 409) {
            const existing = err.response.data.existingCustomer;
            const useExisting = window.confirm(
              `Customer "${existing.name}" already exists with phone ${existing.phone}.\n\nClick OK to use the existing customer, or Cancel to go back and edit.`
            );
            if (useExisting) {
              customerId = existing._id;
              setSelectedCustomer(existing);
              setIsNewCustomer(false);
            } else {
              setLoading(false);
              return;
            }
          } else {
            throw err;
          }
        }
      } else {
        if (!selectedCustomer) {
          toast.error('Please select a customer');
          setLoading(false);
          return;
        }
        customerId = selectedCustomer._id;
      }

      const orderData = {
        customer_id: customerId,
        items: items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
          measurements: Object.fromEntries(
            Object.entries(item.measurements).map(([k, v]) => [k, v === '' ? 0 : Number(v) || v])
          ),
        })),
        trial_date: trialDate || undefined,
        delivery_date: deliveryDate || undefined,
        notes,
      };

      const { data } = await orderAPI.create(orderData);
      toast.success('Order created successfully!');
      navigate(`/admin/orders/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Customer Section */}
      <div className="card p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Customer Details</h3>

        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setIsNewCustomer(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              !isNewCustomer ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            Existing Customer
          </button>
          <button
            type="button"
            onClick={() => setIsNewCustomer(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isNewCustomer ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            New Customer
          </button>
        </div>

        {!isNewCustomer ? (
          <div className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  searchCustomers(e.target.value);
                }}
              />
            </div>
            {customerResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                {customerResults.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedCustomer.name}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{selectedCustomer.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setCustomerProfiles([]); }}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 9876543210"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input
                type="email"
                className="input"
                placeholder="customer@email.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Dates */}
      <div className="card p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Order Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Trial Date</label>
            <input
              type="date"
              className="input"
              value={trialDate}
              onChange={(e) => setTrialDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Delivery Date</label>
            <input
              type="date"
              className="input"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Items</h3>
          <button type="button" onClick={addItem} className="btn-secondary text-sm">
            <PlusIcon className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-gray-700/50 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/30">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Item {idx + 1}</h4>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="label">Type *</label>
                  <select
                    className="input"
                    value={item.type}
                    onChange={(e) => updateItem(idx, 'type', e.target.value)}
                  >
                    {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Price (₹)</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Optional"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
              </div>

              {/* Measurements Toggle & Profile Auto-fill */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleMeasurements(idx)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {expandedMeasurements[idx] ? '▲ Hide' : '▼ Add'} Measurements
                </button>

                {customerProfiles.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Auto-fill:</span>
                    {customerProfiles
                      .filter((p) => p.label === item.type || customerProfiles.length <= 3)
                      .slice(0, 3)
                      .map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => applyProfile(idx, p)}
                          className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 font-medium"
                        >
                          {p.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {expandedMeasurements[idx] && (
                <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  {['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length', 'neck', 'inseam', 'thigh'].map(
                    (field) => (
                      <div key={field}>
                        <label className="label capitalize">{field} (in)</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="0"
                          step="0.5"
                          value={item.measurements[field]}
                          onChange={(e) => updateMeasurement(idx, field, e.target.value)}
                        />
                      </div>
                    )
                  )}
                  <div className="col-span-3 md:col-span-5">
                    <label className="label">Notes</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Measurement notes..."
                      value={item.measurements.notes}
                      onChange={(e) => updateMeasurement(idx, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-5 py-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Estimated Total: </span>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="label">Order Notes</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Any special instructions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => navigate(-1)} className="btn-outline">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary px-8">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Order'
          )}
        </button>
      </div>
    </form>
  );
}
