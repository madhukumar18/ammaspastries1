import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { formatImageUrl } from '../../utils/imageUrl';
import {
  Crown,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Search,
  Check,
  X,
  Upload,
  Layers,
  Cake,
  Filter,
  RefreshCw,
  Eye,
  AlertCircle,
  FolderPlus,
  Coins,
  ArrowRight,
  Scale,
  Calculator
} from 'lucide-react';

const STANDARD_FLAVOUR_PRESETS = [
  { name: 'Dutch Chocolate Truffle', egg_price: 500, eggless_price: 550 },
  { name: 'Fresh Vanilla Buttercream', egg_price: 450, eggless_price: 500 },
  { name: 'Royal Red Velvet & Cheese', egg_price: 600, eggless_price: 650 },
  { name: 'Butterscotch Crunch', egg_price: 480, eggless_price: 520 },
  { name: 'Black Forest Classic', egg_price: 520, eggless_price: 560 },
];

const AdminThemeCakePage = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('cakes'); // 'cakes' | 'subcategories'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Data
  const [themeCategory, setThemeCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [selectedSubFilter, setSelectedSubFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cake Modal state
  const [cakeModalOpen, setCakeModalOpen] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [cakeForm, setCakeForm] = useState({
    name: '',
    sku: '',
    subcategory_id: '',
    description: '',
    image_url: '',
    weight: '5kg',
    theme_cake_default_weight: 5,
    theme_cake_default_price: 2000,
    theme_cake_step_size: 1,
    theme_cake_price_tiers: [],
    is_active: true,
    flavours: [],
  });

  // Subcategory Modal state
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
  });

  // Load Theme Cakes category, its subcategories, and its products
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Categories to find theme-cakes category
      const catRes = await api.get('/categories');
      const allCats = catRes.data?.data || [];
      const themeCat = allCats.find(
        (c) => c.slug === 'theme-cakes' || c.name?.toLowerCase().includes('theme cake')
      );

      if (themeCat) {
        setThemeCategory(themeCat);
        setSubcategories(themeCat.subcategories || []);

        // 2. Fetch cakes under theme-cakes
        const prodRes = await api.get(`/admin/products?category_id=${themeCat.id}&per_page=100`);
        setCakes(prodRes.data?.data || []);
      } else {
        // Fallback: try fetching by slug
        const singleCat = await api.get('/categories/theme-cakes');
        if (singleCat.data?.data) {
          setThemeCategory(singleCat.data.data);
          setSubcategories(singleCat.data.data.subcategories || []);
          const prodRes = await api.get(`/admin/products?category_id=${singleCat.data.data.id}&per_page=100`);
          setCakes(prodRes.data?.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching theme cakes admin data:', err);
      showToast('Could not load Theme Cakes catalog data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered cakes list
  const filteredCakes = useMemo(() => {
    return cakes.filter((cake) => {
      const matchSearch =
        cake.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cake.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSub =
        selectedSubFilter === 'all' ||
        String(cake.subcategory_id) === String(selectedSubFilter);
      return matchSearch && matchSub;
    });
  }, [cakes, searchQuery, selectedSubFilter]);

  // Handle Image Upload to backend
  const handleUploadFile = async (e, targetForm) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('folder', 'theme-cakes');

    try {
      const res = await api.post('/admin/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.url) {
        const url = res.data.data.url;
        if (targetForm === 'cake') {
          setCakeForm((prev) => ({ ...prev, image_url: url }));
        } else {
          setSubForm((prev) => ({ ...prev, image_url: url }));
        }
        showToast('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('Image upload failed. Please verify file size or paste a URL.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open Cake Modal for Create
  const handleOpenAddCake = () => {
    setEditingCake(null);
    setCakeForm({
      name: '',
      sku: `THM-${Date.now().toString().slice(-4)}`,
      subcategory_id: subcategories[0]?.id || '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700&q=85',
      weight: '5kg',
      theme_cake_default_weight: 5,
      theme_cake_default_price: 2000,
      theme_cake_step_size: 1,
      theme_cake_price_tiers: [],
      is_active: true,
      flavours: [
        { name: 'Dutch Chocolate Truffle', egg_price: 500, eggless_price: 550 },
        { name: 'Fresh Vanilla Buttercream', egg_price: 450, eggless_price: 500 },
      ],
    });
    setCakeModalOpen(true);
  };

  // Open Cake Modal for Edit
  const handleOpenEditCake = (cake) => {
    setEditingCake(cake);
    const flavoursList = Array.isArray(cake.flavours) && cake.flavours.length > 0
      ? cake.flavours
      : [
          { name: 'Dutch Chocolate Truffle', egg_price: Number(cake.egg_price || cake.base_price || 500), eggless_price: Number(cake.eggless_price || 550) },
        ];

    const defWeight = cake.theme_cake_default_weight !== undefined && cake.theme_cake_default_weight !== null
      ? Number(cake.theme_cake_default_weight)
      : 5;
    const defPrice = cake.theme_cake_default_price !== undefined && cake.theme_cake_default_price !== null
      ? Number(cake.theme_cake_default_price)
      : (Number(cake.base_price) || 2000);
    const stepSize = cake.theme_cake_step_size !== undefined && cake.theme_cake_step_size !== null
      ? Number(cake.theme_cake_step_size)
      : 1;
    const tiers = Array.isArray(cake.theme_cake_price_tiers) ? cake.theme_cake_price_tiers : [];

    setCakeForm({
      name: cake.name || '',
      sku: cake.sku || '',
      subcategory_id: cake.subcategory_id || '',
      description: cake.description || '',
      image_url: cake.image_url || '',
      weight: cake.weight || `${defWeight}kg`,
      theme_cake_default_weight: defWeight,
      theme_cake_default_price: defPrice,
      theme_cake_step_size: stepSize,
      theme_cake_price_tiers: tiers,
      is_active: Boolean(cake.is_active),
      flavours: flavoursList,
    });
    setCakeModalOpen(true);
  };

  // Theme Cake Custom Tier Row Management
  const handleAddTierRow = () => {
    const lastWeight = cakeForm.theme_cake_price_tiers?.length > 0
      ? Number(cakeForm.theme_cake_price_tiers[cakeForm.theme_cake_price_tiers.length - 1].weight)
      : Number(cakeForm.theme_cake_default_weight || 5);
    const step = Number(cakeForm.theme_cake_step_size || 1);
    const newWeight = Math.round((lastWeight + step) * 10) / 10;
    const defW = Number(cakeForm.theme_cake_default_weight || 5);
    const defP = Number(cakeForm.theme_cake_default_price || 2000);
    const calculatedPrice = defW > 0 ? Math.round((defP / defW) * newWeight) : defP;

    setCakeForm((prev) => ({
      ...prev,
      theme_cake_price_tiers: [
        ...(prev.theme_cake_price_tiers || []),
        { weight: newWeight, price: calculatedPrice },
      ],
    }));
  };

  const handleUpdateTierRow = (index, field, value) => {
    setCakeForm((prev) => {
      const nextTiers = [...(prev.theme_cake_price_tiers || [])];
      nextTiers[index] = {
        ...nextTiers[index],
        [field]: Number(value),
      };
      return { ...prev, theme_cake_price_tiers: nextTiers };
    });
  };

  const handleRemoveTierRow = (index) => {
    setCakeForm((prev) => ({
      ...prev,
      theme_cake_price_tiers: (prev.theme_cake_price_tiers || []).filter((_, i) => i !== index),
    }));
  };

  // Flavour row management inside cake form
  const handleAddFlavourRow = () => {
    setCakeForm((prev) => ({
      ...prev,
      flavours: [
        ...prev.flavours,
        { name: '', egg_price: 500, eggless_price: 550 },
      ],
    }));
  };

  const handleUpdateFlavourRow = (index, field, value) => {
    setCakeForm((prev) => {
      const nextFlavours = [...prev.flavours];
      nextFlavours[index] = {
        ...nextFlavours[index],
        [field]: field.includes('price') ? Number(value) : value,
      };
      return { ...prev, flavours: nextFlavours };
    });
  };

  const handleRemoveFlavourRow = (index) => {
    setCakeForm((prev) => ({
      ...prev,
      flavours: prev.flavours.filter((_, i) => i !== index),
    }));
  };

  const handleApplyPresets = () => {
    setCakeForm((prev) => ({
      ...prev,
      flavours: [...STANDARD_FLAVOUR_PRESETS],
    }));
    showToast('Loaded 5 standard flavour options with pricing.', 'info');
  };

  // Save Cake (Create or Update)
  const handleSaveCake = async (e) => {
    e.preventDefault();
    if (!cakeForm.name.trim()) {
      showToast('Please enter cake name.', 'error');
      return;
    }
    if (!cakeForm.subcategory_id) {
      showToast('Please select a theme subcategory.', 'error');
      return;
    }
    if (cakeForm.flavours.length === 0) {
      showToast('Please add at least one flavour with pricing.', 'warning');
      return;
    }

    const defWeight = Number(cakeForm.theme_cake_default_weight) || 5;
    const defPrice = Number(cakeForm.theme_cake_default_price) || 2000;
    const stepSize = Number(cakeForm.theme_cake_step_size) || 1;

    if (defWeight <= 0) {
      showToast('Theme Cake base weight must be greater than 0 kg.', 'error');
      return;
    }
    if (defPrice <= 0) {
      showToast('Theme Cake base price must be greater than ₹0.', 'error');
      return;
    }

    // Clean tiers and ensure valid weights
    const cleanTiers = (cakeForm.theme_cake_price_tiers || [])
      .filter((t) => Number(t.weight) > 0 && Number(t.price) > 0)
      .map((t) => ({ weight: Number(t.weight), price: Number(t.price) }));

    const payload = {
      name: cakeForm.name,
      sku: cakeForm.sku || `THM-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: themeCategory?.id,
      subcategory_id: cakeForm.subcategory_id,
      description: cakeForm.description,
      image_url: cakeForm.image_url,
      weight: `${defWeight}kg`,
      base_price: defPrice,
      theme_cake_default_weight: defWeight,
      theme_cake_default_price: defPrice,
      theme_cake_step_size: stepSize,
      theme_cake_price_tiers: cleanTiers,
      egg_price: defPrice,
      eggless_price: defPrice + 50,
      is_active: cakeForm.is_active,
      is_eggless: false,
      flavours: cakeForm.flavours,
    };

    setSaving(true);
    try {
      if (editingCake) {
        await api.put(`/admin/products/${editingCake.id}`, payload);
        showToast(`Theme cake "${cakeForm.name}" updated!`, 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast(`Theme cake "${cakeForm.name}" created!`, 'success');
      }
      setCakeModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving cake:', err);
      showToast(err.response?.data?.message || 'Error saving cake. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Cake
  const handleDeleteCake = async (cake) => {
    if (!window.confirm(`Are you sure you want to delete "${cake.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/products/${cake.id}`);
      showToast(`Deleted "${cake.name}"`, 'info');
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Could not delete cake.', 'error');
    }
  };

  // Subcategory management
  const handleOpenAddSub = () => {
    setEditingSub(null);
    setSubForm({
      name: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&q=80',
      is_active: true,
    });
    setSubModalOpen(true);
  };

  const handleOpenEditSub = (sub) => {
    setEditingSub(sub);
    setSubForm({
      name: sub.name || '',
      description: sub.description || '',
      image_url: sub.image_url || '',
      is_active: Boolean(sub.is_active !== undefined ? sub.is_active : true),
    });
    setSubModalOpen(true);
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim()) {
      showToast('Please enter subcategory name.', 'error');
      return;
    }
    if (!themeCategory?.id) {
      showToast('Theme Cake parent category missing.', 'error');
      return;
    }

    const payload = {
      category_id: themeCategory.id,
      name: subForm.name,
      description: subForm.description,
      image_url: subForm.image_url,
      is_active: subForm.is_active,
    };

    setSaving(true);
    try {
      if (editingSub) {
        await api.put(`/admin/subcategories/${editingSub.id}`, payload);
        showToast(`Theme subcategory "${subForm.name}" updated!`, 'success');
      } else {
        await api.post('/admin/subcategories', payload);
        showToast(`Theme subcategory "${subForm.name}" created!`, 'success');
      }
      setSubModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving subcategory:', err);
      showToast(err.response?.data?.message || 'Failed to save subcategory.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSub = async (sub) => {
    const cakesUnder = cakes.filter((c) => String(c.subcategory_id) === String(sub.id));
    if (cakesUnder.length > 0) {
      if (!window.confirm(`This subcategory currently has ${cakesUnder.length} cakes linked to it. Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Delete subcategory "${sub.name}"?`)) return;
    }

    try {
      await api.delete(`/admin/subcategories/${sub.id}`);
      showToast(`Subcategory "${sub.name}" deleted`, 'info');
      fetchData();
    } catch (err) {
      console.error('Delete subcategory failed:', err);
      showToast('Could not delete subcategory.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-chocolate to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Designer Cake Studio</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-amber-100">
              Theme Cakes Management
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
              Curate signature theme cakes, organize themes (Birthday, Cartoon, Superhero, Wedding), and configure flavor-based variable pricing per cake.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddSub}
              className="inline-flex items-center gap-2 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-600/40 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>+ New Theme</span>
            </button>
            <button
              onClick={handleOpenAddCake}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-chocolate" />
              <span>+ Add Theme Cake</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-chocolate">{subcategories.length}</div>
            <div className="text-xs text-slate-500 font-medium">Themes / Subcategories</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 font-bold">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-chocolate">{cakes.length}</div>
            <div className="text-xs text-slate-500 font-medium">Theme Cake Listings</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">
              {cakes.filter((c) => c.flavours && c.flavours.length > 0).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Flavor Matrices Configured</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-700">
              {cakes.filter((c) => c.is_active).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Active & Live on Store</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cakes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cakes'
                ? 'bg-chocolate text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Cake className="w-4 h-4" />
            <span>Theme Cakes ({cakes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subcategories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'subcategories'
                ? 'bg-chocolate text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Themes / Subcategories ({subcategories.length})</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-chocolate px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition-all self-end sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* TAB 1: THEME CAKES LISTING */}
      {activeTab === 'cakes' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-amber-100 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search theme cake by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedSubFilter}
                onChange={(e) => setSelectedSubFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white font-medium text-slate-700 w-full sm:w-auto"
              >
                <option value="all">All Subcategories ({cakes.length})</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cakes Table */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-amber-100">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading Theme Cakes catalog...</p>
            </div>
          ) : filteredCakes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 space-y-3">
              <div className="text-4xl">🎂</div>
              <h3 className="font-serif text-lg font-bold text-chocolate">No Theme Cakes Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedSubFilter !== 'all'
                  ? 'No cakes match your active search or subcategory filter.'
                  : 'Get started by creating your first theme cake listing!'}
              </p>
              <button
                onClick={handleOpenAddCake}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Theme Cake</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-50/70 border-b border-amber-100 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Cake Details</th>
                      <th className="py-3.5 px-4">Subcategory</th>
                      <th className="py-3.5 px-4">Flavours & Variable Prices</th>
                      <th className="py-3.5 px-4">Starting Price</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCakes.map((cake) => {
                      const cakeFlavours = Array.isArray(cake.flavours) ? cake.flavours : [];
                      const subName =
                        subcategories.find((s) => String(s.id) === String(cake.subcategory_id))?.name ||
                        'Unassigned';

                      return (
                        <tr key={cake.id} className="hover:bg-amber-50/30 transition-colors">
                          {/* Image & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <img
                                  src={formatImageUrl(cake.image_url, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100')}
                                  alt={cake.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-chocolate text-sm leading-snug">
                                  {cake.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  SKU: {cake.sku || 'N/A'} • {cake.weight || '1kg'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Subcategory */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 bg-amber-100/70 text-amber-900 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                              {subName}
                            </span>
                          </td>

                          {/* Flavours Matrix */}
                          <td className="py-3.5 px-4">
                            {cakeFlavours.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                  <span>{cakeFlavours.length} Flavors Configured:</span>
                                </div>
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {cakeFlavours.map((flv, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 px-2 py-0.5 rounded-md text-[10px] transition-colors"
                                      title={`${flv.name} — Egg: ₹${flv.egg_price} | Eggless: ₹${flv.eggless_price}`}
                                    >
                                      <strong>{flv.name}</strong> (₹{flv.egg_price}/₹{flv.eggless_price})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-amber-600 text-[11px] italic font-medium">
                                No flavours configured
                              </span>
                            )}
                          </td>

                          {/* Starting Price */}
                          <td className="py-3.5 px-4 font-bold text-sm text-chocolate">
                            ₹{Number(cake.base_price || cake.discount_price || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                cake.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  cake.is_active ? 'bg-emerald-600' : 'bg-slate-400'
                                }`}
                              />
                              <span>{cake.is_active ? 'Active' : 'Disabled'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCake(cake)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Edit Theme Cake & Flavours"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCake(cake)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Cake"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBCATEGORIES / THEMES LISTING */}
      {activeTab === 'subcategories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-chocolate">
                Themes & Subcategories ({subcategories.length})
              </h2>
              <p className="text-xs text-slate-500">
                These subcategories appear as interactive filter cards on the dedicated customer-facing Theme Cakes page.
              </p>
            </div>
            <button
              onClick={handleOpenAddSub}
              className="inline-flex items-center gap-1.5 bg-chocolate hover:bg-amber-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subcategory</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategories.map((sub) => {
              const count = cakes.filter((c) => String(c.subcategory_id) === String(sub.id)).length;
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-amber-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={formatImageUrl(sub.image_url, 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&q=80')}
                      alt={sub.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSub(sub)}
                        className="p-1.5 bg-white/90 backdrop-blur-xs rounded-lg text-slate-700 hover:text-amber-700 hover:bg-white shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSub(sub)}
                        className="p-1.5 bg-white/90 backdrop-blur-xs rounded-lg text-slate-700 hover:text-rose-600 hover:bg-white shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-sm text-chocolate">{sub.name}</h3>
                        <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                          {count} {count === 1 ? 'Cake' : 'Cakes'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {sub.description || 'Exclusive themed cakes designed for celebrations.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Slug: {sub.slug}</span>
                      <button
                        onClick={() => {
                          setSelectedSubFilter(sub.id);
                          setActiveTab('cakes');
                        }}
                        className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                      >
                        <span>View Cakes</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT THEME CAKE WITH FLAVOR-BASED PRICING MATRIX */}
      {/* ============================================================ */}
      {cakeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-100 my-8">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif font-bold text-lg text-chocolate">
                  {editingCake ? `Edit Theme Cake: ${editingCake.name}` : 'Add New Theme Cake'}
                </h2>
              </div>
              <button
                onClick={() => setCakeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCake} className="p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cake Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spiderman 3D Web Cake"
                    value={cakeForm.name}
                    onChange={(e) => setCakeForm({ ...cakeForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Theme Subcategory *</label>
                  <select
                    required
                    value={cakeForm.subcategory_id}
                    onChange={(e) => setCakeForm({ ...cakeForm, subcategory_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. THM-SPH-01"
                    value={cakeForm.sku}
                    onChange={(e) => setCakeForm({ ...cakeForm, sku: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 uppercase font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Display Weight Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. 5kg Base / Custom 3D Artisan Spec"
                    value={cakeForm.weight}
                    onChange={(e) => setCakeForm({ ...cakeForm, weight: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* ======================================================= */}
              {/* THEME CAKE DYNAMIC BASE WEIGHT & PRICING RULES */}
              {/* ======================================================= */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/30 rounded-2xl border-2 border-amber-300 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <h3 className="font-serif font-bold text-sm sm:text-base text-chocolate flex items-center gap-2">
                        <span>Theme Cake Starting Weight & Dynamic Pricing</span>
                        <span className="text-[10px] font-bold bg-amber-500 text-chocolate px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Theme Rule
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        The customer weight selector starts strictly at this base weight and increments upward.
                      </p>
                    </div>
                  </div>

                  {Number(cakeForm.theme_cake_default_weight) > 0 && Number(cakeForm.theme_cake_default_price) > 0 && (
                    <div className="text-xs font-bold text-amber-900 bg-white/90 border border-amber-300 px-3 py-1.5 rounded-xl shadow-2xs shrink-0 self-start sm:self-auto">
                      Rate: <span className="text-chocolate">₹{Math.round(Number(cakeForm.theme_cake_default_price) / Number(cakeForm.theme_cake_default_weight))}/kg</span>
                    </div>
                  )}
                </div>

                {/* 3 Config Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-chocolate block">
                      Base Starting Weight (kg) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        required
                        value={cakeForm.theme_cake_default_weight}
                        onChange={(e) => setCakeForm({ ...cakeForm, theme_cake_default_weight: e.target.value })}
                        className="w-full font-bold text-sm text-chocolate p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Lowest selectable weight (e.g. 5kg)</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-chocolate block">
                      Base Price for Default Weight (₹) *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={cakeForm.theme_cake_default_price}
                        onChange={(e) => setCakeForm({ ...cakeForm, theme_cake_default_price: e.target.value })}
                        className="w-full font-bold text-sm text-chocolate p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">Price for starting weight (e.g. ₹2000)</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-chocolate block">
                      Weight Step Increment (kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={cakeForm.theme_cake_step_size}
                        onChange={(e) => setCakeForm({ ...cakeForm, theme_cake_step_size: e.target.value })}
                        className="w-full font-bold text-sm text-chocolate p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Increment step (default 1kg: 5 $\rightarrow$ 6 $\rightarrow$ 7...)</span>
                  </div>
                </div>

                {/* Optional Custom Price Tiers Overrides */}
                <div className="space-y-2 pt-2 border-t border-amber-200/80">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-xs font-bold text-chocolate flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-amber-700" />
                        <span>Custom Price Tier Overrides (Optional)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Override the linear proportional price for specific weights (e.g. discounts for larger orders).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTierRow}
                      className="text-[11px] font-bold text-chocolate bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Tier Override</span>
                    </button>
                  </div>

                  {cakeForm.theme_cake_price_tiers?.length > 0 ? (
                    <div className="space-y-1.5">
                      {cakeForm.theme_cake_price_tiers.map((tier, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-100 shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="text-xs text-slate-500 font-medium">Weight:</span>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={tier.weight}
                              onChange={(e) => handleUpdateTierRow(tIdx, 'weight', e.target.value)}
                              className="w-24 text-xs font-bold p-1 rounded-lg border border-slate-200 text-center"
                            />
                            <span className="text-xs font-bold text-slate-600">kg</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="text-xs text-slate-500 font-medium">Override Price:</span>
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min="1"
                              step="10"
                              value={tier.price}
                              onChange={(e) => handleUpdateTierRow(tIdx, 'price', e.target.value)}
                              className="w-28 text-xs font-bold p-1 rounded-lg border border-slate-200 text-center text-chocolate"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTierRow(tIdx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic bg-white/60 p-2.5 rounded-xl border border-dashed border-amber-200">
                      No custom overrides added. All weight options will automatically calculate proportionally: <span className="font-mono text-chocolate font-bold">(Base Price / Base Weight) × Selected Weight</span>.
                    </div>
                  )}
                </div>

                {/* Live Customer Price Preview Card */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Customer Experience Preview (What the customer will see):
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {(() => {
                      const defW = Number(cakeForm.theme_cake_default_weight) || 5;
                      const defP = Number(cakeForm.theme_cake_default_price) || 2000;
                      const step = Number(cakeForm.theme_cake_step_size) || 1;
                      const rate = defW > 0 ? defP / defW : 0;
                      const previewWeights = [defW, defW + step, defW + step * 2, defW + step * 3, defW + step * 4];

                      return previewWeights.map((w, idx) => {
                        const customTier = (cakeForm.theme_cake_price_tiers || []).find(
                          (t) => Math.abs(Number(t.weight) - w) < 0.01
                        );
                        const price = customTier ? Number(customTier.price) : Math.round(rate * w);
                        const isBase = idx === 0;

                        return (
                          <div
                            key={w}
                            className={`px-3 py-2 rounded-xl border text-center shrink-0 min-w-[95px] ${
                              isBase
                                ? 'bg-amber-500 text-chocolate border-amber-600 font-bold shadow-xs'
                                : customTier
                                ? 'bg-orange-50 border-orange-300 text-chocolate'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="text-xs font-black">{w}kg</div>
                            <div className="text-xs font-bold mt-0.5">₹{price.toLocaleString('en-IN')}</div>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full inline-block mt-0.5 font-semibold ${
                              isBase ? 'bg-chocolate/20 text-chocolate' : customTier ? 'bg-orange-200 text-orange-900' : 'text-slate-400'
                            }`}>
                              {isBase ? 'Base' : customTier ? 'Override' : 'Proportional'}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Cake Cover Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Image URL or upload file..."
                    value={cakeForm.image_url}
                    onChange={(e) => setCakeForm({ ...cakeForm, image_url: e.target.value })}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, 'cake')}
                    />
                  </label>
                </div>
                {cakeForm.image_url && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-amber-200 mt-2 bg-slate-50">
                    <img src={formatImageUrl(cakeForm.image_url)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about craftsmanship, design elements, celebration fit..."
                  value={cakeForm.description}
                  onChange={(e) => setCakeForm({ ...cakeForm, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* ======================================================= */}
              {/* FLAVOR-BASED VARIABLE PRICING MATRIX */}
              {/* ======================================================= */}
              <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl border-2 border-amber-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-700" />
                      <h3 className="font-serif font-bold text-sm text-chocolate">
                        Flavor-Based Variable Pricing Matrix
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Configure each flavor's independent With Egg and 100% Eggless prices.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyPresets}
                      className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      + Standard Presets
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFlavourRow}
                      className="text-[11px] font-bold text-white bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Flavor</span>
                    </button>
                  </div>
                </div>

                {/* Table of Flavours */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-1">
                    <div className="col-span-5 sm:col-span-6">Flavor Name</div>
                    <div className="col-span-3 sm:col-span-2 text-center">With Egg (₹)</div>
                    <div className="col-span-3 sm:col-span-3 text-center">100% Eggless (₹)</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  {cakeForm.flavours.map((flv, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-amber-100 shadow-2xs"
                    >
                      <div className="col-span-5 sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dutch Chocolate"
                          value={flv.name}
                          onChange={(e) => handleUpdateFlavourRow(idx, 'name', e.target.value)}
                          className="w-full text-xs p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={flv.egg_price}
                            onChange={(e) => handleUpdateFlavourRow(idx, 'egg_price', e.target.value)}
                            className="w-full text-xs py-1.5 pl-5 pr-1 text-center rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 font-bold text-chocolate"
                          />
                        </div>
                      </div>

                      <div className="col-span-3 sm:col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={flv.eggless_price}
                            onChange={(e) => handleUpdateFlavourRow(idx, 'eggless_price', e.target.value)}
                            className="w-full text-xs py-1.5 pl-5 pr-1 text-center rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 font-bold text-emerald-800"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFlavourRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove Flavor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {cakeForm.flavours.length === 0 && (
                    <div className="p-4 bg-white/70 rounded-xl text-center text-xs text-slate-500 italic border border-dashed border-amber-200">
                      No flavors added yet. Click "+ Add Flavor" or "+ Standard Presets" to configure.
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="cake_is_active"
                  checked={cakeForm.is_active}
                  onChange={(e) => setCakeForm({ ...cakeForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="cake_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Cake is Active & Visible on Website
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCakeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingCake ? 'Update Cake' : 'Create Cake'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT THEME SUBCATEGORY */}
      {/* ============================================================ */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif font-bold text-lg text-chocolate">
                  {editingSub ? `Edit Theme: ${editingSub.name}` : 'New Theme Subcategory'}
                </h2>
              </div>
              <button
                onClick={() => setSubModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Theme Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Superhero Theme"
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Cover Image URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cover image URL..."
                    value={subForm.image_url}
                    onChange={(e) => setSubForm({ ...subForm, image_url: e.target.value })}
                    className="flex-1 text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <label className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, 'sub')}
                    />
                  </label>
                </div>
                {subForm.image_url && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-amber-200 bg-slate-50">
                    <img src={formatImageUrl(subForm.image_url)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Short tagline displayed on the customer card..."
                  value={subForm.description}
                  onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingSub ? 'Update Theme' : 'Create Theme'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThemeCakePage;
