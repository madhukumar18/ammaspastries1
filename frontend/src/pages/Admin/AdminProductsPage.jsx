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
  Info,
  Download,
  FileSpreadsheet,
  FileUp,
  AlertCircle,
  Scale
} from 'lucide-react';

const AdminProductsPage = () => {
  const { showToast } = useApp();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSubcat, setSelectedSubcat] = useState('');

  // Bulk CSV Import / Export State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const bulkFileInputRef = useRef(null);

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
    portion_type: 'weight', // 'weight', 'portion', 'both'
    portion_unit: 'grams',  // 'grams', 'kg', 'pieces', 'slices', 'portions'
    portion_step: '500g',   // '500g', '1kg', '1', etc.
    piece_price: '120',
    piece_limit: '20',
    piece_min: '1',
    is_unlimited_pieces: false,
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

  const [dietFilter, setDietFilter] = useState(''); // '', 'true', 'false'

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/admin/products?search=${encodeURIComponent(search)}&per_page=50`;
      if (selectedCat) url += `&category_id=${selectedCat}`;
      if (dietFilter) url += `&is_eggless=${dietFilter}`;
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
  }, [search, selectedCat, selectedSubcat, dietFilter]);

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
      portion_type: 'weight',
      portion_unit: 'grams',
      portion_step: '500g',
      piece_price: '120',
      piece_limit: '20',
      piece_min: '1',
      is_unlimited_pieces: false,
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
        { size_weight: '1.5kg', price: '1399', discount_price: '' },
        { size_weight: '2kg', price: '1799', discount_price: '' },
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
      portion_type: product.portion_type || (product.weight && ((product.weight.toLowerCase().includes('piece') || product.weight.toLowerCase().includes('slice') || product.weight.toLowerCase().includes('portion') || product.weight.toLowerCase().includes('pcs')) && (product.weight.toLowerCase().includes('g') || product.weight.toLowerCase().includes('kg'))) ? 'both' : (product.weight && (product.weight.toLowerCase().includes('piece') || product.weight.toLowerCase().includes('slice') || product.weight.toLowerCase().includes('portion'))) ? 'portion' : 'weight'),
      portion_unit: product.portion_unit || 'grams',
      portion_step: product.portion_step || '500g',
      piece_price: product.piece_price ? String(product.piece_price) : '',
      piece_limit: product.piece_limit !== null && product.piece_limit !== undefined ? String(product.piece_limit) : '20',
      piece_min: product.piece_min ? String(product.piece_min) : '1',
      is_unlimited_pieces: product.piece_limit === 0 || product.piece_limit === null,
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
      const payload = {
        ...formData,
        piece_price: formData.piece_price ? Number(formData.piece_price) : null,
        piece_limit: formData.is_unlimited_pieces ? 0 : (formData.piece_limit ? Number(formData.piece_limit) : 20),
        piece_min: formData.piece_min ? Number(formData.piece_min) : 1,
      };
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.post('/admin/products', payload);
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

  // Bulk CSV Export of all products
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const res = await api.get('/admin/products/export-csv', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ammas_Pastries_Products_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('All website products exported to CSV successfully!', 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('Failed to export products to CSV.', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  // Download blank / sample CSV template
  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/admin/products/csv-template', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Ammas_Pastries_Products_Bulk_Template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Sample template downloaded.', 'success');
    } catch (err) {
      console.error('Template download failed:', err);
      showToast('Failed to download template.', 'error');
    }
  };

  // Handle CSV file selection and quick preview
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      showToast('Please select a valid .csv file.', 'error');
      return;
    }

    setImportFile(file);
    setImportResult(null);

    // Read quick preview (first 5 lines)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');
      if (lines.length > 0) {
        const preview = lines.slice(0, 5).map((l) => {
          return l.split(',').map((item) => item.replace(/^"|"$/g, '').trim());
        });
        setCsvPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  // Upload and process CSV
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Please select a CSV file first.', 'error');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formDataObj = new FormData();
      formDataObj.append('file', importFile);

      const res = await api.post('/admin/products/bulk-upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setImportResult(res.data.data);
        showToast(res.data.message || 'Bulk update completed!', 'success');
        fetchProducts(); // Refresh live table
      } else {
        showToast(res.data?.message || 'Bulk upload failed.', 'error');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Bulk upload failed.';
      showToast(errMsg, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenBulkModal = () => {
    setImportFile(null);
    setImportResult(null);
    setCsvPreviewRows([]);
    setBulkModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-chocolate">Bakery Products & Cakes</h1>
          <p className="text-xs text-slate-500">
            Manage signature cakes, pastries, varieties, variants, pricing, and bulk CSV updates across the website
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs"
            title="Download full CSV list of all products to view or edit in Excel"
          >
            {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export CSV</span>
          </button>

          {/* Bulk CSV Import / Update Button */}
          <button
            onClick={handleOpenBulkModal}
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs"
            title="Upload CSV/Excel file to add or update products in bulk"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bulk CSV Import</span>
          </button>

          {/* Add Cake Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Cake</span>
          </button>
        </div>
      </div>

      {/* Bulk CSV / Excel Management Action Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/60 rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-sm text-chocolate flex items-center gap-2">
              <span>Bulk Excel / CSV Catalog Manager</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                Add & Update Everything
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Export all products to Excel, update prices, descriptions, variants & images, or add new products via spreadsheet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export Live CSV</span>
          </button>
          <button
            onClick={handleOpenBulkModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV & Update</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
            title="Download empty CSV template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Template</span>
          </button>
        </div>
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

          {/* Dietary Filter in Admin */}
          <select
            value={dietFilter}
            onChange={(e) => setDietFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none"
          >
            <option value="">All Diet Types</option>
            <option value="true">🌱 100% Eggless</option>
            <option value="false">🥚 With Egg</option>
          </select>
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
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>SKU: {p.sku || 'N/A'}</span>
                            <span className={`px-1.5 py-0.2 rounded font-sans font-bold text-[10px] ${
                              p.is_eggless
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {p.is_eggless ? '🌱 Eggless' : '🥚 With Egg'}
                            </span>
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
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md w-max ${
                          p.portion_type === 'both'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : p.portion_type === 'portion'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {p.portion_type === 'both' ? '🎂 Both (Grams & Pcs)' : p.portion_type === 'portion' ? '🍰 By Portion' : '⚖️ By Weight'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.variants && p.variants.length > 0 ? (
                            p.variants.map((v) => (
                              <span key={v.id} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono">
                                {v.size_weight}: ₹{v.price}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">{p.weight || '1 variant'}</span>
                          )}
                        </div>
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

                {/* PORTION & WEIGHT CONFIGURATION SECTION */}
                <div className="sm:col-span-2 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5 rounded-2xl border-2 border-amber-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-amber-700" />
                        <span>Portion & Weight Configuration *</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Choose whether this product is sold by <strong>Weights (Grams to Kilograms)</strong>, by <strong>Portions (Pieces / Slices)</strong>, or <strong>Both (Pieces & Grams)</strong>.
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-amber-300 shadow-2xs self-start">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            portion_type: 'weight',
                            portion_unit: 'grams',
                            portion_step: '500g',
                            weight: '500g',
                            variants: [
                              { size_weight: '500g', price: prev.base_price || '549', discount_price: prev.discount_price || '' },
                              { size_weight: '1kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 1.8)) : '999', discount_price: '' },
                              { size_weight: '1.5kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 2.6)) : '1449', discount_price: '' },
                              { size_weight: '2kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 3.4)) : '1899', discount_price: '' },
                            ],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.portion_type === 'weight' || (!formData.portion_type || (formData.portion_type !== 'portion' && formData.portion_type !== 'both'))
                            ? 'bg-chocolate text-white shadow-xs'
                            : 'text-slate-600 hover:text-chocolate hover:bg-slate-50'
                        }`}
                      >
                        <span>⚖️ By Weight (Grams to Kgs)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            portion_type: 'portion',
                            portion_unit: 'pieces',
                            portion_step: '1',
                            weight: '1 Piece',
                            variants: [
                              { size_weight: '1 Piece', price: prev.base_price || '120', discount_price: prev.discount_price || '' },
                              { size_weight: '2 Pieces', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 1.9)) : '230', discount_price: '' },
                              { size_weight: '4 Pieces', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 3.6)) : '440', discount_price: '' },
                            ],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.portion_type === 'portion'
                            ? 'bg-chocolate text-white shadow-xs'
                            : 'text-slate-600 hover:text-chocolate hover:bg-slate-50'
                        }`}
                      >
                        <span>🍰 By Portions (Pieces / Slices)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            portion_type: 'both',
                            portion_unit: 'grams',
                            portion_step: '500g',
                            weight: prev.weight && !prev.weight.includes('Piece') ? prev.weight : '500g',
                            piece_price: prev.piece_price || (prev.base_price ? String(Math.round(Number(prev.base_price) / 4)) : '120'),
                            piece_limit: prev.piece_limit || '20',
                            piece_min: '1',
                            is_unlimited_pieces: false,
                            variants: prev.variants && prev.variants.length > 0 && !prev.variants[0]?.size_weight?.includes('Piece')
                              ? prev.variants
                              : [
                                  { size_weight: '500g', price: prev.base_price || '549', discount_price: prev.discount_price || '' },
                                  { size_weight: '1kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 1.8)) : '999', discount_price: '' },
                                  { size_weight: '1.5kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 2.6)) : '1449', discount_price: '' },
                                  { size_weight: '2kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 3.4)) : '1899', discount_price: '' },
                                ],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.portion_type === 'both'
                            ? 'bg-chocolate text-white shadow-xs'
                            : 'text-slate-600 hover:text-chocolate hover:bg-slate-50'
                        }`}
                      >
                        <span>🎂 Both (Grams &amp; Pieces)</span>
                      </button>
                    </div>
                  </div>

                  {formData.portion_type === 'both' ? (
                    /* DUAL MODE CONFIGURATION: WEIGHT (GRAMS/KGS) AND PIECES (1 TO ADMIN LIMIT) */
                    <div className="space-y-4 pt-2">
                      <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <span className="text-base">💡</span>
                        <div>
                          <strong>Dual Ordering Enabled:</strong> Customers on the website will be able to choose whether to order by <strong>Weight (Grams to Kgs)</strong> OR by <strong>Pieces (1 to {formData.is_unlimited_pieces ? 'Unlimited' : (formData.piece_limit || 20)} pieces)</strong>.
                        </div>
                      </div>

                      {/* SECTION 1: WEIGHT CONTROLS */}
                      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
                          <Scale className="w-3.5 h-3.5 text-amber-800" />
                          <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                            1. Weight Configuration (Grams to Kilograms)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Default Min Weight *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="e.g. 500g"
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            />
                            <div className="flex gap-1 mt-1">
                              {['500g', '0.5kg', '1kg'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, weight: val })}
                                  className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium cursor-pointer"
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Weight Increment (+ Button)
                            </label>
                            <select
                              value={formData.portion_step || '500g'}
                              onChange={(e) => setFormData({ ...formData, portion_step: e.target.value })}
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            >
                              <option value="500g">+500g (0.5kg increments: 500g → 1kg → 1.5kg → 2kg)</option>
                              <option value="1kg">+1kg (1kg increments: 1kg → 2kg → 3kg)</option>
                              <option value="250g">+250g (Quarter kg increments: 250g → 500g → 750g)</option>
                            </select>
                          </div>
                        </div>

                        {/* Weight Tiers Table */}
                        <div className="pt-2 border-t border-amber-200/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-chocolate text-[11px]">
                              Weight Tiers &amp; Prices (Customers scale with + / - button):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const count = (formData.variants?.length || 0) + 1;
                                const nextWeight = `${count * 0.5}kg`;
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: [
                                    ...(prev.variants || []),
                                    { size_weight: nextWeight, price: '', discount_price: '' },
                                  ],
                                }));
                              }}
                              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Weight Tier
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {formData.variants?.map((v, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                                <input
                                  type="text"
                                  value={v.size_weight}
                                  onChange={(e) => {
                                    const updated = [...formData.variants];
                                    updated[i].size_weight = e.target.value;
                                    setFormData({ ...formData, variants: updated });
                                  }}
                                  placeholder="500g"
                                  className="w-20 p-1 rounded-lg border border-slate-200 font-bold text-xs"
                                />
                                <span className="text-xs text-slate-400">₹</span>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={(e) => {
                                    const updated = [...formData.variants];
                                    updated[i].price = e.target.value;
                                    setFormData({ ...formData, variants: updated });
                                  }}
                                  placeholder="Price"
                                  className="w-24 p-1 rounded-lg border border-slate-200 text-xs font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      variants: prev.variants.filter((_, idx) => idx !== i),
                                    }));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                  title="Remove tier"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: PIECES CONTROLS (1 PIECE TO ADMIN LIMIT) */}
                      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
                          <span className="text-sm">🍰</span>
                          <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                            2. Pieces Configuration (1 Piece to Admin Limit)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Price Per Piece (₹) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                required
                                value={formData.piece_price}
                                onChange={(e) => setFormData({ ...formData, piece_price: e.target.value })}
                                placeholder="e.g. 120"
                                className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Price for each individual piece / slice</p>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Min Starting Pieces
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.piece_min || '1'}
                              onChange={(e) => setFormData({ ...formData, piece_min: e.target.value })}
                              placeholder="1"
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">Customer starts order from 1 piece</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block font-bold text-slate-700 text-[11px]">
                                Max Pieces Limit (Admin Limit)
                              </label>
                              <label className="flex items-center gap-1 text-[10px] font-bold text-amber-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.is_unlimited_pieces}
                                  onChange={(e) => setFormData({ ...formData, is_unlimited_pieces: e.target.checked })}
                                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>Unlimited</span>
                              </label>
                            </div>
                            <input
                              type="number"
                              min="1"
                              disabled={formData.is_unlimited_pieces}
                              value={formData.is_unlimited_pieces ? '' : formData.piece_limit}
                              onChange={(e) => setFormData({ ...formData, piece_limit: e.target.value })}
                              placeholder={formData.is_unlimited_pieces ? 'Unlimited Pieces' : 'e.g. 20'}
                              className={`w-full p-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                                formData.is_unlimited_pieces
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-white border-slate-200 focus:border-amber-500'
                              }`}
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formData.is_unlimited_pieces
                                ? 'Customers can order unlimited pieces with + button'
                                : `Limits customer + button scaling to max ${formData.piece_limit || 20} pieces`}
                            </p>
                          </div>
                        </div>

                        {/* Quick summary badge */}
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 text-[11px] text-chocolate font-medium flex items-center justify-between">
                          <span>
                            Customer limits: <strong>1 Piece</strong> up to <strong>{formData.is_unlimited_pieces ? 'Unlimited' : `${formData.piece_limit || 20} Pieces`}</strong>
                          </span>
                          <span className="font-bold text-amber-800">
                            Rate: ₹{formData.piece_price || 0} / piece
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : formData.portion_type === 'portion' ? (
                    /* Portions Configuration */
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Default Starting Portion (Min) *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="e.g. 1 Piece"
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-1 mt-1">
                            {['1 Piece', '1 Slice', '1 Portion', 'Pack of 2'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setFormData({ ...formData, weight: val })}
                                className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium"
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Portion Unit Label
                          </label>
                          <select
                            value={formData.portion_unit || 'pieces'}
                            onChange={(e) => setFormData({ ...formData, portion_unit: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="pieces">Pieces (e.g. 1 Piece, 2 Pieces)</option>
                            <option value="slices">Slices (e.g. 1 Slice, 2 Slices)</option>
                            <option value="portions">Portions (e.g. 1 Portion, 2 Portions)</option>
                            <option value="packs">Packs / Boxes (e.g. Pack of 4)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Portion Step (+ Button)
                          </label>
                          <select
                            value={formData.portion_step || '1'}
                            onChange={(e) => setFormData({ ...formData, portion_step: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="1">+1 (1 → 2 → 3 → 4...)</option>
                            <option value="2">+2 (2 → 4 → 6 → 8...)</option>
                            <option value="4">+4 (4 → 8 → 12...)</option>
                          </select>
                        </div>
                      </div>

                      {/* Portion Tiers Table */}
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-chocolate text-[11px]">
                            Portion Tiers & Prices (Customers scale with + / - button):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const count = (formData.variants?.length || 0) + 1;
                              const label = `${count} ${formData.portion_unit === 'slices' ? 'Slices' : formData.portion_unit === 'portions' ? 'Portions' : formData.portion_unit === 'packs' ? 'Packs' : 'Pieces'}`;
                              setFormData((prev) => ({
                                ...prev,
                                variants: [
                                  ...(prev.variants || []),
                                  { size_weight: label, price: '', discount_price: '' },
                                ],
                              }));
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Portion Tier
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.variants?.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <input
                                type="text"
                                value={v.size_weight}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].size_weight = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="1 Piece"
                                className="w-24 p-1 rounded-lg border border-slate-200 font-bold text-xs"
                              />
                              <span className="text-xs text-slate-400">₹</span>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].price = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="Price"
                                className="w-24 p-1 rounded-lg border border-slate-200 text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, idx) => idx !== i),
                                  }));
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                title="Remove tier"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Weight Configuration */
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Default Starting Weight (Min) *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="e.g. 500g"
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-1 mt-1">
                            {['500g', '0.5kg', '1kg'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setFormData({ ...formData, weight: val })}
                                className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium"
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Stepping Increment (+ Button) *
                          </label>
                          <select
                            value={formData.portion_step || '500g'}
                            onChange={(e) => setFormData({ ...formData, portion_step: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="500g">+500g (0.5kg increments: 500g → 1kg → 1.5kg → 2kg)</option>
                            <option value="1kg">+1kg (1kg increments: 1kg → 2kg → 3kg)</option>
                            <option value="250g">+250g (Quarter kg increments: 250g → 500g → 750g)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Measurement Unit
                          </label>
                          <select
                            value={formData.portion_unit || 'grams'}
                            onChange={(e) => setFormData({ ...formData, portion_unit: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="grams">Grams &amp; Kilograms (g / kg)</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="lbs">Pounds (lbs)</option>
                          </select>
                        </div>
                      </div>

                      {/* Weight Tiers Table */}
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-chocolate text-[11px]">
                            Weight Tiers &amp; Prices (Customers scale with + / - button):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const count = (formData.variants?.length || 0) + 1;
                              const nextWeight = `${count * 0.5}kg`;
                              setFormData((prev) => ({
                                ...prev,
                                variants: [
                                  ...(prev.variants || []),
                                  { size_weight: nextWeight, price: '', discount_price: '' },
                                ],
                              }));
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Weight Tier
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.variants?.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <input
                                type="text"
                                value={v.size_weight}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].size_weight = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="500g"
                                className="w-20 p-1 rounded-lg border border-slate-200 font-bold text-xs"
                              />
                              <span className="text-xs text-slate-400">₹</span>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].price = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="Price"
                                className="w-24 p-1 rounded-lg border border-slate-200 text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, idx) => idx !== i),
                                  }));
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                title="Remove tier"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dietary Selection: 100% Eggless vs With Egg */}
                <div className="space-y-1.5 sm:col-span-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dietary Classification *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Select recipe type: <strong>100% Eggless</strong> will appear in the Eggless & All sections; <strong>With Egg</strong> will appear in the With Egg & All sections.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_eggless: true })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        formData.is_eggless
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-chocolate flex items-center gap-1">
                          <span>🌱 100% Pure Eggless</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Veg</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Visible in <strong>100% Eggless</strong> section
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_eggless: false })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        !formData.is_eggless
                          ? 'border-amber-700 bg-amber-50 text-amber-950 ring-2 ring-amber-700/20 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-700 border-2 border-white ring-1 ring-amber-700 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-chocolate flex items-center gap-1">
                          <span>🥚 With Egg (Classic Cake)</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Non-Veg</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Visible in <strong>With Egg</strong> section
                        </div>
                      </div>
                    </button>
                  </div>
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

      {/* Bulk CSV Import & Update Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 border border-amber-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-xl text-chocolate">
                    Bulk Product CSV Import & Excel Update
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add new products or update existing details across the entire store via spreadsheet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Explanatory Info Card */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>How Bulk Updating & Adding Works:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed pl-1">
                <li>
                  <strong>Updating Existing Products:</strong> Keep the <code>ID</code>, <code>SKU</code>, or <code>Slug</code> in the CSV. Any column you change (e.g. price, stock, eggless, description, variants) will automatically update the live product.
                </li>
                <li>
                  <strong>Adding New Products:</strong> Leave the <code>ID</code> column blank. A new cake/product will be created with an auto-generated SKU if left empty.
                </li>
                <li>
                  <strong>Theme Cakes:</strong> Set Category to <code>Theme Cakes</code> and leave Subcategory empty.
                </li>
                <li>
                  <strong>Variants Format:</strong> Multiple sizes are defined as <code>Size:Price:Discount</code> separated by <code>|</code> (e.g. <code>500g:499:450|1kg:899:849</code>).
                </li>
              </ul>
            </div>

            {/* Template & Export Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="text-xs text-slate-600">
                Need a ready-made template or your current inventory?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/70 hover:bg-amber-200/80 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 px-3 py-1.5 rounded-xl transition-all"
                >
                  {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Export Live Products</span>
                </button>
              </div>
            </div>

            {/* File Upload Zone */}
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div
                onClick={() => bulkFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  importFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
                }`}
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${importFile ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {importFile ? <CheckCircle2 className="w-6 h-6" /> : <FileUp className="w-6 h-6" />}
                  </div>
                  {importFile ? (
                    <div>
                      <p className="font-bold text-xs text-emerald-900">{importFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(importFile.size / 1024).toFixed(1)} KB — Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-xs text-slate-700">Click or drag & drop your completed .csv file here</p>
                      <p className="text-[10px] text-slate-400">Compatible with Microsoft Excel, Google Sheets & Apple Numbers</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Quick Preview */}
              {csvPreviewRows.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>File Preview (First {csvPreviewRows.length - 1} data rows):</span>
                    <span className="text-slate-400 font-normal">{csvPreviewRows[0]?.length || 0} columns detected</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-40 bg-white">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          {csvPreviewRows[0]?.slice(0, 8).map((col, idx) => (
                            <th key={idx} className="p-2 whitespace-nowrap">{col}</th>
                          ))}
                          {csvPreviewRows[0]?.length > 8 && (
                            <th className="p-2 text-slate-400">+{csvPreviewRows[0].length - 8} more cols</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {csvPreviewRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.slice(0, 8).map((val, cIdx) => (
                              <td key={cIdx} className="p-2 whitespace-nowrap text-slate-700 max-w-[120px] truncate">
                                {val || <span className="text-slate-300 italic">—</span>}
                              </td>
                            ))}
                            {row.length > 8 && (
                              <td className="p-2 text-slate-400 text-center">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Banner */}
              {importResult && (
                <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-chocolate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Import Results:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2 font-bold">
                      <div className="text-lg">{importResult.created_count}</div>
                      <div className="text-[10px] uppercase font-semibold">New Created</div>
                    </div>
                    <div className="bg-blue-50 text-blue-800 border border-blue-200 rounded-xl p-2 font-bold">
                      <div className="text-lg">{importResult.updated_count}</div>
                      <div className="text-[10px] uppercase font-semibold">Updated</div>
                    </div>
                    <div className={`rounded-xl p-2 font-bold border ${importResult.failed_count > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      <div className="text-lg">{importResult.failed_count}</div>
                      <div className="text-[10px] uppercase font-semibold">Failed / Skipped</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Notices / Errors ({importResult.errors.length}):</span>
                      </div>
                      <ul className="list-disc list-inside max-h-32 overflow-y-auto space-y-0.5">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!importFile || importing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing & Updating Products...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Update Website</span>
                    </>
                  )}
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
