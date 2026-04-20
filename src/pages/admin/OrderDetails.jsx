import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  PhoneIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { formatDate, copyToClipboard, shareOnWhatsApp } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ITEM_STATUSES = ['PENDING', 'STITCHING', 'READY'];

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const fileRefs = useRef({});

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await orderAPI.getById(id);
      setOrder(data.data);
    } catch {
      toast.error('Failed to load order');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId, status) => {
    setUpdatingItem(itemId);
    try {
      const { data } = await orderAPI.updateItemStatus(id, itemId, status);
      setOrder(data.data);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleImageUpload = async (itemId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      await orderAPI.uploadItemImage(id, itemId, formData);
      toast.success('Image uploaded');
      fetchOrder();
    } catch {
      toast.error('Image upload failed');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${order.tracking_id}`;
    const copied = await copyToClipboard(url);
    if (copied) toast.success('Tracking link copied!');
  };

  const handleWhatsApp = () => {
    const url = `${window.location.origin}/track/${order.tracking_id}`;
    const msg = `Hello ${order.customer_id?.name}! Track your order ${order.order_number} here: ${url}`;
    shareOnWhatsApp(order.customer_id?.phone, msg);
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const customer = order.customer_id || {};
  const trackingUrl = `${window.location.origin}/track/${order.tracking_id}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white font-mono">
              {order.order_number}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created {formatDate(order.order_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={order.status} />
          <button onClick={handleShare} className="btn-secondary text-sm" title="Copy tracking link">
            <ClipboardDocumentIcon className="w-4 h-4" />
            Copy Link
          </button>
          <button onClick={handleWhatsApp} className="btn-success text-sm">
            <ShareIcon className="w-4 h-4" />
            WhatsApp
          </button>
          <Link to={`/admin/orders/${id}/invoice`} className="btn-primary text-sm">
            <DocumentTextIcon className="w-4 h-4" />
            Invoice
          </Link>
        </div>
      </div>

      {/* Customer & Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
            Customer
          </h3>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{customer.name}</p>
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mt-1"
          >
            <PhoneIcon className="w-4 h-4" />
            {customer.phone}
          </a>
          {customer.email && (
            <p className="text-sm text-gray-500 mt-0.5">{customer.email}</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
            Dates
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Date</span>
              <span className="font-medium">{formatDate(order.order_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trial Date</span>
              <span className="font-medium">{formatDate(order.trial_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Date</span>
              <span className="font-medium text-blue-600">{formatDate(order.delivery_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
            Order Progress
          </h3>
          <span className="text-sm font-bold text-gray-700 dark:text-white">
            {order.progress?.completed}/{order.progress?.total} items ready
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${order.progress?.percentage || 0}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-right">
          {order.progress?.percentage || 0}% complete
        </p>
      </div>

      {/* Tracking link */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Tracking Link</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={trackingUrl}
            className="input text-xs bg-white dark:bg-gray-800 flex-1"
          />
          <button onClick={handleShare} className="btn-primary text-xs flex-shrink-0">
            Copy
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Items</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {order.items?.map((item) => (
            <div key={item._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {item.type}
                    </h4>
                    <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  )}

                  {/* Measurements */}
                  {item.measurements && Object.values(item.measurements).some((v) => v && v !== 0 && v !== '') && (
                    <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2">
                      {['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length', 'neck', 'inseam', 'thigh'].map(
                        (field) =>
                          item.measurements[field] ? (
                            <div key={field} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400 capitalize">{field}</p>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {item.measurements[field]}"
                              </p>
                            </div>
                          ) : null
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Status dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    disabled={updatingItem === item._id}
                    className="input text-xs w-36"
                  >
                    {ITEM_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>

                  {/* Image */}
                  {item.cloth_image ? (
                    <img
                      src={item.cloth_image}
                      alt="Cloth"
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700 cursor-pointer"
                      onClick={() => window.open(item.cloth_image, '_blank')}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[item._id]?.click()}
                      className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                    >
                      <CameraIcon className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    ref={(el) => (fileRefs.current[item._id] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleImageUpload(item._id, e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide">Notes</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
