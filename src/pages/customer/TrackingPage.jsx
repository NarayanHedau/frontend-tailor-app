import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { trackingAPI } from '../../services/api';
import { formatDate, formatCurrency, shareOnWhatsApp } from '../../utils/helpers';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import {
  PhoneIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ScissorsIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../../store/themeStore';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: ClockIcon, dot: 'bg-yellow-400' },
  STITCHING: { label: 'Stitching', color: 'text-primary-600 bg-primary-50 border-primary-200', icon: WrenchScrewdriverIcon, dot: 'bg-primary-400' },
  READY: { label: 'Ready', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircleIcon, dot: 'bg-green-400' },
};

const ORDER_STATUS_CONFIG = {
  PENDING: { label: 'Order Received', color: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-primary-100 text-primary-800' },
  COMPLETED: { label: 'Ready for Pickup', color: 'bg-green-100 text-green-800' },
  DELIVERED: { label: 'Delivered', color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function TrackingPage() {
  const { trackingId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { initTheme } = useThemeStore();

  useEffect(() => { initTheme(); }, []);

  const fetchTracking = useCallback(async () => {
    try {
      const { data: res } = await trackingAPI.getInfo(trackingId);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    fetchTracking();
    // Poll every 60 seconds
    const interval = setInterval(fetchTracking, 60000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const handleWhatsAppShare = () => {
    const url = window.location.href;
    const msg = `Track my tailor order here: ${url}`;
    shareOnWhatsApp(null, msg);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScissorsIcon className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Order Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { customer, invoice } = data;
  const orderStatus = ORDER_STATUS_CONFIG[data.status] || ORDER_STATUS_CONFIG.PENDING;
  const readyItems = data.items.filter((i) => i.status === 'READY').length;
  const totalItems = data.items.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <ScissorsIcon className="w-5 h-5" />
            <span className="text-sm font-medium text-primary-200">Tailor Tracker</span>
          </div>
          <h1 className="text-2xl font-bold">{customer?.name}</h1>
          <p className="text-primary-200 text-sm mt-0.5 font-mono">{data.order_number}</p>
          <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold ${orderStatus.color}`}>
            {orderStatus.label}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Order dates */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Order Information</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Order Date', value: formatDate(data.order_date) },
              { label: 'Trial Date', value: formatDate(data.trial_date) },
              { label: 'Delivery', value: formatDate(data.delivery_date) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <CalendarDaysIcon className="w-4 h-4 text-primary-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase">Order Progress</h2>
            <span className="text-sm font-bold text-gray-700 dark:text-white">
              {readyItems}/{totalItems} completed
            </span>
          </div>
          <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${data.progress?.percentage || 0}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {data.progress?.percentage || 0}%
            </span>
          </div>
        </div>

        {/* Items summary table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xs font-semibold text-gray-400 uppercase">Items Summary</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Item</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500">Qty</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500">Ready</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white">{item.type}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-green-600 font-semibold">
                      {item.status === 'READY' ? item.quantity : 0}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-yellow-600 font-semibold">
                      {item.status !== 'READY' ? item.quantity : 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Item status cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase px-1">Item Status</h2>
          {data.items.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
            const Icon = cfg.icon;
            return (
              <div key={item._id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${cfg.color} border p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.cloth_image ? (
                      <img
                        src={item.cloth_image}
                        alt={item.type}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <ScissorsIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{item.type}</h3>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </div>
                </div>

                {/* Measurements (collapsible view) */}
                {item.measurements && Object.entries(item.measurements)
                  .filter(([k, v]) => k !== 'notes' && v && v !== 0).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Measurements</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.measurements)
                        .filter(([k, v]) => k !== 'notes' && v && v !== 0)
                        .map(([k, v]) => (
                          <span key={k} className="text-xs bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg capitalize">
                            {k}: <strong>{v}"</strong>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Invoice */}
        {invoice && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-800 dark:bg-gray-900 px-4 py-3">
              <h2 className="text-xs font-semibold text-gray-200 uppercase">Payment Details</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {formatCurrency(invoice.total_amount)}
                </span>
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

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 pb-6">
          {customer?.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-gray-600 dark:text-gray-300 hover:bg-primary-50 transition-colors"
            >
              <PhoneIcon className="w-6 h-6 text-primary-600" />
              <span className="text-xs font-medium">Call Shop</span>
            </a>
          )}
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-gray-600 dark:text-gray-300 hover:bg-green-50 transition-colors"
          >
            <ShareIcon className="w-6 h-6 text-green-600" />
            <span className="text-xs font-medium">Share</span>
          </button>
          {invoice && (
            <button
              onClick={() => generateInvoicePDF(data, invoice)}
              className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-gray-600 dark:text-gray-300 hover:bg-purple-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-6 h-6 text-purple-600" />
              <span className="text-xs font-medium">Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-400">
        Auto-refreshes every minute • Powered by Tailor Tracker
      </div>
    </div>
  );
}
