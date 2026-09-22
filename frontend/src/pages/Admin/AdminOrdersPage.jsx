import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Camera,
  MapPin,
  Store,
  ChevronRight,
  ZoomIn,
  Printer,
  Sparkles,
  Check,
  Calendar,
  CreditCard,
  User,
  Phone,
  Mail,
  FileText,
  Copy,
  AlertCircle,
  Hash,
  Receipt
} from 'lucide-react';

const AdminOrdersPage = () => {
  const { showToast, adminToken } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Photo Cake Lightbox (Full Zoom) & Blob Cache
  const [lightboxImage, setLightboxImage] = useState(null);
  const [photoBlobMap, setPhotoBlobMap] = useState({});
  const [downloadingPhotoId, setDownloadingPhotoId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const getRazorpayDetails = (order) => {
    if (!order) return { paymentId: null, orderId: null, transactionId: null, status: null };

    const payment = order.latest_payment || order.latestPayment || (order.payments && order.payments[0]) || null;
    const paymentId =
      payment?.razorpay_payment_id ||
      (order.pos_payload?.payment?.transaction_id?.startsWith('TXN_pay_')
        ? order.pos_payload.payment.transaction_id.replace('TXN_', '')
        : null) ||
      null;

    const orderId = payment?.razorpay_order_id || null;
    const transactionId =
      payment?.transaction_id ||
      order.pos_payload?.payment?.transaction_id ||
      (paymentId ? `TXN_${paymentId}` : null);

    return {
      paymentId,
      orderId,
      transactionId,
      status: payment?.status || order.payment_status || 'pending',
    };
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders?search=${encodeURIComponent(search)}&status=${statusFilter}&per_page=30`);
      if (res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  // When an order is opened in the modal, load any photo cake images via authenticated blob request
  const openOrderDetails = async (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);

    // Pre-fetch photo cake images as authenticated blobs for guaranteed instant display
    if (order.items) {
      for (const item of order.items) {
        const uploadId = item.customization?.photo_cake_upload_id;
        if (uploadId && !photoBlobMap[uploadId]) {
          try {
            const res = await api.get(`/admin/photo-cake/${uploadId}/preview`, {
              responseType: 'blob',
            });
            const blobUrl = URL.createObjectURL(res.data);
            setPhotoBlobMap((prev) => ({ ...prev, [uploadId]: blobUrl }));
          } catch (e) {
            console.warn('Could not pre-load photo cake blob:', e);
          }
        }
      }
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/admin/orders/${selectedOrder.id}/status`, {
        order_status: newStatus,
      });
      showToast(`Order status updated to "${newStatus.replace('_', ' ')}"`, 'success');
      setSelectedOrder((prev) => ({ ...prev, order_status: newStatus }));
      fetchOrders();
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Protected Photo Cake high-res binary download for baking kitchen
  const handleDownloadPhoto = async (uploadId, originalName, nameOnCake) => {
    setDownloadingPhotoId(uploadId);
    try {
      const res = await api.get(`/admin/photo-cake/${uploadId}/download`, {
        params: {
          order_number: selectedOrder?.order_number || 'Order',
          name: nameOnCake || '',
        },
        responseType: 'blob',
      });

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = nameOnCake ? `_${nameOnCake.replace(/[^a-zA-Z0-9]/g, '')}` : '';
      a.download = `AmmasBakery_PhotoCake_${selectedOrder?.order_number || 'AMP'}${cleanName}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('High-resolution photo downloaded for bakery kitchen printing!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error downloading customer photo.', 'error');
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-chocolate">Bakery Orders & Photo Cakes</h1>
          <p className="text-xs text-slate-500">
            Live order fulfillment, kitchen baking workflow & custom photo cake high-resolution preview & download
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, customer name, phone..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 font-semibold text-chocolate focus:outline-none"
          >
            <option value="">All Order Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing / Baking</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Order # & Placed Date</th>
                <th className="p-4">Customer & Contact</th>
                <th className="p-4">Assigned Outlet</th>
                <th className="p-4">Delivery Schedule</th>
                <th className="p-4">Payment & Total</th>
                <th className="p-4">Cake Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => {
                  const hasPhotoCake = o.items?.some((it) => it.customization?.photo_cake_upload_id);
                  const rzp = getRazorpayDetails(o);

                  return (
                    <tr key={o.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-chocolate text-sm">
                          #{o.order_number}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5" title="Order Placed At">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          <span>{formatDateTime(o.created_at)}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-chocolate text-xs">{o.customer_name}</div>
                        <div className="text-[11px] text-slate-500">{o.customer_phone}</div>
                        {o.customer_email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{o.customer_email}</div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-slate-800">{o.outlet?.name || 'Central Kitchen'}</div>
                        <div className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-500" />
                          <span>PIN: {o.outlet?.pincode || o.delivery_pincode || '560001'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-blue-600" />
                          <span>{formatDate(o.delivery_date)}</span>
                        </div>
                        <div className="text-[10px] text-amber-800 font-semibold">{o.delivery_time_slot}</div>
                        <div className="mt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            o.delivery_method === 'pickup'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {o.delivery_method === 'pickup' ? '🏪 Outlet Pickup' : '🚚 Home Delivery'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-chocolate text-sm">₹{o.total}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              o.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.payment_status === 'paid' ? 'PAID' : (o.payment_status || 'PENDING')}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {o.payment_method === 'razorpay' ? 'Online' : (o.payment_method || 'Online')}
                          </span>
                        </div>
                        {rzp.paymentId && (
                          <div className="text-[9px] font-mono text-slate-400 truncate max-w-[120px]" title={`Razorpay ID: ${rzp.paymentId}`}>
                            {rzp.paymentId}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {hasPhotoCake ? (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-2xs">
                            <Camera className="w-3 h-3" /> Photo Cake
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Standard Bakery</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            o.order_status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.order_status === 'preparing'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : o.order_status === 'out_for_delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : o.order_status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {o.order_status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => openOrderDetails(o)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-chocolate hover:bg-chocolate-light text-white font-bold text-xs shadow-2xs transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No customer orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED ORDER & PHOTO CAKE MANAGEMENT MODAL */}
      {detailModalOpen && selectedOrder && (() => {
        const rzp = getRazorpayDetails(selectedOrder);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 border border-amber-100">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Details</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedOrder.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      ● {selectedOrder.payment_status === 'paid' ? 'Payment Captured (PAID)' : 'Payment Pending'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3 mt-1">
                    <h2 className="font-serif font-bold text-3xl text-chocolate">#{selectedOrder.order_number}</h2>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Order Date: <strong className="text-slate-800">{formatDateTime(selectedOrder.created_at)}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-2xs"
                    title="Print Kitchen Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Kitchen Slip</span>
                  </button>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xl p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Status Transition Toolbar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">Update Order Tracking Stage:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'confirmed', label: '1. Confirmed', color: 'bg-slate-200 text-slate-800' },
                    { id: 'preparing', label: '2. Preparing / Baking', color: 'bg-amber-500 text-white' },
                    { id: 'out_for_delivery', label: '3. Out for Delivery', color: 'bg-blue-600 text-white' },
                    { id: 'delivered', label: '4. Delivered ✓', color: 'bg-emerald-600 text-white' },
                    { id: 'cancelled', label: 'Cancel Order ✕', color: 'bg-rose-600 text-white' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      disabled={updatingStatus || selectedOrder.order_status === s.id}
                      onClick={() => handleUpdateStatus(s.id)}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-2xs ${
                        selectedOrder.order_status === s.id
                          ? `${s.color} ring-2 ring-chocolate`
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-CARD BENTO GRID: CUSTOMER, DELIVERY ("WHEN HE NEED"), PAYMENT & RAZORPAY, OUTLET */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* CARD 1: CUSTOMER INFORMATION */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-chocolate text-xs">
                      <User className="w-4 h-4 text-amber-700" />
                      <span>Customer & Contact Details</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">Customer</span>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name:</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 pt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{selectedOrder.customer_phone}</span>
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="text-[10px] text-amber-700 hover:underline font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                      >
                        Call
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedOrder.customer_email || 'No email provided'}</span>
                      {selectedOrder.customer_email && (
                        <a
                          href={`mailto:${selectedOrder.customer_email}`}
                          className="text-[10px] text-amber-700 hover:underline font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                        >
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery Destination Address:
                    </span>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                      <div>{selectedOrder.delivery_address}</div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {selectedOrder.delivery_area}, {selectedOrder.delivery_city || 'Bengaluru'} - ({selectedOrder.delivery_pincode})
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: DELIVERY SCHEDULE & ORDER NOTES ("WHEN HE NEED") */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-chocolate text-xs">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Delivery Schedule ("When He Need")</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">Schedule</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Target Delivery Date:</span>
                        <span className="font-bold text-sm text-chocolate flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          {formatDate(selectedOrder.delivery_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Delivery Time Slot:</span>
                        <span className="font-bold text-amber-800 text-xs flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          {selectedOrder.delivery_time_slot}
                        </span>
                      </div>
                    </div>

                    {/* Customer Order Notes / Special Instructions */}
                    <div className="pt-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Customer Order Notes & Instructions:</span>
                      </div>
                      {selectedOrder.special_instructions ? (
                        <div className="bg-amber-50/90 border-2 border-amber-300 p-2.5 rounded-xl text-amber-950 font-medium italic text-xs leading-relaxed">
                          "{selectedOrder.special_instructions}"
                        </div>
                      ) : (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-400 italic text-xs">
                          No special instructions provided by customer.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 3: PAYMENT & RAZORPAY TRANSACTION */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-chocolate text-xs">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Payment & Razorpay Details</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedOrder.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedOrder.payment_status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Payment Method:</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {selectedOrder.payment_method === 'razorpay' ? 'Razorpay (Online Payment)' : (selectedOrder.payment_method || 'Online Razorpay')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Total Amount Paid:</span>
                        <span className="font-serif font-bold text-lg text-emerald-700">₹{selectedOrder.total}</span>
                      </div>
                    </div>

                    {/* Razorpay Payment ID with copy button */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Razorpay Payment ID:
                      </span>
                      {rzp.paymentId ? (
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                          <span className="truncate mr-2 text-chocolate">{rzp.paymentId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(rzp.paymentId, 'Razorpay Payment ID')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                            title="Copy Razorpay Payment ID"
                          >
                            {copiedField === 'Razorpay Payment ID' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs italic">Awaiting online payment settlement ID</div>
                      )}

                      {rzp.transactionId && (
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                          <span>Transaction ID:</span>
                          <span className="font-mono font-semibold text-slate-700">{rzp.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 4: ASSIGNED BAKERY OUTLET DETAILS */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-chocolate text-xs">
                      <Store className="w-4 h-4 text-purple-600" />
                      <span>Assigned Outlet Details</span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-mono">
                      {selectedOrder.outlet?.code || selectedOrder.outlet?.rista_store_id || 'AMP-HQ'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="font-bold text-chocolate text-sm">
                        {selectedOrder.outlet?.name || 'Ammas Pastries Central Kitchen'}
                      </div>
                      <div className="text-slate-600 flex items-start gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <div className="font-medium text-slate-700">{selectedOrder.outlet?.address || 'Outlet Address On File'}</div>
                          <div className="text-slate-500">
                            {selectedOrder.outlet?.area ? `${selectedOrder.outlet.area}, ` : ''}{selectedOrder.outlet?.city || 'Bengaluru'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-bold text-purple-900">Outlet Pincode:</span>
                        <span className="font-mono font-bold text-slate-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                          {selectedOrder.outlet?.pincode || selectedOrder.delivery_pincode || '560001'}
                        </span>
                      </div>

                      {selectedOrder.outlet?.phone && (
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-slate-500">Outlet Phone:</span>
                          <a href={`tel:${selectedOrder.outlet.phone}`} className="font-semibold text-purple-700 hover:underline">
                            {selectedOrder.outlet.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* HIGH VISIBILITY PHOTO CAKE INSTRUCTIONS & ASSETS */}
              {selectedOrder.items?.some((it) => it.customization?.photo_cake_upload_id) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl p-6 border-2 border-amber-300 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                      <Camera className="w-5 h-5 text-amber-700" />
                      <span className="font-serif text-base">Custom Photo Cake Kitchen Assets & Specs</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                      Print on Edible Sugar Sheet
                    </span>
                  </div>

                  {selectedOrder.items
                    .filter((it) => it.customization?.photo_cake_upload_id)
                    .map((item) => {
                      const c = item.customization;
                      const uploadId = c.photo_cake_upload_id;
                      const displaySrc =
                        photoBlobMap[uploadId] ||
                        (c.photoUpload?.preview_token
                          ? `${API_BASE_URL}/photo-cakes/preview/${c.photoUpload.preview_token}`
                          : 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400');

                      return (
                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
                          {/* High-Res Photo Preview with Lightbox Click & Download */}
                          <div className="sm:col-span-5 text-center space-y-3">
                            <div
                              onClick={() => setLightboxImage(displaySrc)}
                              className="group relative w-44 h-44 mx-auto rounded-2xl overflow-hidden border-3 border-amber-400 shadow-md cursor-pointer bg-slate-100"
                              title="Click to Zoom Full Resolution"
                            >
                              <img
                                src={displaySrc}
                                alt="Customer Cake Photo"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                                <ZoomIn className="w-4 h-4" /> Click to Zoom
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                disabled={downloadingPhotoId === uploadId}
                                onClick={() => handleDownloadPhoto(uploadId, c.photoUpload?.original_filename, c.name_on_cake)}
                                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                              >
                                <Download className="w-4 h-4" />
                                <span>{downloadingPhotoId === uploadId ? 'Downloading...' : 'Download Photo for Kitchen'}</span>
                              </button>
                              <span className="text-[10px] text-slate-400">
                                Full original resolution for edible wafer/icing printer
                              </span>
                            </div>
                          </div>

                          {/* Complete Customization Specifications */}
                          <div className="sm:col-span-7 space-y-2.5 text-xs text-slate-700">
                            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                              <div className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider">
                                Piping Message (Name on Cake):
                              </div>
                              <div className="font-serif font-bold text-lg text-chocolate mt-0.5">
                                "{c.name_on_cake || 'None'}"
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-slate-400 block text-[10px] font-semibold">Weight / Size:</span>
                                <span className="font-bold text-chocolate text-sm">{c.cake_size || '1kg'}</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-slate-400 block text-[10px] font-semibold">Flavour Profile:</span>
                                <span className="font-bold text-chocolate text-sm">{c.flavour || 'Dutch Truffle'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                              <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-bold text-xs">
                                {c.is_eggless ? '🟢 100% Pure Eggless' : '🥚 With Egg'}
                              </span>
                            </div>

                            {c.description && (
                              <div className="pt-2 text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                                <strong>Special Instructions:</strong> "{c.description}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Items in this Order */}
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  <span>Items in this Order ({selectedOrder.items?.length || 0})</span>
                </h3>
                <div className="divide-y divide-slate-100 text-xs bg-slate-50/50 rounded-2xl border border-slate-200 p-4">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-chocolate text-sm">{it.product_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Quantity: <strong className="text-slate-700">{it.quantity}</strong>
                          {it.variant_title ? ` • ${it.variant_title}` : ''}
                        </div>
                        {it.customization && (
                          <div className="text-[11px] text-amber-900 mt-1 space-y-0.5">
                            {it.customization.name_on_cake && (
                              <div>Name on Cake: <strong className="text-chocolate">"{it.customization.name_on_cake}"</strong></div>
                            )}
                            {it.customization.flavour && <div>Flavour: {it.customization.flavour}</div>}
                            {it.customization.is_eggless !== undefined && (
                              <div>Dietary: {it.customization.is_eggless ? '🟢 100% Eggless' : '🥚 With Egg'}</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-chocolate text-sm">₹{it.subtotal}</div>
                        <div className="text-[10px] text-slate-400">₹{it.unit_price} each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary & Total */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div>Cake Price: <strong className="text-slate-800">₹{selectedOrder.subtotal}</strong></div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="text-emerald-700 font-semibold">Discount: <strong>-₹{selectedOrder.discount}</strong></div>
                  )}
                  <div>Order Option: <strong className="text-slate-800">{selectedOrder.delivery_method === 'pickup' ? 'Pickup from Outlet' : 'Home Delivery'}</strong></div>
                  <div>Delivery Charge: <strong className="text-slate-800">{Number(selectedOrder.delivery_fee) > 0 ? `₹${selectedOrder.delivery_fee}` : '₹0 (Free)'}</strong></div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Paid:</span>
                    <span className="font-serif font-bold text-2xl text-amber-600">₹{selectedOrder.total}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="px-5 py-2.5 bg-chocolate hover:bg-chocolate-light text-white font-bold rounded-xl text-xs shadow-2xs transition-all"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL-SCREEN LIGHTBOX ZOOM MODAL FOR PHOTO CAKE */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white p-3 rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full text-slate-800 font-bold flex items-center justify-center shadow-lg hover:bg-slate-100 text-sm"
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Full Resolution Cake Photo" className="max-w-full max-h-[82vh] rounded-2xl object-contain mx-auto" />
            <div className="text-center pt-2 text-xs font-bold text-slate-600">
              High-Resolution Edible Print Preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
