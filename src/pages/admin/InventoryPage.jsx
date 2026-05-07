import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['Fabric', 'Thread', 'Button', 'Zipper', 'Lining', 'Accessory', 'Other'];
const UNITS = ['Meter', 'Yard', 'Piece', 'Roll', 'Kg', 'Set', 'Dozen'];

const emptyProduct = { name: '', category: 'Fabric', unit: 'Meter', stock_quantity: 0, purchase_price: 0, selling_price: 0, low_stock_alert: 5, description: '' };

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => { fetchProducts(); }, [pagination.page, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({ search, category, page: pagination.page, limit: 20 });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Product name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await productAPI.update(editingId, form);
        toast.success('Product updated');
      } else {
        await productAPI.create(form);
        toast.success('Product added');
      }
      setShowForm(false); setEditingId(null); setForm({ ...emptyProduct });
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({ name: p.name, category: p.category, unit: p.unit, stock_quantity: p.stock_quantity, purchase_price: p.purchase_price, selling_price: p.selling_price, low_stock_alert: p.low_stock_alert, description: p.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await productAPI.delete(id); toast.success('Deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  const lowStockCount = products.filter((p) => p.stock_quantity <= p.low_stock_alert).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Inventory</h2>
          <p className="text-sm text-gray-500">{pagination.total} products{lowStockCount > 0 && <span className="text-red-500 ml-2">• {lowStockCount} low stock</span>}</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ ...emptyProduct }); setShowForm(!showForm); }} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input type="text" className="input" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stock Qty</label>
              <input type="number" className="input" min="0" step="0.01" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Purchase Price (₹)</label>
              <input type="number" className="input" min="0" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Selling Price (₹)</label>
              <input type="number" className="input" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Low Stock Alert</label>
              <input type="number" className="input" min="0" value={form.low_stock_alert} onChange={(e) => setForm({ ...form, low_stock_alert: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editingId ? 'Update' : 'Add Product'}</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }} className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="input pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select className="input w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  <th className="px-5 py-3 text-gray-500 font-medium">Product</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Category</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Stock</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Purchase ₹</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Selling ₹</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Margin</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map((p) => {
                  const isLow = p.stock_quantity <= p.low_stock_alert;
                  const margin = p.selling_price > 0 ? Math.round(((p.selling_price - p.purchase_price) / p.selling_price) * 100) : 0;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 dark:text-white">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>}
                      </td>
                      <td className="px-5 py-3"><span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">{p.category}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {isLow && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
                          <span className={`font-medium ${isLow ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}`}>
                            {p.stock_quantity} {p.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{formatCurrency(p.purchase_price)}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{formatCurrency(p.selling_price)}</td>
                      <td className="px-5 py-3"><span className={`text-xs font-semibold ${margin > 0 ? 'text-green-600' : 'text-gray-400'}`}>{margin}%</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="btn-secondary text-xs disabled:opacity-50">Previous</button>
                <button onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages} className="btn-secondary text-xs disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
