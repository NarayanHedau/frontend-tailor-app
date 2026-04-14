import { format, parseISO } from 'date-fns';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, fmt);
  } catch {
    return '—';
  }
};

export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const getStatusBadgeClass = (status) => {
  const map = {
    PENDING: 'badge-yellow',
    IN_PROGRESS: 'badge-blue',
    STITCHING: 'badge-blue',
    COMPLETED: 'badge-green',
    READY: 'badge-green',
    DELIVERED: 'badge-purple',
    CANCELLED: 'badge-red',
    PAID: 'badge-green',
    PARTIAL: 'badge-yellow',
  };
  return map[status] || 'badge-gray';
};

export const getStatusLabel = (status) => {
  const map = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    STITCHING: 'Stitching',
    COMPLETED: 'Completed',
    READY: 'Ready',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    PAID: 'Paid',
    PARTIAL: 'Partial',
  };
  return map[status] || status;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const shareOnWhatsApp = (phone, message) => {
  const encoded = encodeURIComponent(message);
  const url = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
};
