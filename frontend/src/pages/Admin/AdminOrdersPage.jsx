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
  Check
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
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Outlet</th>
                <th className="p-4">Delivery Slot</th>
                <th className="p-4">Amount</th>
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
                  return (
                    <tr key={o.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-chocolate">
                        #{o.order_number}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-chocolate">{o.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{o.customer_phone}</div>
                      </td>

                      <td className="p-4 font-medium text-slate-700">
                        {o.outlet?.name || 'Central Kitchen'}
                      </td>

                      <td className="p-4">
                        <div className="font-medium">
                          {new Date(o.delivery_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-amber-800 font-semibold">{o.delivery_time_slot}</div>
                      </td>

                      <td className="p-4 font-bold text-chocolate">
                        ₹{o.total}
                      </td>

                      <td className="p-4">
                        {hasPhotoCake ? (
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-2.5 py-1 rounded-full text-[10px] shadow-xs">
                            <Camera className="w-3.5 h-3.5" /> Photo Cake
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
                          <span>View {hasPhotoCake ? '& Photo' : ''}</span>
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
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 border border-amber-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Information</span>
                <h2 className="font-serif font-bold text-2xl text-chocolate">#{selectedOrder.order_number}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                  title="Print Kitchen Slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg p-1">✕</button>
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

            {/* Customer & Delivery Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="font-bold text-chocolate">Customer & Contact</div>
                <div>{selectedOrder.customer_name}</div>
                <div>{selectedOrder.customer_phone}</div>
                <div>{selectedOrder.customer_email || 'No email provided'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="font-bold text-chocolate">Delivery Location & Slot</div>
                <div>{selectedOrder.delivery_address}</div>
                <div>
                  {selectedOrder.delivery_area}, {selectedOrder.delivery_city} ({selectedOrder.delivery_pincode})
                </div>
                <div className="text-amber-800 font-semibold mt-1">🕒 Slot: {selectedOrder.delivery_time_slot}</div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-sm text-chocolate">Items in this Order</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {selectedOrder.items?.map((it) => (
                  <div key={it.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-chocolate">{it.product_name}</div>
                      <div className="text-[11px] text-slate-400">
                        Qty: {it.quantity} {it.variant_title ? `• ${it.variant_title}` : ''}
                      </div>
                    </div>
                    <span className="font-bold text-chocolate">₹{it.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and close */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-sm font-bold text-chocolate">
                Order Total: <span className="text-amber-600 text-base">₹{selectedOrder.total}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

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
