import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const defaultCupcakeVariants = {
    cream_options: [
      { id: 'with_cream', name: 'With Cream' },
      { id: 'without_cream', name: 'Without Cream' },
    ],
    egg_options: [
      { id: 'egg', name: 'With Egg', badge: 'Classic' },
      { id: 'eggless', name: '100% Pure Eggless', badge: 'Veg' },
    ],
    matrix: [
      { cream_id: 'with_cream', egg_id: 'egg', price: '55', is_available: true },
      { cream_id: 'with_cream', egg_id: 'eggless', price: '65', is_available: true },
      { cream_id: 'without_cream', egg_id: 'egg', price: '40', is_available: true },
      { cream_id: 'without_cream', egg_id: 'eggless', price: '45', is_available: true },
    ],
  };

  const defaultSnackVariants = {
    pricing_type: 'both', // 'piece' | 'weight' | 'both'
    piece: {
      egg_price: '40',
      eggless_price: '50',
      is_available: true,
    },
    weight: {
      unit: 'grams', // 'grams' | 'kg'
      value: '250g',
      egg_price: '120',
      eggless_price: '140',
      is_available: true,
    },
  };

  const [newCreamInput, setNewCreamInput] = useState('');
  const [newEggInput, setNewEggInput] = useState('');

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
    enable_cupcake_matrix: false,
    cupcake_variants: defaultCupcakeVariants,
    enable_snack_matrix: false,
    snack_variants: defaultSnackVariants,
  });

  const [dietFilter, setDietFilter] = useState(''); // '', 'true', 'false'
  const [stockFilter, setStockFilter] = useState(''); // '', 'in_stock', 'out_of_stock'
  const location = useLocation();
  const navigate = useNavigate();

  // Handle URL query parameters: ?action=new to open modal, ?filter=out_of_stock, ?category_id=X, ?section=slug
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId = params.get('category_id');
    const sectionSlug = params.get('section') || params.get('category');

    if (catId) {
      setSelectedCat(catId);
      setSelectedSubcat('');
    } else if (sectionSlug && categories.length > 0) {
      const found = categories.find((c) => c.slug === sectionSlug);
      if (found) {
        setSelectedCat(String(found.id));
        setSelectedSubcat('');
      }
    } else if (!params.get('filter') && !params.get('action') && !location.search) {
      setSelectedCat('');
      setSelectedSubcat('');
      setStockFilter('');
    }

    if (params.get('action') === 'new') {
      handleOpenAdd();
    }
    if (params.get('filter') === 'out_of_stock') {
      setStockFilter('out_of_stock');
    } else if (params.get('filter') === 'in_stock') {
      setStockFilter('in_stock');
    } else if (!params.get('filter')) {
      setStockFilter('');
    }
  }, [location.search, categories]);

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
        if (stockFilter === 'out_of_stock') {
          list = list.filter((p) => !p.is_available);
        } else if (stockFilter === 'in_stock') {
          list = list.filter((p) => Boolean(p.is_available));
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
  }, [search, selectedCat, selectedSubcat, dietFilter, stockFilter]);

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
      enable_cupcake_matrix: false,
      cupcake_variants: defaultCupcakeVariants,
      enable_snack_matrix: defaultCat?.slug === 'snacks' || defaultCat?.name?.toLowerCase() === 'snacks',
      snack_variants: defaultSnackVariants,
    });
    setNewCreamInput('');
    setNewEggInput('');
    setImageMode('gallery');
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setUploadSuccessName('');
    const hasExistingMatrix = Boolean(
      product.cupcake_variants?.matrix && product.cupcake_variants.matrix.length > 0
    );
    const isCupcakeProduct = Boolean(
      product.subcategory_id === 20 ||
      String(product.name || '').toLowerCase().includes('cup cake') ||
      String(product.name || '').toLowerCase().includes('cupcake')
    );
    const isSnackProduct = Boolean(
      product.category?.slug === 'snacks' ||
      product.category?.name?.toLowerCase() === 'snacks' ||
      categories.find((c) => String(c.id) === String(product.category_id))?.slug === 'snacks' ||
      Boolean(product.snack_variants?.pricing_type)
    );

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
      enable_cupcake_matrix: hasExistingMatrix || isCupcakeProduct,
      cupcake_variants: product.cupcake_variants || defaultCupcakeVariants,
      enable_snack_matrix: isSnackProduct || Boolean(product.snack_variants),
      snack_variants: product.snack_variants || defaultSnackVariants,
    });
    setNewCreamInput('');
    setNewEggInput('');
    setImageMode('gallery');
    setModalOpen(true);
  };

  const handleAddCreamOption = () => {
    const name = newCreamInput.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = formData.cupcake_variants?.cream_options || [];
    if (existing.some((c) => c.id === id)) {
      showToast('A cream option with this name already exists.', 'warning');
      return;
    }
    const updatedCream = [...existing, { id, name }];
    const eggOpts = formData.cupcake_variants?.egg_options || [];
    const currentMatrix = formData.cupcake_variants?.matrix || [];
    const newCombinations = eggOpts.map((egg) => ({
      cream_id: id,
      egg_id: egg.id,
      price: formData.base_price || '50',
      is_available: true,
    }));
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        cream_options: updatedCream,
        matrix: [...currentMatrix, ...newCombinations],
      },
    }));
    setNewCreamInput('');
  };

  const handleRemoveCreamOption = (creamId) => {
    const updatedCream = (formData.cupcake_variants?.cream_options || []).filter((c) => c.id !== creamId);
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).filter((m) => m.cream_id !== creamId);
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        cream_options: updatedCream,
        matrix: updatedMatrix,
      },
    }));
  };

  const handleAddEggOption = () => {
    const name = newEggInput.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = formData.cupcake_variants?.egg_options || [];
    if (existing.some((e) => e.id === id)) {
      showToast('An egg option with this name already exists.', 'warning');
      return;
    }
    const updatedEgg = [
      ...existing,
      {
        id,
        name,
        badge: name.toLowerCase().includes('eggless') || name.toLowerCase().includes('veg') ? 'Veg' : 'Classic',
      },
    ];
    const creamOpts = formData.cupcake_variants?.cream_options || [];
    const currentMatrix = formData.cupcake_variants?.matrix || [];
    const newCombinations = creamOpts.map((cream) => ({
      cream_id: cream.id,
      egg_id: id,
      price: formData.base_price || '50',
      is_available: true,
    }));
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        egg_options: updatedEgg,
        matrix: [...currentMatrix, ...newCombinations],
      },
    }));
    setNewEggInput('');
  };

  const handleRemoveEggOption = (eggId) => {
    const updatedEgg = (formData.cupcake_variants?.egg_options || []).filter((e) => e.id !== eggId);
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).filter((m) => m.egg_id !== eggId);
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        egg_options: updatedEgg,
        matrix: updatedMatrix,
      },
    }));
  };

  const handleUpdateMatrixPrice = (creamId, eggId, price) => {
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).map((m) => {
      if (m.cream_id === creamId && m.egg_id === eggId) {
        return { ...m, price };
      }
      return m;
    });
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        matrix: updatedMatrix,
      },
    }));
  };

  const handleToggleMatrixAvailability = (creamId, eggId) => {
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).map((m) => {
      if (m.cream_id === creamId && m.egg_id === eggId) {
        return { ...m, is_available: !m.is_available };
      }
      return m;
    });
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        matrix: updatedMatrix,
      },
    }));
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
        cupcake_variants: formData.enable_cupcake_matrix ? formData.cupcake_variants : null,
        snack_variants: formData.enable_snack_matrix ? formData.snack_variants : null,
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

          {/* Stock Availability Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none"
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">✅ In Stock</option>
            <option value="out_of_stock">⚠️ Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Active Section Filter Banner */}
      {(selectedCat || stockFilter || selectedSubcat) && (
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-chocolate shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-900">Showing Section Products:</span>
            {selectedCat && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Category: {categories.find((c) => String(c.id) === String(selectedCat))?.name || 'Selected Section'}
              </span>
            )}
            {selectedSubcat && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Variety: {filterSubcategories.find((s) => String(s.id) === String(selectedSubcat))?.name || selectedSubcat}
              </span>
            )}
            {stockFilter && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Status: {stockFilter === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
              </span>
            )}
            <span className="text-slate-500 font-semibold">({products.length} products)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCat('');
              setSelectedSubcat('');
              setStockFilter('');
              navigate('/admin/products');
            }}
            className="text-xs font-bold text-amber-900 hover:text-rose-600 bg-white border border-amber-300 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            Clear / Show All Products
          </button>
        </div>
      )}

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
                      const isSnacks = Boolean(catObj?.slug === 'snacks' || catObj?.name?.toLowerCase() === 'snacks');
                      const firstSub = catObj?.subcategories?.[0]?.id || '';
                      setFormData({
                        ...formData,
                        category_id: newCatId,
                        subcategory_id: firstSub,
                        enable_snack_matrix: isSnacks || formData.enable_snack_matrix,
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

                {/* SNACK FLEXIBLE PRICING SECTION */}
                <div className="sm:col-span-2">
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 sm:p-5 transition-all shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🥐</span>
                          <h4 className="text-sm font-black text-chocolate">
                            Snack Flexible Pricing (Unit Type &amp; Egg / Eggless)
                          </h4>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Snacks Mode
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Configure whether this snack is sold by <strong>Piece</strong>, by <strong>Weight (Grams/Kg)</strong>, or <strong>Both</strong> with independent Egg and Eggless pricing.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!formData.enable_snack_matrix}
                          onChange={(e) => setFormData({ ...formData, enable_snack_matrix: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {formData.enable_snack_matrix && (
                      <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-4">
                        {/* 1. Unit Type Selection */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Select Available Unit Type(s) *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Only Piece */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  snack_variants: {
                                    ...prev.snack_variants,
                                    pricing_type: 'piece',
                                  },
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                formData.snack_variants?.pricing_type === 'piece'
                                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/30 shadow-xs'
                                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-chocolate flex items-center gap-1.5">
                                  <span>🍰</span>
                                  <span>Only Piece</span>
                                </span>
                                {formData.snack_variants?.pricing_type === 'piece' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Sold only per individual piece/slice
                              </span>
                            </button>

                            {/* Only Weight */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  snack_variants: {
                                    ...prev.snack_variants,
                                    pricing_type: 'weight',
                                  },
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                formData.snack_variants?.pricing_type === 'weight'
                                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/30 shadow-xs'
                                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-chocolate flex items-center gap-1.5">
                                  <span>⚖️</span>
                                  <span>Only Weight</span>
                                </span>
                                {formData.snack_variants?.pricing_type === 'weight' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Sold by weight (Grams / Kilograms)
                              </span>
                            </button>

                            {/* Both Piece and Weight */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  snack_variants: {
                                    ...prev.snack_variants,
                                    pricing_type: 'both',
                                  },
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                formData.snack_variants?.pricing_type === 'both'
                                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/30 shadow-xs'
                                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-chocolate flex items-center gap-1.5">
                                  <span>🥐</span>
                                  <span>Both (Piece &amp; Weight)</span>
                                </span>
                                {formData.snack_variants?.pricing_type === 'both' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Customer selects Piece or Weight first
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* CONDITIONAL PANEL 1: PIECE-BASED PRICING */}
                        {(formData.snack_variants?.pricing_type === 'piece' || formData.snack_variants?.pricing_type === 'both') && (
                          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                              <span className="text-base">🍰</span>
                              <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                                Piece-Based Pricing (Per Piece Rate)
                              </span>
                              {formData.snack_variants?.pricing_type === 'both' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold ml-auto">
                                  Option 1
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>100% Pure Eggless Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'piece' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.piece?.eggless_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          piece: {
                                            ...prev.snack_variants?.piece,
                                            eggless_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 50"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                                  <span>With Egg Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'piece' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.piece?.egg_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          piece: {
                                            ...prev.snack_variants?.piece,
                                            egg_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 40"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CONDITIONAL PANEL 2: WEIGHT-BASED PRICING */}
                        {(formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both') && (
                          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                              <span className="text-base">⚖️</span>
                              <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                                Weight-Based Pricing (Grams / Kilograms)
                              </span>
                              {formData.snack_variants?.pricing_type === 'both' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold ml-auto">
                                  Option 2
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Measurement Unit Selector */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Unit of Measurement *
                                </label>
                                <select
                                  value={formData.snack_variants?.weight?.unit || 'grams'}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      snack_variants: {
                                        ...prev.snack_variants,
                                        weight: {
                                          ...prev.snack_variants?.weight,
                                          unit: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                                >
                                  <option value="grams">Grams (g)</option>
                                  <option value="kg">Kilograms (kg)</option>
                                </select>
                              </div>

                              {/* Weight Portion Value */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Portion / Pack Size *
                                </label>
                                <input
                                  type="text"
                                  required={formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both'}
                                  value={formData.snack_variants?.weight?.value || '250g'}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      snack_variants: {
                                        ...prev.snack_variants,
                                        weight: {
                                          ...prev.snack_variants?.weight,
                                          value: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="e.g. 250g"
                                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500"
                                />
                                <div className="flex gap-1 mt-1">
                                  {(formData.snack_variants?.weight?.unit === 'kg' ? ['0.5kg', '1kg', '2kg'] : ['100g', '250g', '500g']).map((val) => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          snack_variants: {
                                            ...prev.snack_variants,
                                            weight: {
                                              ...prev.snack_variants?.weight,
                                              value: val,
                                            },
                                          },
                                        }))
                                      }
                                      className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium cursor-pointer"
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Weight Eggless Price */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>100% Pure Eggless Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.weight?.eggless_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          weight: {
                                            ...prev.snack_variants?.weight,
                                            eggless_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 140"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>

                              {/* Weight With Egg Price */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                                  <span>With Egg Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.weight?.egg_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          weight: {
                                            ...prev.snack_variants?.weight,
                                            egg_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 120"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* PORTION & WEIGHT CONFIGURATION SECTION */}
                {!formData.enable_snack_matrix && (
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
                )}

                {/* Cupcake Two-Level Variant Matrix (Cream Type × Egg Type) */}
                <div className="sm:col-span-2 pt-2">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5 transition-all">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧁</span>
                          <h4 className="text-sm font-bold text-chocolate">Cupcake Variant Matrix (Cream Type × Egg Type)</h4>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Two-Level Pricing
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Configure independent pricing for combinations of Cream types (With Cream / Without Cream) and Egg types (Egg / Eggless).
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!formData.enable_cupcake_matrix}
                          onChange={(e) => setFormData({ ...formData, enable_cupcake_matrix: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {formData.enable_cupcake_matrix && (
                      <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-5">
                        {/* 1. Manage Cream Options */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            1. Cream Options (e.g. With Cream, Without Cream)
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {(formData.cupcake_variants?.cream_options || []).map((cream) => (
                              <span
                                key={cream.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                {cream.name}
                                {(formData.cupcake_variants?.cream_options || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCreamOption(cream.id)}
                                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer text-xs"
                                    title="Delete cream option"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 max-w-sm">
                            <input
                              type="text"
                              value={newCreamInput}
                              onChange={(e) => setNewCreamInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCreamOption(); } }}
                              placeholder="New cream option (e.g. Extra Cream)"
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddCreamOption}
                              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer transition shadow-2xs"
                            >
                              + Add Cream
                            </button>
                          </div>
                        </div>

                        {/* 2. Manage Egg Options */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            2. Egg / Recipe Options (e.g. With Egg, 100% Pure Eggless)
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {(formData.cupcake_variants?.egg_options || []).map((egg) => (
                              <span
                                key={egg.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                <span className={`w-2 h-2 rounded-full ${egg.id.includes('eggless') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {egg.name}
                                {(formData.cupcake_variants?.egg_options || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEggOption(egg.id)}
                                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer text-xs"
                                    title="Delete egg option"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 max-w-sm">
                            <input
                              type="text"
                              value={newEggInput}
                              onChange={(e) => setNewEggInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEggOption(); } }}
                              placeholder="New egg/dietary option"
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddEggOption}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer transition shadow-2xs"
                            >
                              + Add Egg Option
                            </button>
                          </div>
                        </div>

                        {/* 3. Combinations Matrix Pricing Table */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            3. Combination Prices (Matrix)
                          </label>
                          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-amber-100/60 text-slate-700 font-bold border-b border-amber-200 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-3.5 py-2.5">Cream Type</th>
                                    <th className="px-3.5 py-2.5">Egg / Recipe</th>
                                    <th className="px-3.5 py-2.5">Price (₹)</th>
                                    <th className="px-3.5 py-2.5 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100">
                                  {(formData.cupcake_variants?.matrix || []).map((m, idx) => {
                                    const creamName = (formData.cupcake_variants?.cream_options || []).find((c) => c.id === m.cream_id)?.name || m.cream_id;
                                    const eggName = (formData.cupcake_variants?.egg_options || []).find((e) => e.id === m.egg_id)?.name || m.egg_id;
                                    return (
                                      <tr key={`${m.cream_id}_${m.egg_id}_${idx}`} className="hover:bg-amber-50/40 transition-colors">
                                        <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                                          {creamName}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-slate-700">
                                          <span className="inline-flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${m.egg_id.includes('eggless') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {eggName}
                                          </span>
                                        </td>
                                        <td className="px-3.5 py-2.5">
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-400 font-semibold">₹</span>
                                            <input
                                              type="number"
                                              value={m.price}
                                              onChange={(e) => handleUpdateMatrixPrice(m.cream_id, m.egg_id, e.target.value)}
                                              placeholder="Price"
                                              className="w-24 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                              min="0"
                                              step="1"
                                            />
                                          </div>
                                        </td>
                                        <td className="px-3.5 py-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleMatrixAvailability(m.cream_id, m.egg_id)}
                                            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                                              m.is_available !== false
                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                          >
                                            {m.is_available !== false ? 'Available' : 'Unavailable'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
