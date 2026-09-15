import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Layers,
  ArrowUpRight,
  MoveHorizontal,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  Settings,
  Sliders,
  Play,
  Pause
} from 'lucide-react';

const PRESET_ROUTES = [
  { label: 'Cakes & Pastries (/category/cakes-pastries)', url: '/category/cakes-pastries' },
  { label: 'Theme Cakes (/category/theme-cakes)', url: '/category/theme-cakes' },
  { label: 'Photo Cake Studio (/photo-cake)', url: '/photo-cake' },
  { label: 'Snacks & Savouries (/category/snacks)', url: '/category/snacks' },
  { label: 'Dessert & Cupcakes (/category/dessert)', url: '/category/dessert' },
  { label: 'Dry Fruits & Nuts (/category/dry-fruits)', url: '/category/dry-fruits' },
  { label: 'Chocolates & Truffles (/category/chocolates)', url: '/category/chocolates' },
  { label: 'Traditional Sweets (/category/sweets)', url: '/category/sweets' },
  { label: 'Pastries & Slices (/category/pastries-slices)', url: '/category/pastries-slices' },
  { label: 'Party Items & Candles (/category/party-items)', url: '/category/party-items' },
  { label: 'Custom URL / Subcategory', url: 'custom' },
];

const AdminCategoryImagesPage = () => {
  const { showToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    badge_text: '',
    image_url: '',
    target_url: '/category/cakes-pastries',
    custom_target_url: '',
    display_order: 1,
    is_active: true,
  });

  // Track dynamic dimensions of uploaded / input image
  const [imageDimensions, setImageDimensions] = useState(null);

  useEffect(() => {
    if (!formData.image_url) {
      setImageDimensions(null);
      return;
    }
    const img = new Image();
    img.src = formData.image_url;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
  }, [formData.image_url]);

  // Carousel Display & Motion Settings State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState({
    badge_text: 'Explore Bakery Specialties',
    title: 'Fresh Confectionery Categories',
    subtitle: 'Click any category to order fresh artisan creations',
    auto_scroll: true,
    scroll_speed: 0.85,
    pause_on_hover: true,
    show_arrows: true,
    show_bottom_hint: true,
    bottom_hint: 'Click any category circle to browse full catalog',
  });

  // Fetch Category Images and Carousel Settings
  const fetchCategoryImages = async () => {
    setLoading(true);
    try {
      const [imagesRes, settingsRes] = await Promise.all([
        api.get('/admin/category-images'),
        api.get('/admin/category-images/settings').catch(() => null),
      ]);
      if (imagesRes.data?.data) {
        setItems(imagesRes.data.data);
      }
      if (settingsRes?.data?.data) {
        setSettings(settingsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching category images:', err);
      showToast('Failed to load category images.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Carousel Behavior & Display Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settings.title?.trim()) {
      showToast('Section Title is required.', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const payload = {
        badge_text: settings.badge_text?.trim() || null,
        title: settings.title.trim(),
        subtitle: settings.subtitle?.trim() || null,
        auto_scroll: Boolean(settings.auto_scroll),
        scroll_speed: Number(settings.scroll_speed) || 0.85,
        pause_on_hover: Boolean(settings.pause_on_hover),
        show_arrows: Boolean(settings.show_arrows),
        show_bottom_hint: Boolean(settings.show_bottom_hint),
        bottom_hint: settings.bottom_hint?.trim() || null,
      };

      await api.post('/admin/category-images/settings', payload);
      showToast('Carousel settings saved successfully!', 'success');
      setSettingsModalOpen(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast('Failed to save carousel settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchCategoryImages();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.display_order || 0)) + 1 : 1;
    setFormData({
      name: '',
      subtitle: '',
      badge_text: '',
      image_url: '',
      target_url: '/category/cakes-pastries',
      custom_target_url: '',
      display_order: nextOrder,
      is_active: true,
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const isPreset = PRESET_ROUTES.some((r) => r.url === item.target_url);
    setFormData({
      name: item.name || '',
      subtitle: item.subtitle || '',
      badge_text: item.badge_text || '',
      image_url: item.image_url || '',
      target_url: isPreset ? item.target_url : 'custom',
      custom_target_url: isPreset ? '' : item.target_url,
      display_order: item.display_order ?? 1,
      is_active: Boolean(item.is_active),
    });
    setModalOpen(true);
  };

  // Upload Local Image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be less than 15MB', 'error');
      return;
    }

    setUploadingImage(true);
    const payload = new FormData();
    payload.append('image', file);
    payload.append('folder', 'category-showcase');

    try {
      const res = await api.post('/admin/media/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, image_url: res.data.data.url }));
        showToast('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Modal (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }
    if (!formData.image_url.trim()) {
      showToast('Please provide an image for the category card.', 'error');
      return;
    }

    const finalTargetUrl =
      formData.target_url === 'custom'
        ? formData.custom_target_url.trim() || '/category/cakes-pastries'
        : formData.target_url;

    const payload = {
      name: formData.name.trim(),
      subtitle: formData.subtitle.trim() || null,
      badge_text: formData.badge_text.trim() || null,
      image_url: formData.image_url.trim(),
      target_url: finalTargetUrl,
      display_order: Number(formData.display_order) || 0,
      is_active: Boolean(formData.is_active),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/category-images/${editingId}`, payload);
        showToast('Category image updated successfully!', 'success');
      } else {
        await api.post('/admin/category-images', payload);
        showToast('Category image created successfully!', 'success');
      }
      setModalOpen(false);
      fetchCategoryImages();
    } catch (err) {
      console.error(err);
      showToast('Error saving category image. Please check inputs.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (item) => {
    try {
      await api.patch(`/admin/category-images/${item.id}/toggle-status`);
      showToast(`Category "${item.name}" visibility toggled.`, 'success');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
      );
    } catch (err) {
      showToast('Failed to toggle status.', 'error');
    }
  };

  // Delete Item
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete category image "${item.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/admin/category-images/${item.id}`);
      showToast(`Category "${item.name}" deleted successfully.`, 'success');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      showToast('Failed to delete category image.', 'error');
    }
  };

  // Reset to Navbar Defaults
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all Category Images to match the secondary navbar default list?'
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/admin/category-images/reset-defaults');
      if (res.data?.data) {
        setItems(res.data.data);
      }
      showToast('Restored all 10 secondary navbar categories with default imagery!', 'success');
    } catch (err) {
      showToast('Failed to restore defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
      item.target_url?.toLowerCase().includes(search.toLowerCase());

    if (filterStatus === 'active') return matchesSearch && item.is_active;
    if (filterStatus === 'inactive') return matchesSearch && !item.is_active;
    return matchesSearch;
  });

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-100/80 text-amber-800 rounded-xl">
              <MoveHorizontal className="w-5 h-5 text-amber-700" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Homepage Showcase
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Category Images Carousel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Manage the interactive moving category carousel displayed directly below the hero banner. Customer clicks route directly to that category, and moving the cursor pauses the continuous animation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-102"
            title="Configure carousel behavior, motion, speed, and titles"
          >
            <Settings className="w-4 h-4 text-amber-700" />
            <span>Carousel Settings</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Restore default categories matching secondary navbar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category Image</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-amber-100/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Categories</div>
            <div className="text-2xl font-black text-chocolate">{items.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Live On Carousel</div>
            <div className="text-2xl font-black text-emerald-700">{activeCount} active</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Carousel Behavior</div>
            <div className="text-xs font-bold text-chocolate flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${settings.auto_scroll ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>
                {settings.auto_scroll
                  ? `${settings.pause_on_hover ? 'Auto-Scroll (Pause on Hover)' : 'Continuous Auto-Scroll'} • ${settings.scroll_speed}x`
                  : 'Manual Scroll Only'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>Configure</span>
            </button>
            <Link
              to="/"
              target="_blank"
              className="text-xs font-bold text-slate-600 hover:text-chocolate bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>Preview</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name, subtitle or route..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-chocolate text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'inactive'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inactive ({items.length - activeCount})
          </button>
        </div>
      </div>

      {/* Grid of Category Showcase Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="animate-spin text-4xl">🍰</div>
          <p className="text-xs font-bold text-chocolate">Loading category showcase items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-chocolate">No Category Images Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'No categories matched your search term.'
              : 'Add custom category photos or click "Reset Defaults" to populate all navbar categories.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 bg-amber-50 border border-amber-200 text-chocolate font-bold text-xs rounded-xl hover:bg-amber-100"
            >
              Populate Navbar Defaults
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Add New Category
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md ${
                item.is_active ? 'border-amber-100 hover:border-amber-300' : 'border-slate-200 opacity-70 bg-slate-50/50'
              }`}
            >
              {/* Card Image Header */}
              <div className="relative aspect-4/3 overflow-hidden bg-amber-50/50">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Display Order Badge */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-chocolate font-mono text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs border border-amber-200">
                  #{item.display_order}
                </span>

                {/* Optional Badge */}
                {item.badge_text && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                    {item.badge_text}
                  </span>
                )}

                {/* Live Preview Button */}
                <Link
                  to={item.target_url}
                  target="_blank"
                  className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-chocolate text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 transition-all hover:scale-105"
                  title="Visit target route"
                >
                  <span>Visit</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>

                {/* Title overlay on bottom of image */}
                <div className="absolute bottom-3 left-3 right-16 text-white">
                  <h4 className="font-serif font-bold text-sm leading-tight drop-shadow-sm truncate">
                    {item.name}
                  </h4>
                </div>
              </div>

              {/* Card Info Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[32px]">
                    {item.subtitle || 'No subtitle provided.'}
                  </p>

                  <div className="text-[10px] font-mono text-amber-800 bg-amber-50/70 border border-amber-200/60 px-2 py-1 rounded-lg truncate">
                    {item.target_url}
                  </div>
                </div>

                {/* Card Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      item.is_active
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={item.is_active ? 'Click to hide from carousel' : 'Click to show on carousel'}
                  >
                    {item.is_active ? <Check className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{item.is_active ? 'Active' : 'Hidden'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Edit Category Image"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Category Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 rounded-xl text-chocolate">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <h3 className="font-serif font-bold text-lg text-chocolate">
                  {editingId ? 'Edit Category Image' : 'Add Category Image'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cakes & Pastries"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badge / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="e.g. Bestseller"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Fresh Cream & Exotic Fruit Delights"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Target Route Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Target Route (Where Customer is Routed On Click) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white font-medium"
                >
                  {PRESET_ROUTES.map((route) => (
                    <option key={route.url} value={route.url}>
                      {route.label}
                    </option>
                  ))}
                </select>

                {formData.target_url === 'custom' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      required
                      value={formData.custom_target_url}
                      onChange={(e) => setFormData({ ...formData, custom_target_url: e.target.value })}
                      placeholder="e.g. /category/cakes-pastries?sub=exotic-fruitz"
                      className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-amber-50/50 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter relative internal route starting with <code>/</code>
                    </p>
                  </div>
                )}
              </div>

              {/* Photo Upload & URL with Image Size Guidelines */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <label className="text-xs font-bold text-slate-800">
                      Category Photo <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Recommended: 600 × 600 px (1:1 Square)
                  </span>
                </div>

                {/* Clear Image Size Guidelines Callout */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-chocolate flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Recommended Upload Image Size</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      Square Carousel Format
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/80 shadow-2xs">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Optimal Size</span>
                      <strong className="text-chocolate font-extrabold text-xs">600 × 600 px</strong>
                    </div>
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/80 shadow-2xs">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Aspect Ratio</span>
                      <strong className="text-chocolate font-extrabold text-xs">1:1 (Square)</strong>
                    </div>
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/80 shadow-2xs">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Min Resolution</span>
                      <strong className="text-chocolate font-extrabold text-xs">400 × 400 px</strong>
                    </div>
                    <div className="bg-white/90 p-2 rounded-lg border border-amber-200/80 shadow-2xs">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Formats & Max</span>
                      <strong className="text-chocolate font-extrabold text-xs">JPG / PNG ≤ 15MB</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight pt-1">
                    💡 <em>Tip: The storefront displays categories inside square cards. Using a 1:1 square photo ensures your delicacies fit crisply without cut-off.</em>
                  </p>
                </div>

                {/* Upload Local Image from Device */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-100/80 text-chocolate font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>{uploadingImage ? 'Uploading Image...' : 'Upload Photo from Device (600 × 600 px)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image URL text input fallback */}
                <div>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Or enter image URL: https://images.unsplash.com/..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Image Preview & Detected Dimensions */}
                {formData.image_url && (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-amber-200 shrink-0 bg-cream">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-chocolate flex items-center gap-2">
                        <span>Preview Loaded</span>
                        {imageDimensions && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.2 rounded-full">
                            {imageDimensions.width} × {imageDimensions.height} px
                          </span>
                        )}
                      </div>
                      {imageDimensions && (
                        <div className="text-[10px]">
                          {Math.abs(imageDimensions.width - imageDimensions.height) < 25 ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              ✓ Perfect 1:1 square aspect ratio for category card
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium">
                              ℹ Non-square ratio ({imageDimensions.width > imageDimensions.height ? 'Landscape' : 'Portrait'}). Image will be auto-centered in square card.
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-slate-400 truncate text-[10px] font-mono">{formData.image_url}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order (#)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Carousel Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      formData.is_active
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    {formData.is_active ? <Check className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
                    <span>{formData.is_active ? 'Visible on Carousel' : 'Hidden from Carousel'}</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Carousel Behavior & Display Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-amber-100 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-chocolate">
                    Carousel Display & Motion Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Customize the storefront category carousel behavior, scrolling animation, and labels
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Section 1: Section Headings */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Section Titles & Badges</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Top Highlight Badge Text
                  </label>
                  <input
                    type="text"
                    value={settings.badge_text || ''}
                    onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })}
                    placeholder="e.g., Explore Bakery Specialties"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Small rounded pill displayed above the section title. Leave blank to hide.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Main Section Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    placeholder="e.g., Fresh Confectionery Categories"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Description
                  </label>
                  <input
                    type="text"
                    value={settings.subtitle || ''}
                    onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                    placeholder="e.g., Click any category to order fresh artisan creations"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Section 2: Motion & Scrolling Controls */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-2">
                  <MoveHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span>Animation & Motion Behavior</span>
                </h3>

                {/* Auto-Scroll Toggle */}
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-chocolate flex items-center gap-2">
                      <span>Automatic Continuous Scrolling</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${settings.auto_scroll ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {settings.auto_scroll ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Automatically scrolls the category cards horizontally in an infinite loop
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, auto_scroll: !settings.auto_scroll })}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                      settings.auto_scroll ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.auto_scroll ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Pause on Hover Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-chocolate flex items-center gap-2">
                      <span>Pause on Hover</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${settings.pause_on_hover ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {settings.pause_on_hover ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Smoothly freezes motion whenever a customer moves their cursor or finger over categories
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, pause_on_hover: !settings.pause_on_hover })}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                      settings.pause_on_hover ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.pause_on_hover ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Scroll Speed Slider & Presets */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-chocolate">Scroll Motion Speed</div>
                      <p className="text-[11px] text-slate-500">Pixel advance speed per animation frame</p>
                    </div>
                    <span className="text-xs font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                      {Number(settings.scroll_speed).toFixed(2)}x
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={settings.scroll_speed}
                    onChange={(e) => setSettings({ ...settings, scroll_speed: parseFloat(e.target.value) })}
                    className="w-full accent-amber-600 cursor-pointer"
                  />

                  {/* Quick speed presets */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                    {[
                      { label: 'Gentle (0.4x)', value: 0.4 },
                      { label: 'Smooth (0.85x)', value: 0.85 },
                      { label: 'Brisk (1.3x)', value: 1.3 },
                      { label: 'Fast (1.8x)', value: 1.8 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSettings({ ...settings, scroll_speed: preset.value })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          Math.abs(settings.scroll_speed - preset.value) < 0.05
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Navigation Controls & Micro-Hints */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>Navigation Buttons & Hints</span>
                </h3>

                {/* Show Navigation Arrows */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-chocolate">Show Left/Right Navigation Arrows</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Display circular chevron buttons in the header allowing customers to manually nudge the carousel
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, show_arrows: !settings.show_arrows })}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                      settings.show_arrows ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.show_arrows ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Bottom Hint */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-chocolate">Show Bottom Micro-Hint</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Small helpful instruction below the carousel cards
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, show_bottom_hint: !settings.show_bottom_hint })}
                      className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                        settings.show_bottom_hint ? 'bg-amber-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.show_bottom_hint ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.show_bottom_hint && (
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Hint Text
                      </label>
                      <input
                        type="text"
                        value={settings.bottom_hint || ''}
                        onChange={(e) => setSettings({ ...settings, bottom_hint: e.target.value })}
                        placeholder="Click any category circle to browse full catalog"
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Preview Bar */}
              <div className="bg-amber-100/60 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Live Configuration Summary:</span>
                </span>
                <span className="font-medium text-amber-800">
                  {settings.auto_scroll ? `Auto-Scroll ON (${Number(settings.scroll_speed).toFixed(2)}x)` : 'Auto-Scroll OFF'} • {settings.pause_on_hover ? 'Hover Pause ON' : 'Hover Pause OFF'} • {settings.show_arrows ? 'Arrows ON' : 'Arrows Hidden'}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{savingSettings ? 'Saving Settings...' : 'Save Carousel Settings'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategoryImagesPage;
