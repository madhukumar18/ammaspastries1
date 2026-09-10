import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { MapPin, Plus, Edit2, Trash2, Phone, Clock, Search, CheckCircle2, XCircle } from 'lucide-react';

const AdminOutletsPage = () => {
  const { showToast } = useApp();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    area: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    phone: '',
    opening_time: '09:00 AM',
    closing_time: '10:30 PM',
    is_active: true,
  });

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/outlets');
      if (res.data?.data) {
        setOutlets(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load outlets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const openCreateModal = () => {
    setEditingOutlet(null);
    setFormData({
      name: '',
      code: 'BLR-' + Math.floor(100 + Math.random() * 900),
      address: '',
      area: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '',
      phone: '',
      opening_time: '09:00 AM',
      closing_time: '10:30 PM',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name || '',
      code: outlet.code || '',
      address: outlet.address || '',
      area: outlet.area || '',
      city: outlet.city || 'Bengaluru',
      state: outlet.state || 'Karnataka',
      pincode: outlet.pincode || '',
      phone: outlet.phone || '',
      opening_time: outlet.opening_time || '09:00 AM',
      closing_time: outlet.closing_time || '10:30 PM',
      is_active: !!outlet.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingOutlet) {
        await api.put(`/admin/outlets/${editingOutlet.id}`, formData);
        showToast('Outlet updated successfully!', 'success');
      } else {
        await api.post('/admin/outlets', formData);
        showToast('Outlet added successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchOutlets();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving outlet details';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete outlet "${name}"?`)) return;
    try {
      await api.delete(`/admin/outlets/${id}`);
      showToast('Outlet deleted.', 'success');
      setOutlets((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      showToast('Failed to delete outlet.', 'error');
    }
  };

  const filtered = outlets.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.area.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Bakery Outlets</h1>
          <p className="text-sm text-gray-500">Manage your retail stores, pickup points, and branch timings</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Outlet
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-cream-200 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by outlet name, area, or branch code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none text-sm focus:outline-none text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* Outlets Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading outlets...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <MapPin className="w-12 h-12 text-cream-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No outlets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((outlet) => (
            <div
              key={outlet.id}
              className="bg-white rounded-2xl p-5 border border-cream-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-cream-100 text-bakery-800 rounded-full text-xs font-semibold">
                    {outlet.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      outlet.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {outlet.is_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Inactive
                      </>
                    )}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-gray-900 text-lg mb-1">{outlet.name}</h3>
                <p className="text-xs text-bakery-700 font-medium mb-3">{outlet.area}, {outlet.city}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{outlet.address} - {outlet.pincode}</p>

                <div className="space-y-1.5 pt-3 border-t border-cream-100 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-bakery-500" />
                    <span>{outlet.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-bakery-500" />
                    <span>{outlet.opening_time} - {outlet.closing_time}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-cream-100">
                <button
                  onClick={() => openEditModal(outlet)}
                  className="p-2 text-gray-600 hover:text-bakery-600 hover:bg-cream-100 rounded-lg transition-colors"
                  title="Edit Outlet"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(outlet.id, outlet.name)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Outlet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-cream-200">
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-1">
              {editingOutlet ? 'Edit Outlet' : 'Add New Bakery Branch'}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Enter branch code, address, timings, and contact number.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Outlet Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Indiranagar Flagship"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. BLR-IND-01"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Street Address</label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot/Shop number, Main road, Landmark..."
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Indiranagar"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="560038"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98450 11223"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Opening Time</label>
                  <input
                    type="text"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Closing Time</label>
                  <input
                    type="text"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    placeholder="10:30 PM"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="outlet_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-bakery-600 focus:ring-bakery-500"
                />
                <label htmlFor="outlet_is_active" className="text-xs font-medium text-gray-700">
                  Outlet is open for ordering and local delivery
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingOutlet ? 'Update Outlet' : 'Add Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOutletsPage;
