import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Image,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Upload,
  Link as LinkIcon,
  Smartphone,
  Monitor,
  Loader2,
  CheckCircle2,
  Info
} from 'lucide-react';

const AdminBannersPage = () => {
  const { showToast } = useApp();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  // Preview Mode for Card / Modal: 'desktop' or 'mobile'
  const [previewMode, setPreviewMode] = useState('desktop');

  // Image Upload States
  const [desktopImageMode, setDesktopImageMode] = useState('gallery'); // 'gallery' or 'url'
  const [mobileImageMode, setMobileImageMode] = useState('gallery');
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [desktopFileName, setDesktopFileName] = useState('');
  const [mobileFileName, setMobileFileName] = useState('');

  const desktopFileRef = useRef(null);
  const mobileFileRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    button_text: 'Order Now',
    button_url: '/category/signature-cakes',
    display_order: 1,
    is_active: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      if (res.data?.data) {
        setBanners(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setDesktopFileName('');
    setMobileFileName('');
    setFormData({
      title: '',
      subtitle: '',
      image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80',
      mobile_image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      button_text: 'Explore Treats',
      button_url: '/category/signature-cakes',
      display_order: banners.length + 1,
      is_active: true,
    });
    setDesktopImageMode('gallery');
    setMobileImageMode('gallery');
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setDesktopFileName('');
    setMobileFileName('');
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      mobile_image_url: banner.mobile_image_url || '',
      button_text: banner.button_text || '',
      button_url: banner.button_url || '',
      display_order: banner.display_order ?? 1,
      is_active: !!banner.is_active,
    });
    setDesktopImageMode('gallery');
    setMobileImageMode('gallery');
    setIsModalOpen(true);
  };

  // Upload local desktop banner image
  const handleDesktopFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      showToast('Image file size must be less than 30MB', 'error');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: localPreview }));

    const payload = new FormData();
    payload.append('image', file);
    payload.append('folder', 'banners');

    setUploadingDesktop(true);
    try {
      const res = await api.post('/admin/media/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, image_url: res.data.data.url }));
        setDesktopFileName(`${file.name} (${res.data.data.size_kb} KB)`);
        showToast('Desktop banner uploaded from local gallery!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload desktop banner', 'error');
    } finally {
      setUploadingDesktop(false);
    }
  };

  // Upload local mobile banner image
  const handleMobileFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      showToast('Image file size must be less than 30MB', 'error');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, mobile_image_url: localPreview }));

    const payload = new FormData();
    payload.append('image', file);
    payload.append('folder', 'banners');

    setUploadingMobile(true);
    try {
      const res = await api.post('/admin/media/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, mobile_image_url: res.data.data.url }));
        setMobileFileName(`${file.name} (${res.data.data.size_kb} KB)`);
        showToast('Mobile banner uploaded from local gallery!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload mobile banner', 'error');
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBanner) {
        await api.put(`/admin/banners/${editingBanner.id}`, formData);
        showToast('Banner updated successfully!', 'success');
      } else {
        await api.post('/admin/banners', formData);
        showToast('Banner created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving banner';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner from homepage?')) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      showToast('Banner deleted.', 'success');
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      showToast('Failed to delete banner.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Homepage Banners</h1>
          <p className="text-sm text-gray-500">
            Manage hero carousel sliders, announcements, desktop & mobile resolutions, and local gallery uploads
          </p>
        </div>

        {/* Global Resolution Reference Card */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 text-xs">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Desktop:</strong> 1920×600 px &bull; <strong>Mobile:</strong> 800×800 px
            </span>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Hero Banner
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Image className="w-12 h-12 text-cream-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No banners found. Create your first banner above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-3xl overflow-hidden border border-cream-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Banner Image Preview Container */}
                <div className="relative h-48 sm:h-56 bg-cream-100 overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-xs uppercase tracking-wider text-cream-200 font-semibold mb-1">
                      Display Order: #{banner.display_order}
                    </span>
                    <h3 className="font-banner font-bold text-xl leading-tight mb-1">{banner.title}</h3>
                    {banner.subtitle && <p className="text-xs text-cream-200 line-clamp-2 font-banner">{banner.subtitle}</p>}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm backdrop-blur-md ${
                        banner.is_active ? 'bg-emerald-600/90 text-white' : 'bg-gray-800/80 text-gray-200'
                      }`}
                    >
                      {banner.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {banner.is_active ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Resolution and Details Strip */}
                <div className="p-4 space-y-2 border-b border-cream-100 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800">CTA Button:</span>
                      <span className="bg-cream-100 px-2 py-0.5 rounded text-bakery-800 font-medium">
                        {banner.button_text || 'None'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 truncate max-w-[200px]">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{banner.button_url || '/'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-blue-600" />
                      <span>Desktop View: Set</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Mobile View: {banner.mobile_image_url ? (
                          <strong className="text-emerald-700">Custom 1080×750 px</strong>
                        ) : (
                          <span className="text-slate-400">Uses Desktop Image</span>
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-cream-50/50 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(banner)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-bakery-600 hover:bg-white rounded-lg border border-cream-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT BANNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-cream-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-cream-100">
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  {editingBanner ? 'Edit Hero Banner' : 'Create Hero Banner'}
                </h2>
                <p className="text-xs text-gray-500">
                  Configure desktop & mobile resolutions, upload from local device gallery or provide URL links.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Headline / Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Artisanal Cakes Baked Fresh Every Morning"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Subtitle / Tagline</label>
                  <textarea
                    rows={2}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Crafted with pure Belgian cocoa, farm-fresh cream & delivered in 45 mins across Bengaluru."
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Order Fresh"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Button Link / Route</label>
                  <input
                    type="text"
                    value={formData.button_url}
                    onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                    placeholder="/category/signature-cakes"
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
              </div>

              {/* 1. DESKTOP BANNER UPLOADER */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-chocolate flex items-center gap-1.5 text-xs">
                      <Monitor className="w-4 h-4 text-blue-600" />
                      <span>Desktop View Banner Image *</span>
                    </span>
                    <span className="text-[11px] text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block mt-0.5">
                      Recommended Resolution: 1920 × 500 px (or 1600 × 500 px, Max 30MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start">
                    <button
                      type="button"
                      onClick={() => setDesktopImageMode('gallery')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 ${
                        desktopImageMode === 'gallery' ? 'bg-chocolate text-white' : 'text-slate-500'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> From Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesktopImageMode('url')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 ${
                        desktopImageMode === 'url' ? 'bg-chocolate text-white' : 'text-slate-500'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> URL Link
                    </button>
                  </div>
                </div>

                {desktopImageMode === 'gallery' ? (
                  <div>
                    <input
                      type="file"
                      ref={desktopFileRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleDesktopFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => desktopFileRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 rounded-2xl p-3 text-center cursor-pointer transition-all"
                    >
                      {uploadingDesktop ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          <span className="font-bold text-blue-800">Uploading desktop banner from gallery...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-1">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-700">Choose desktop image from local gallery (1920×500 px, max 30MB)</span>
                        </div>
                      )}
                    </div>
                    {desktopFileName && (
                      <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg mt-1 border border-emerald-200">
                        ✓ {desktopFileName}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... (1920x500 px)"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                  />
                )}

                {formData.image_url && (
                  <div className="h-28 sm:h-36 rounded-xl overflow-hidden border border-slate-200 relative">
                    <img src={formData.image_url} alt="Desktop Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-2 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                      Desktop Aspect (1920×500 px)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. MOBILE VIEW BANNER UPLOADER */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                      <Smartphone className="w-4 h-4 text-amber-700" />
                      <span>Mobile View Banner Image (Smartphone Optimized)</span>
                    </span>
                    <span className="text-[11px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 inline-block mt-0.5">
                      Recommended Resolution: 1080 × 750 px or 800 × 600 px (Max 30MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 self-start">
                    <button
                      type="button"
                      onClick={() => setMobileImageMode('gallery')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 ${
                        mobileImageMode === 'gallery' ? 'bg-amber-700 text-white' : 'text-slate-500'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> From Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileImageMode('url')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 ${
                        mobileImageMode === 'url' ? 'bg-amber-700 text-white' : 'text-slate-500'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> URL Link
                    </button>
                  </div>
                </div>

                {mobileImageMode === 'gallery' ? (
                  <div>
                    <input
                      type="file"
                      ref={mobileFileRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleMobileFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => mobileFileRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/40 rounded-2xl p-3 text-center cursor-pointer transition-all"
                    >
                      {uploadingMobile ? (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                          <span className="font-bold text-amber-800">Uploading mobile banner from gallery...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-1">
                          <Upload className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-slate-700">Choose mobile phone image from gallery (1080×750 px, max 30MB)</span>
                        </div>
                      )}
                    </div>
                    {mobileFileName && (
                      <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg mt-1 border border-emerald-200">
                        ✓ {mobileFileName}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    value={formData.mobile_image_url}
                    onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... (1080x750 px for mobile screens)"
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                  />
                )}

                {formData.mobile_image_url && (
                  <div className="w-40 h-28 rounded-xl overflow-hidden border border-amber-300 mx-auto relative shadow-xs">
                    <img src={formData.mobile_image_url} alt="Mobile Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 rounded">
                      Mobile (1080×750 px)
                    </span>
                  </div>
                )}
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Display Sequence</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="banner_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-bakery-600 focus:ring-bakery-500 w-4 h-4"
                  />
                  <label htmlFor="banner_is_active" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Visible on Homepage Carousel
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
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
                  className="px-6 py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBannersPage;
