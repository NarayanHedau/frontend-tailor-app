import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency } from './helpers';

export const generateInvoicePDF = (order, invoice) => {
  const doc = new jsPDF();
  const customer = order.customer || order.customer_id || {};

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TAILOR STITCHING TRACKER', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Trusted Tailor Partner', 14, 28);
  doc.text(`Invoice #${invoice?.invoice_number || 'N/A'}`, 140, 18);
  doc.setFontSize(9);
  doc.text(`Date: ${formatDate(new Date())}`, 140, 26);

  // Customer info
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customer.name || '—', 14, 63);
  doc.text(`Phone: ${customer.phone || '—'}`, 14, 70);
  if (customer.email) doc.text(`Email: ${customer.email}`, 14, 77);

  // Order info
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER DETAILS:', 130, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order #: ${order.order_number}`, 130, 63);
  doc.text(`Order Date: ${formatDate(order.order_date)}`, 130, 70);
  if (order.delivery_date) doc.text(`Delivery: ${formatDate(order.delivery_date)}`, 130, 77);

  // Items table
  const tableData = (order.items || []).map((item) => [
    item.type,
    item.quantity,
    formatCurrency(item.price || 0),
    formatCurrency((item.price || 0) * item.quantity),
    item.status,
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Item Type', 'Qty', 'Unit Price', 'Total', 'Status']],
    body: tableData,
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 4: { halign: 'center' } },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Payment summary
  const summaryX = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const drawRow = (label, value, y, bold = false) => {
    if (bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(label, summaryX, y);
    doc.text(value, 190, y, { align: 'right' });
  };

  drawRow('Subtotal:', formatCurrency(invoice?.total_amount || 0), finalY);
  if (invoice?.discount > 0) drawRow('Discount:', `-${formatCurrency(invoice.discount)}`, finalY + 8);
  drawRow('Advance Paid:', formatCurrency(invoice?.advance_paid || 0), finalY + 16);

  doc.setDrawColor(37, 99, 235);
  doc.line(summaryX, finalY + 20, 195, finalY + 20);
  drawRow('PENDING AMOUNT:', formatCurrency(invoice?.pending_amount || 0), finalY + 28, true);

  // Status badge
  const statusColor =
    invoice?.payment_status === 'PAID' ? [22, 163, 74] :
    invoice?.payment_status === 'PARTIAL' ? [234, 179, 8] :
    [239, 68, 68];
  doc.setFillColor(...statusColor);
  doc.roundedRect(14, finalY, 50, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Payment: ${invoice?.payment_status || 'PENDING'}`, 17, finalY + 7);

  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 105, 285, { align: 'center' });

  doc.save(`Invoice-${invoice?.invoice_number || order.order_number}.pdf`);
};
