import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { FileSpreadsheet, Building2, Calendar, Phone, Mail, CheckCircle, Clock, Eye, Trash2 } from 'lucide-react';

const AdminBulkImportsPage = () => {
  const { showToast } = useApp();
  const [bulkOrders, setBulkOrders] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const fetchBulkData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bulk-imports');
      if (res.data?.data) {
        setBulkOrders(res.data.data.bulk_orders || []);
        setImports(res.data.data.imports || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load corporate bulk data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulkData();
  }, []);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || '');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/admin/bulk-orders/${selectedOrder.id}/status`, {
        status: newStatus,
        admin_notes: adminNotes,
      });
      showToast('Status updated successfully!', 'success');
      setSelectedOrder(res.data?.data || null);
      fetchBulkData();
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bulk order request?')) return;
    try {
      await api.delete(`/admin/bulk-orders/${id}`);
      showToast('Deleted.', 'success');
      setBulkOrders((prev) => prev.filter((b) => b.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'reviewed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Corporate & Bulk Orders</h1>
        <p className="text-sm text-gray-500">
          Manage B2B enquiries, institutional celebratory cake orders, and view uploaded CSV batches.
        </p>
      </div>

      {/* CSV IMPORTS SUMMARY TABLE */}
      {imports.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-cream-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-5 h-5 text-bakery-600" />
            <h3 className="font-serif font-bold text-gray-900">Recent CSV Upload Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-cream-50 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 rounded-l-lg">File Name</th>
                  <th className="px-4 py-2.5">Total Rows</th>
                  <th className="px-4 py-2.5">Successful</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {imports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{imp.file_name}</td>
                    <td className="px-4 py-3">{imp.total_rows}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{imp.successful_rows}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cream-100 text-bakery-800">
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(imp.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BULK ORDERS LIST */}
      <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm">
        <h3 className="font-serif font-bold text-gray-900 text-lg mb-4">Bulk Order Enquiries</h3>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading bulk orders...</div>
        ) : bulkOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No corporate bulk enquiries recorded yet.</div>
        ) : (
          <div className="divide-y divide-cream-100">
            {bulkOrders.map((order) => (
              <div
                key={order.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-cream-50/40 p-2 rounded-2xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-bakery-600" />
                      {order.company_name || 'Individual Bulk Order'}
                    </h4>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold capitalize ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    <span><strong>Contact:</strong> {order.contact_person}</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-bakery-500" /> {order.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-bakery-500" /> {order.email}
                    </span>
                    {order.event_date && (
                      <span className="flex items-center gap-1 text-bakery-800 font-medium">
                        <Calendar className="w-3 h-3" /> Event: {order.event_date}
                      </span>
                    )}
                  </div>
                  {order.notes && (
                    <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">"{order.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-bakery-900 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View & Update
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL & STATUS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-cream-200">
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">
              Bulk Order Request #{selectedOrder.id}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              {selectedOrder.company_name || 'Individual'} &bull; Contact: {selectedOrder.contact_person}
            </p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3 bg-cream-50 p-4 rounded-2xl text-xs text-gray-700">
                <div><strong>Phone:</strong> {selectedOrder.phone}</div>
                <div><strong>Email:</strong> {selectedOrder.email}</div>
                <div><strong>Event Date:</strong> {selectedOrder.event_date || 'N/A'}</div>
                <div><strong>Estimated Pax/Qty:</strong> {selectedOrder.estimated_quantity || 'N/A'}</div>
                {selectedOrder.delivery_address && (
                  <div className="col-span-2">
                    <strong>Delivery Location:</strong> {selectedOrder.delivery_address}
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 mb-1">Client Notes / Requirements:</h4>
                  <p className="text-xs bg-gray-50 p-3 rounded-xl text-gray-700 leading-relaxed border border-gray-100">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Items if present */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 mb-2">Requested Item Rows:</h4>
                  <div className="border border-cream-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-cream-100 text-gray-800 font-semibold">
                        <tr>
                          <th className="p-2">Item Name</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Flavour / Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100">
                        {selectedOrder.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{it.product_name}</td>
                            <td className="p-2">{it.quantity}</td>
                            <td className="p-2 text-gray-500">{it.customization_notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Update Status Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-3 pt-4 border-t border-cream-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Admin Notes</label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Quoted ₹18,000, advance received"
                      className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-5 py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkImportsPage;
