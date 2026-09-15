import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { geocodeAddress, extractCoordsFromMapUrl } from '../../services/geocodingService.js';
import { MapPin, Plus, Edit2, Trash2, Phone, Clock, Search, CheckCircle2, XCircle, Crosshair, Navigation, ExternalLink, Link2, MonitorSmartphone } from 'lucide-react';

const AdminOutletsPage = () => {
  const { showToast } = useApp();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detectingCoords, setDetectingCoords] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    area: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    map_link: '',
    latitude: '',
    longitude: '',
    phone: '',
    opening_time: '09:00 AM',
    closing_time: '10:30 PM',
    is_active: true,
    rista_store_id: '',
    rista_pos_enabled: true,
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
      map_link: '',
      latitude: '',
      longitude: '',
      phone: '',
      opening_time: '09:00 AM',
      closing_time: '10:30 PM',
      is_active: true,
      rista_store_id: '',
      rista_pos_enabled: true,
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
      map_link: outlet.map_link || '',
      latitude: outlet.latitude || '',
      longitude: outlet.longitude || '',
      phone: outlet.phone || '',
      opening_time: outlet.opening_time || '09:00 AM',
      closing_time: outlet.closing_time || '10:30 PM',
      is_active: !!outlet.is_active,
      rista_store_id: outlet.rista_store_id || '',
      rista_pos_enabled: outlet.rista_pos_enabled !== undefined ? !!outlet.rista_pos_enabled : true,
    });
    setIsModalOpen(true);
  };

  const handleMapLinkChange = async (url) => {
    setFormData((prev) => ({ ...prev, map_link: url }));
    if (!url || !url.trim()) return;

    // 1. Try instant client-side extraction first
    const clientCoords = extractCoordsFromMapUrl(url);
    if (clientCoords) {
      setFormData((prev) => ({
        ...prev,
        latitude: clientCoords.lat,
        longitude: clientCoords.lng,
      }));
      return;
    }

    // 2. If it's a short URL (goo.gl / maps.app.goo.gl), call backend to expand & parse
    if (url.startsWith('http://') || url.startsWith('https://')) {
      setDetectingCoords(true);
      try {
        const res = await api.post('/admin/outlets/parse-map-link', { url });
        if (res.data?.success && res.data?.coordinates) {
          setFormData((prev) => ({
            ...prev,
            latitude: res.data.coordinates.lat,
            longitude: res.data.coordinates.lng,
          }));
          showToast('GPS coordinates extracted from Google Maps link! 📍', 'success');
        }
      } catch (err) {
        // Handled silently or will geocode on save
      } finally {
        setDetectingCoords(false);
      }
    }
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
      const res = await api.delete(`/admin/outlets/${id}`);
      showToast(res.data?.message || 'Outlet deleted.', 'success');
      setOutlets((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete outlet.';
      showToast(msg, 'error');
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
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 font-mono">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MonitorSmartphone className="w-3 h-3 text-amber-600" />
                      Rista Store ID:
                    </span>
                    <strong className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-bold">
                      {outlet.rista_store_id || outlet.code}
                    </strong>
                  </div>
                  <div className="pt-2 flex items-center justify-between gap-2">
                    {outlet.map_link ? (
                      <a
                        href={outlet.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-bakery-700 hover:text-bakery-900 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 transition-all"
                        title="Open in Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-bakery-600" />
                        <span>Google Map Link</span>
                        <ExternalLink className="w-3 h-3 text-bakery-500" />
                      </a>
                    ) : outlet.latitude && outlet.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${outlet.latitude},${outlet.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-bakery-700 hover:text-bakery-900 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 transition-all"
                        title="View on Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-bakery-600" />
                        <span>View on Map</span>
                        <ExternalLink className="w-3 h-3 text-bakery-500" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <MapPin className="w-3 h-3" /> No Map Link
                      </span>
                    )}

                    {outlet.latitude && outlet.longitude && (
                      <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                        {Number(outlet.latitude).toFixed(3)}, {Number(outlet.longitude).toFixed(3)}
                      </span>
                    )}
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-cream-200 max-h-[90vh] overflow-y-auto">
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

              {/* Outlet Google Maps Link Section */}
              <div className="bg-cream-50/90 p-4 rounded-2xl border border-cream-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-bakery-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-bakery-600" />
                    Outlet Google Maps Link
                  </label>
                  {formData.map_link && (
                    <a
                      href={formData.map_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-bakery-700 hover:text-bakery-900 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Test Link
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={formData.map_link}
                    onChange={(e) => handleMapLinkChange(e.target.value)}
                    placeholder="Paste Google Maps share link (e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/...)"
                    className="w-full px-3.5 py-2.5 bg-white border border-cream-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-bakery-500 text-gray-800 placeholder-gray-400 font-mono"
                  />
                  {detectingCoords && (
                    <span className="absolute right-3 top-2.5 text-[11px] text-bakery-600 flex items-center gap-1 font-sans">
                      <Crosshair className="w-3.5 h-3.5 animate-spin" /> Detecting...
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                  <p>
                    Paste the outlet's Google Maps link. The exact location coordinates will be detected automatically.
                  </p>
                  {formData.latitude && formData.longitude && (
                    <span className="inline-flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Linked: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                    </span>
                  )}
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

              {/* Rista POS Integration Settings */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                    Rista POS (DotPe) Terminal Mapping
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rista Store ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.rista_store_id}
                    onChange={(e) => setFormData({ ...formData, rista_store_id: e.target.value })}
                    placeholder={`Defaults to code: ${formData.code || 'BLR-123'}`}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-chocolate focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    The branch Store ID from your DotPe / Rista POS dashboard. If left blank, the branch code will be used automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rista_pos_enabled"
                    checked={formData.rista_pos_enabled}
                    onChange={(e) => setFormData({ ...formData, rista_pos_enabled: e.target.checked })}
                    className="rounded text-bakery-600 focus:ring-bakery-500"
                  />
                  <label htmlFor="rista_pos_enabled" className="text-xs font-medium text-gray-700">
                    Route online customer orders directly to this outlet's KOT printer & POS
                  </label>
                </div>
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
