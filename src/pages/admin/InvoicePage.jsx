import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, invoiceAPI } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ArrowLeftIcon, ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

export default function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ total_amount: 0, advance_paid: 0, discount: 0 });
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '', method: 'CASH' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const { data: orderData } = await orderAPI.getById(id);
      setOrder(orderData.data);
      if (orderData.data.invoice) {
        setInvoice(orderData.data.invoice);
        setInvoiceForm({
          total_amount: orderData.data.invoice.total_amount,
          advance_paid: orderData.data.invoice.advance_paid,
          discount: orderData.data.invoice.discount || 0,
        });
      } else {
        // Calculate from items
        const total = (orderData.data.items || []).reduce(
          (s, i) => s + (i.price || 0) * (i.quantity || 1), 0
        );
        setInvoiceForm({ total_amount: total, advance_paid: 0, discount: 0 });
        setShowInvoiceForm(true);
      }
    } catch {
      toast.error('Failed to load data');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { order_id: id, ...invoiceForm };
      const { data } = await invoiceAPI.create(payload);
      setInvoice(data.data);
      setShowInvoiceForm(false);
      toast.success('Invoice saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await invoiceAPI.recordPayment(invoice._id, {
        amount: Number(paymentForm.amount),
        note: paymentForm.note,
        method: paymentForm.method,
      });
      setInvoice(data.data);
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', note: '', method: 'CASH' });
      toast.success('Payment recorded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const customer = order.customer_id || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Invoice</h2>
        </div>
        <div className="flex gap-2">
          {invoice && (
            <>
              <button
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="btn-secondary text-sm"
              >
                Edit Invoice
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-success text-sm"
                disabled={invoice.payment_status === 'PAID'}
              >
                <PlusIcon className="w-4 h-4" />
                Record Payment
              </button>
              <button
                onClick={() => generateInvoicePDF(order, invoice)}
                className="btn-primary text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice form (create/edit) */}
      {showInvoiceForm && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            {invoice ? 'Edit Invoice' : 'Create Invoice'}
          </h3>
          <form onSubmit={handleSaveInvoice} className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Total Amount (₹)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={invoiceForm.total_amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, total_amount: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label">Advance Paid (₹)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={invoiceForm.advance_paid}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, advance_paid: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={invoiceForm.discount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              {invoice && (
                <button type="button" onClick={() => setShowInvoiceForm(false)} className="btn-outline">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice display */}
      {invoice && (
        <div className="card overflow-hidden">
          {/* Invoice header */}
          <div className="bg-blue-600 px-6 py-5 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">INVOICE</h3>
                <p className="text-blue-200 text-sm mt-0.5">#{invoice.invoice_number}</p>
              </div>
              <StatusBadge status={invoice.payment_status} />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer & Order info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bill To</p>
                <p className="font-bold text-gray-800 dark:text-white">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
                {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Order Info</p>
                <p className="text-sm"><span className="text-gray-500">Order #:</span> <span className="font-mono font-medium">{order.order_number}</span></p>
                <p className="text-sm"><span className="text-gray-500">Date:</span> {formatDate(order.order_date)}</p>
                {order.delivery_date && (
                  <p className="text-sm"><span className="text-gray-500">Delivery:</span> {formatDate(order.delivery_date)}</p>
                )}
              </div>
            </div>

            {/* Items table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="py-2 text-left text-gray-500">Item</th>
                  <th className="py-2 text-center text-gray-500">Qty</th>
                  <th className="py-2 text-right text-gray-500">Price</th>
                  <th className="py-2 text-right text-gray-500">Total</th>
                  <th className="py-2 text-center text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {order.items?.map((item) => (
                  <tr key={item._id}>
                    <td className="py-2.5 font-medium text-gray-800 dark:text-white">{item.type}</td>
                    <td className="py-2.5 text-center text-gray-500">{item.quantity}</td>
                    <td className="py-2.5 text-right text-gray-500">{formatCurrency(item.price || 0)}</td>
                    <td className="py-2.5 text-right font-medium">
                      {formatCurrency((item.price || 0) * item.quantity)}
                    </td>
                    <td className="py-2.5 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Payment summary */}
            <div className="flex justify-end">
              <div className="w-56 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Advance Paid</span>
                  <span className="font-medium text-green-600">{formatCurrency(invoice.advance_paid)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-800 dark:text-white">Pending</span>
                  <span className={`font-bold text-lg ${invoice.pending_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.pending_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment history */}
            {invoice.payment_history?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">
                  Payment History
                </h4>
                <div className="space-y-2">
                  {invoice.payment_history.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/30 rounded-lg px-4 py-2.5">
                      <div>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <span className="badge-gray ml-2">{p.method}</span>
                        {p.note && <span className="text-gray-400 ml-2">— {p.note}</span>}
                      </div>
                      <span className="text-gray-400">{formatDate(p.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Record Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="label">Amount (₹) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  max={invoice?.pending_amount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max: {formatCurrency(invoice?.pending_amount || 0)}
                </p>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  className="input"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  {['CASH', 'CARD', 'UPI', 'BANK'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Payment note..."
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-success">
                  {submitting ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
