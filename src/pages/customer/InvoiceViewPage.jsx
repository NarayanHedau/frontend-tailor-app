import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trackingAPI } from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import {
  ArrowDownTrayIcon,
  ScissorsIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../../store/themeStore';

export default function InvoiceViewPage() {
  const { trackingId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { initTheme } = useThemeStore();

  useEffect(() => { initTheme(); }, []);

  const fetchInfo = useCallback(async () => {
    try {
      const { data: res } = await trackingAPI.getInfo(trackingId);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found');
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const handleDownload = () => {
    if (data && data.invoice) generateInvoicePDF(data, data.invoice);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading your invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScissorsIcon className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Invoice Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { customer, invoice } = data;
  const subtotal = (data.items || []).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="bg-primary-600 text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <ScissorsIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-primary-200">Stitching Invoice</span>
          </div>
          <h1 className="text-2xl font-bold">{customer?.name}</h1>
          <p className="text-primary-200 text-sm mt-0.5 font-mono">
            {invoice?.invoice_number || data.order_number}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Order #</p>
              <p className="font-semibold text-gray-800 dark:text-white">{data.order_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Order Date</p>
              <p className="font-semibold text-gray-800 dark:text-white">{formatDate(data.order_date)}</p>
            </div>
            {invoice?.invoice_number && (
              <div>
                <p className="text-xs text-gray-400">Invoice #</p>
                <p className="font-semibold text-gray-800 dark:text-white">{invoice.invoice_number}</p>
              </div>
            )}
            {data.delivery_date && (
              <div>
                <p className="text-xs text-gray-400">Delivery</p>
                <p className="font-semibold text-gray-800 dark:text-white">{formatDate(data.delivery_date)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xs font-semibold text-gray-400 uppercase">Items</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Item</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500">Qty</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500">Price</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(data.items || []).map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white">{item.type}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(item.price || 0)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-white">
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoice && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-800 dark:bg-gray-900 px-4 py-3">
              <h2 className="text-xs font-semibold text-gray-200 uppercase">Payment Summary</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Advance Paid</span>
                <span className="font-semibold text-green-600">{formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-800 dark:text-white">Pending</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${invoice.pending_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.pending_amount)}
                  </span>
                  <span className={`block text-xs px-2 py-0.5 rounded-full mt-1 ${
                    invoice.payment_status === 'PAID' ? 'bg-green-100 text-green-700' :
                    invoice.payment_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {invoice.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-6">
          <button
            onClick={handleDownload}
            disabled={!invoice}
            className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-gray-600 dark:text-gray-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-medium">Download Invoice</span>
          </button>
          <Link
            to={`/stitch-invoice/track/public/${trackingId}/`}
            className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-gray-600 dark:text-gray-300 hover:bg-primary-50 transition-colors"
          >
            <MapPinIcon className="w-6 h-6 text-primary-600" />
            <span className="text-xs font-medium">Track Order</span>
          </Link>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-gray-400">
        Powered by Tailor Tracker
      </div>
    </div>
  );
}
