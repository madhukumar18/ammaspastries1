import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  X,
  Cake,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  FolderTree,
  Loader2,
  CheckCircle2,
  Info
} from 'lucide-react';

const AdminProductsPage = () => {
  const { showToast } = useApp();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSubcat, setSelectedSubcat] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Image Upload State (Local Gallery vs URL Link)
  const [imageMode, setImageMode] = useState('gallery'); // 'gallery' or 'url'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccessName, setUploadSuccessName] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    subcategory_id: '',
    base_price: '',
    discount_price: '',
    weight: '500g',
    short_description: '',
    description: '',
    is_eggless: true,
    is_available: true,
    is_featured: false,
    is_popular: false,
    is_new_arrival: false,
    is_gifting: false,
    image_url: '',
    variants: [
      { size_weight: '500g', price: '', discount_price: '' },
      { size_weight: '1kg', price: '', discount_price: '' },
    ],
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/admin/products?search=${encodeURIComponent(search)}&per_page=50`;
      if (selectedCat) url += `&category_id=${selectedCat}`;
      const res = await api.get(url);
      if (res.data?.data) {
        let list = res.data.data;
        if (selectedSubcat) {
          list = list.filter((p) => String(p.subcategory_id) === String(selectedSubcat));
        }
        setProducts(list);
      }
    } catch (err) {
      console.warn('Error loading admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCat, selectedSubcat]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/admin/categories');
        if (res.data?.data) {
          setCategories(res.data.data);
          if (res.data.data.length > 0 && !formData.category_id) {
            setFormData((prev) => ({ ...prev, category_id: res.data.data[0].id }));
          }
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCats();
  }, []);

  // Compute available subcategories for currently selected category in modal
  const selectedCategoryObj = categories.find((c) => String(c.id) === String(formData.category_id));
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  // Compute available subcategories for category filter
  const filterCategoryObj = categories.find((c) => String(c.id) === String(selectedCat));
  const filterSubcategories = filterCategoryObj?.subcategories || [];

  const handleOpenAdd = () => {
    setEditingId(null);
    setUploadSuccessName('');
    const defaultCat = categories.find((c) => c.slug === 'cakes-pastries') || categories[0];
    const defaultSub = defaultCat?.subcategories?.[0]?.id || '';

    setFormData({
      name: '',
      sku: 'AMP-' + Math.floor(1000 + Math.random() * 9000),
      category_id: defaultCat?.id || '',
      subcategory_id: defaultSub,
      base_price: '499',
      discount_price: '450',
      weight: '500g',
      short_description: '',
      description: '',
      is_eggless: true,
      is_available: true,
      is_featured: false,
      is_popular: false,
      is_new_arrival: true,
      is_gifting: false,
      image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
      variants: [
        { size_weight: '500g', price: '499', discount_price: '450' },
        { size_weight: '1kg', price: '949', discount_price: '899' },
      ],
    });
    setImageMode('gallery');
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setUploadSuccessName('');
    setFormData({
      name: product.name,
      sku: product.sku || '',
      category_id: product.category_id,
      subcategory_id: product.subcategory_id || '',
      base_price: product.base_price,
      discount_price: product.discount_price || '',
      weight: product.weight || '500g',
      short_description: product.short_description || '',
      description: product.description || '',
      is_eggless: !!product.is_eggless,
      is_available: !!product.is_available,
      is_featured: !!product.is_featured,
      is_popular: !!product.is_popular,
      is_new_arrival: !!product.is_new_arrival,
      is_gifting: !!product.is_gifting,
      image_url: product.image_url || '',
      variants: product.variants?.map((v) => ({
        size_weight: v.size_weight,
        price: v.price,
        discount_price: v.discount_price || '',
      })) || [],
    });
    setImageMode('gallery');
    setModalOpen(true);
  };

  // Upload local image from device gallery
  const handleLocalImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (15MB)
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be less than 15MB', 'error');
      return;
    }

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: localPreview }));

    const uploadPayload = new FormData();
    uploadPayload.append('image', file);
    uploadPayload.append('folder', 'products');

    setUploadingImage(true);
    try {
      const res = await api.post('/admin/media/upload', uploadPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, image_url: res.data.data.url }));
        setUploadSuccessName(`${file.name} (${res.data.data.size_kb} KB)`);
        showToast('Image uploaded successfully from local gallery!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image to server.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, formData);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.post('/admin/products', formData);
        showToast('New product created successfully!', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to save product.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      showToast(`Deleted "${name}".`, 'info');
      fetchProducts();
    } catch (err) {
      showToast('Unable to delete product.', 'error');
    }
  };

  const handleToggle = async (id, field) => {
    try {
      await api.post(`/admin/products/${id}/toggle-field`, { field });
      fetchProducts();
      showToast('Status updated.', 'success');
    } catch (err) {
      showToast('Toggle failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-chocolate">Bakery Products & Cakes</h1>
          <p className="text-xs text-slate-500">
            Manage signature cakes, pastries, varieties (Exotic Fruitz, Mousse & Cheese, Something Special), variants, prices & images
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Cake</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setSelectedSubcat('');
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subcategory Filter (if category selected) */}
          {filterSubcategories.length > 0 && (
            <select
              value={selectedSubcat}
              onChange={(e) => setSelectedSubcat(e.target.value)}
              className="text-xs p-2 rounded-xl border border-amber-300 bg-amber-50/50 font-medium text-amber-900 focus:outline-none"
            >
              <option value="">All Varieties / Subcategories</option>
              {filterSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category & Variety</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Variants</th>
                <th className="p-4 text-center">Available</th>
                <th className="p-4 text-center">Bestseller</th>
                <th className="p-4 text-center">New</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading products...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100'}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100';
                          }}
                        />
                        <div>
                          <div className="font-bold text-chocolate text-sm leading-snug">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.sku || 'N/A'} {p.is_eggless ? '• 🟢 Eggless' : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-chocolate">{p.category?.name || 'General'}</div>
                      {p.subcategory ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {p.subcategory.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Regular</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-chocolate text-sm">₹{p.base_price}</div>
                      {p.discount_price && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Special: ₹{p.discount_price}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {p.variants && p.variants.length > 0 ? (
                          p.variants.map((v) => (
                            <span key={v.id} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono">
                              {v.size_weight}: ₹{v.price}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px]">1 variant</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, 'is_available')}
                        className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-colors ${
                          p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                        }`}
                        title={p.is_available ? 'Available' : 'Unavailable'}
                      >
                        {p.is_available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, 'is_popular')}
                        className={`w-7 h-7 rounded-full text-xs font-bold inline-flex items-center justify-center transition-colors ${
                          p.is_popular ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {p.is_popular ? '★' : '—'}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, 'is_new_arrival')}
                        className={`w-7 h-7 rounded-full text-xs font-bold inline-flex items-center justify-center transition-colors ${
                          p.is_new_arrival ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {p.is_new_arrival ? 'N' : '—'}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                          title="Edit Cake"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5 border border-amber-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-serif font-bold text-xl text-chocolate">
                  {editingId ? 'Edit Bakery Product' : 'Add New Cake / Product'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Select category, specific cake variety, price, weight and upload image from device gallery or link.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product / Cake Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Belgian Chocolate Truffle"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. AMP-8472"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Main Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const catObj = categories.find((c) => String(c.id) === String(newCatId));
                      const firstSub = catObj?.subcategories?.[0]?.id || '';
                      setFormData({
                        ...formData,
                        category_id: newCatId,
                        subcategory_id: firstSub,
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory / Varieties Selector */}
                <div>
                  <label className="block font-bold text-amber-900 mb-1 flex items-center justify-between">
                    <span>Cake Variety / Subcategory</span>
                    <span className="text-[10px] text-amber-600 font-normal">e.g. Exotic Fruitz, Mousse</span>
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 font-semibold text-amber-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- General (No Specific Variety) --</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="499"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Price (₹, optional)</label>
                  <input
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    placeholder="450"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Weight / Portion</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="500g"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_eggless"
                    checked={formData.is_eggless}
                    onChange={(e) => setFormData({ ...formData, is_eggless: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <label htmlFor="is_eggless" className="font-bold text-slate-700 cursor-pointer">
                    100% Pure Eggless Cake
                  </label>
                </div>
              </div>

              {/* DUAL-MODE IMAGE UPLOADER: LOCAL GALLERY OR URL LINK */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-chocolate flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Cake Product Image</span>
                  </span>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageMode('gallery')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                        imageMode === 'gallery'
                          ? 'bg-chocolate text-white shadow-2xs'
                          : 'text-slate-500 hover:text-chocolate'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>From Local Gallery / Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                        imageMode === 'url'
                          ? 'bg-chocolate text-white shadow-2xs'
                          : 'text-slate-500 hover:text-chocolate'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>From Image Link / URL</span>
                    </button>
                  </div>
                </div>

                {/* Option 1: Local Device Gallery Upload */}
                {imageMode === 'gallery' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleLocalImageSelect}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all"
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                          <span className="font-bold text-amber-800">Uploading photo from local gallery...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1">
                            <Upload className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-chocolate text-xs">
                            Click to browse photo from your device / local gallery
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Recommended resolution: <strong>800 × 800 px</strong> or <strong>1000 × 1000 px</strong> (Square 1:1, Max 15MB, JPG/PNG/WebP)
                          </p>
                        </div>
                      )}
                    </div>

                    {uploadSuccessName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Uploaded: {uploadSuccessName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 2: Image URL Input */}
                {imageMode === 'url' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Paste image web link (e.g. https://images.unsplash.com/...)"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Quick presets:</span>
                      {[
                        { label: 'Chocolate', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700' },
                        { label: 'Fruit Cake', url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700' },
                        { label: 'Red Velvet', url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=700' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: preset.url })}
                          className="text-[10px] bg-slate-200 hover:bg-amber-100 text-slate-700 hover:text-amber-800 px-2 py-0.5 rounded-md font-medium"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Live Preview */}
                {formData.image_url && (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-amber-300 shadow-2xs"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300';
                      }}
                    />
                    <div className="flex-1 min-w-0 text-[11px] text-slate-500 truncate">
                      <div className="font-bold text-chocolate">Active Image Preview</div>
                      <div className="truncate font-mono text-[10px]">{formData.image_url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image_url: '' });
                        setUploadSuccessName('');
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1 text-[11px] font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description (Tagline)</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="e.g. Rich Belgian ganache layered with moist cocoa sponge."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description / Ingredients</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Elaborate taste profile, ingredients, and allergen info..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Badges / Visibility Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Available</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Bestseller</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new_arrival}
                    onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">New Arrival</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_gifting}
                    onChange={(e) => setFormData({ ...formData, is_gifting: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Gifting Set</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingId ? 'Update Cake' : 'Create Cake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
