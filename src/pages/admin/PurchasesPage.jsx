import { useState, useEffect } from 'react';
import { purchaseAPI, supplierAPI, productAPI } from '../../services/api';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'BANK', 'CHEQUE'];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Form state
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ product_id: '', product_name: '', quantity: 1, unit: 'Meter', unit_price: '' }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // Inline add supplier
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', company: '', gst_number: '', address: '' });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Payment modal
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');

  useEffect(() => { fetchPurchases(); }, [pagination.page]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await purchaseAPI.getAll({ search, page: pagination.page, limit: 15 });
      setPurchases(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load purchases'); }
    finally { setLoading(false); }
  };

  const openForm = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        supplierAPI.getAll({ limit: 100 }),
        productAPI.getAll({ limit: 200 }),
      ]);
      setSuppliers(supRes.data.data);
      setProducts(prodRes.data.data);
      setShowForm(true);
    } catch { toast.error('Failed to load suppliers/products'); }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.phone) { toast.error('Supplier name and phone are required'); return; }
    setSavingSupplier(true);
    try {
      const { data } = await supplierAPI.create(newSupplier);
      const created = data.data;
      setSuppliers([created, ...suppliers]);
      setSupplierId(created._id);
      setShowAddSupplier(false);
      setNewSupplier({ name: '', phone: '', company: '', gst_number: '', address: '' });
      toast.success('Supplier added');
    } catch (err) {
      if (err.response?.status === 409) {
        const existing = err.response.data.existingSupplier;
        setSupplierId(existing._id);
        setShowAddSupplier(false);
        toast.success(`Using existing supplier: ${existing.name}`);
      } else {
        toast.error(err.response?.data?.message || 'Failed to add supplier');
      }
    } finally { setSavingSupplier(false); }
  };

  const addItem = () => setItems([...items, { product_id: '', product_name: '', quantity: 1, unit: 'Meter', unit_price: '' }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'product_id') {
      const prod = products.find((p) => p._id === value);
      if (prod) { updated[idx].product_name = prod.name; updated[idx].unit = prod.unit; updated[idx].unit_price = prod.purchase_price; }
    }
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.unit_price) || 0)), 0);
  const total = subtotal - discount + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (items.some((i) => !i.product_id)) { toast.error('Select product for all items'); return; }
    setSaving(true);
    try {
      const payload = {
        supplier_id: supplierId,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity) || 0, unit_price: Number(i.unit_price) || 0 })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        amount_paid: Number(amountPaid) || 0,
        payment_method: paymentMethod,
        notes,
      };
      await purchaseAPI.create(payload);
      toast.success('Purchase recorded!');
      setShowForm(false);
      setSupplierId(''); setItems([{ product_id: '', product_name: '', quantity: 1, unit: 'Meter', unit_price: '' }]);
      setDiscount(0); setTax(0); setAmountPaid(''); setNotes('');
      fetchPurchases();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Enter valid amount'); return; }
    try {
      await purchaseAPI.recordPayment(payModal._id, { amount: Number(payAmount), method: payMethod });
      toast.success('Payment recorded');
      setPayModal(null); setPayAmount('');
      fetchPurchases();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase? Stock will be reverted.')) return;
    try { await purchaseAPI.delete(id); toast.success('Deleted'); fetchPurchases(); }
    catch { toast.error('Failed'); }
  };

  const statusColor = { PAID: 'text-green-600 bg-green-100 dark:bg-green-900/30', PARTIAL: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', UNPAID: 'text-red-600 bg-red-100 dark:bg-red-900/30' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Purchases</h2>
          <p className="text-sm text-gray-500">Buy materials from suppliers</p>
        </div>
        <button onClick={openForm} className="btn-primary"><PlusIcon className="w-4 h-4" /> New Purchase</button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">New Purchase Bill</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Supplier *</label>
                <button type="button" onClick={() => setShowAddSupplier(!showAddSupplier)} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">
                  {showAddSupplier ? 'Cancel' : '+ Add New'}
                </button>
              </div>
              {!showAddSupplier ? (
                <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.company || s.phone}</option>)}
                </select>
              ) : (
                <div className="space-y-2 border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-900/10">
                  <input type="text" className="input text-sm" placeholder="Supplier name *" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                  <input type="text" className="input text-sm" placeholder="Phone *" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                  <input type="text" className="input text-sm" placeholder="Company name (optional)" value={newSupplier.company} onChange={(e) => setNewSupplier({ ...newSupplier, company: e.target.value })} />
                  <input type="text" className="input text-sm" placeholder="GST number (optional)" value={newSupplier.gst_number} onChange={(e) => setNewSupplier({ ...newSupplier, gst_number: e.target.value })} />
                  <button type="button" onClick={handleAddSupplier} disabled={savingSupplier} className="btn-primary text-xs w-full">
                    {savingSupplier ? 'Adding...' : 'Add Supplier'}
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount Paid (₹)</label>
              <input type="number" className="input no-spinner" min="0" placeholder="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Item</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-3 items-end border border-gray-100 dark:border-gray-700/50 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="col-span-12 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
                  {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><TrashIcon className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">Product *</label>
                  <select className="input text-sm" value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}>
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.stock_quantity} {p.unit})</option>)}
                  </select>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">Quantity</label>
                  <input type="number" className="input text-sm" placeholder="0" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">Unit</label>
                  <input type="text" className="input text-sm bg-gray-100 dark:bg-gray-800/50" value={item.unit} readOnly />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">Price (₹)</label>
                  <input type="number" className="input text-sm no-spinner" placeholder="0" min="0" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">Total</label>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 py-2">{formatCurrency(item.quantity * item.unit_price)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Discount (₹)</label><input type="number" className="input" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
            <div><label className="label">Tax (₹)</label><input type="number" className="input" min="0" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></div>
            <div><label className="label">Notes</label><input type="text" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="flex items-end">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2 w-full text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save Purchase'}</button>
          </div>
        </form>
      )}

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); fetchPurchases(); }} className="relative max-w-md">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" className="input pl-9" placeholder="Search by bill# or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {/* View Bill Modal */}
      {viewPurchase && (
        <div className="card p-5 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white font-mono">{viewPurchase.bill_number}</h3>
            <button onClick={() => setViewPurchase(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-gray-500">Supplier:</span> <span className="font-medium">{viewPurchase.supplier_id?.name}</span></div>
            <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(viewPurchase.purchase_date)}</span></div>
            <div><span className="text-gray-500">Total:</span> <span className="font-bold">{formatCurrency(viewPurchase.total_amount)}</span></div>
            <div><span className="text-gray-500">Paid:</span> <span className="font-medium text-green-600">{formatCurrency(viewPurchase.amount_paid)}</span> <span className="text-red-500 ml-1">Due: {formatCurrency(viewPurchase.balance_due)}</span></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-gray-700 text-left"><th className="py-2 text-gray-500">Item</th><th className="py-2 text-gray-500">Qty</th><th className="py-2 text-gray-500">Rate</th><th className="py-2 text-gray-500">Total</th></tr></thead>
            <tbody className="divide-y dark:divide-gray-700">
              {viewPurchase.items?.map((item, i) => (
                <tr key={i}><td className="py-2">{item.product_name}</td><td className="py-2">{item.quantity} {item.unit}</td><td className="py-2">{formatCurrency(item.unit_price)}</td><td className="py-2 font-medium">{formatCurrency(item.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="card p-5 border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Record Payment — {payModal.bill_number}</h3>
          <p className="text-sm text-gray-500 mb-3">Balance due: <span className="font-bold text-red-600">{formatCurrency(payModal.balance_due)}</span></p>
          <div className="flex gap-3 items-end">
            <div><label className="label">Amount (₹)</label><input type="number" className="input" min="1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
            <div><label className="label">Method</label><select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <button onClick={handleRecordPayment} className="btn-primary text-sm">Pay</button>
            <button onClick={() => setPayModal(null)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  <th className="px-5 py-3 text-gray-500 font-medium">Bill #</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Supplier</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Date</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Items</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Total</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Paid</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-5 py-3 font-mono font-medium text-blue-600">{p.bill_number}</td>
                    <td className="px-5 py-3"><p className="font-medium text-gray-800 dark:text-white">{p.supplier_id?.name}</p><p className="text-xs text-gray-400">{p.supplier_id?.company}</p></td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(p.purchase_date)}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.items?.length}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(p.total_amount)}</td>
                    <td className="px-5 py-3 text-green-600">{formatCurrency(p.amount_paid)}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-md font-semibold ${statusColor[p.payment_status]}`}>{p.payment_status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewPurchase(p)} className="p-1.5 text-gray-400 hover:text-blue-600" title="View"><EyeIcon className="w-4 h-4" /></button>
                        {p.balance_due > 0 && <button onClick={() => { setPayModal(p); setPayAmount(''); }} className="text-xs text-green-600 hover:text-green-700 font-medium px-1">Pay</button>}
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400">No purchases yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
