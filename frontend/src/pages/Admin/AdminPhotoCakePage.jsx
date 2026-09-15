import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  Edit2,
  Check,
  Upload,
  Link2,
  Save,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Layers,
  Cake,
  Scale
} from 'lucide-react';

const parseWeightKg = (wStr) => {
  if (!wStr) return 0;
  const s = String(wStr).toLowerCase().trim();
  if (s.includes('g') && !s.includes('kg')) {
    const val = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(val) ? 0 : val / 1000;
  }
  const val = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(val) ? 0 : val;
};

const sortWeightsAscending = (weights) => {
  const sorted = [...(weights || [])].sort((a, b) => parseWeightKg(a.weight) - parseWeightKg(b.weight));
  sorted.forEach((w, idx) => {
    w.is_min = idx === 0;
  });
  return sorted;
};

const AdminPhotoCakePage = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('shapes'); // 'shapes' | 'dietary' | 'flavours'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  // Configuration state
  const [shapes, setShapes] = useState([]);
  const [dietary, setDietary] = useState({
    allow_eggless: true,
    allow_egg: true,
    default_dietary: 'eggless',
    eggless_label: '100% Pure Eggless',
    egg_label: 'With Egg (Classic Bakery)',
    eggless_surcharge: 0,
  });
  const [flavours, setFlavours] = useState([]);

  // Modal / new flavour state
  const [newFlavourModal, setNewFlavourModal] = useState(false);
  const [newFlavourForm, setNewFlavourForm] = useState({
    name: '',
    description: '',
    min_order_weight: '0.5kg (500g)',
    is_eggless_available: true,
    is_egg_available: true,
    is_active: true,
    weights: [
      { weight: '0.5kg', price: 649, is_min: true },
      { weight: '1.0kg', price: 1149, is_min: false },
      { weight: '1.5kg', price: 1599, is_min: false },
      { weight: '2.0kg', price: 2099, is_min: false },
      { weight: '3.0kg', price: 2999, is_min: false },
    ],
  });

  // New weight tier temporary state
  const [newWeightInput, setNewWeightInput] = useState({ weight: '0.5kg', price: '' });

  // File input refs for uploading device image to specific shape
  const fileInputRefs = useRef([]);

  // Fetch management configuration
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/photo-cake/management');
      if (res.data?.data) {
        setShapes(res.data.data.shapes || []);
        setDietary(res.data.data.dietary || {});

        const rawFlavours = res.data.data.flavours || [];
        const sortedFlavours = rawFlavours.map((f) => {
          const sw = sortWeightsAscending(f.weights || []);
          return {
            ...f,
            min_order_weight: f.min_order_weight || (sw[0]?.weight ? `${sw[0].weight}` : '0.5kg (500g)'),
            weights: sw,
          };
        });
        setFlavours(sortedFlavours);
      }
    } catch (err) {
      showToast('Failed to load Photo Cake configuration. Using defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save all configurations
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Ensure all flavour weights are strictly sorted in ascending order before saving
      const cleanedFlavours = flavours.map((f) => {
        const sw = sortWeightsAscending(f.weights || []);
        return {
          ...f,
          min_order_weight: f.min_order_weight || (sw[0]?.weight ? `${sw[0].weight}` : '0.5kg (500g)'),
          weights: sw,
        };
      });

      await api.post('/admin/photo-cake/management', {
        shapes,
        dietary,
        flavours: cleanedFlavours,
      });
      setFlavours(cleanedFlavours);
      showToast('Photo Cake Studio configuration successfully saved! ✨', 'success');
    } catch (err) {
      showToast('Failed to save configuration. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Upload shape image from local device storage
  const handleDeviceUpload = async (shapeIndex, file) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be less than 15MB.', 'error');
      return;
    }

    setUploadingIndex(shapeIndex);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/admin/photo-cake/shape-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data?.url) {
        const updatedShapes = [...shapes];
        updatedShapes[shapeIndex].image = res.data.data.url;
        setShapes(updatedShapes);
        showToast('Image uploaded from device and applied! Click "Save Changes" to publish.', 'success');
      }
    } catch (err) {
      showToast('Failed to upload image from device.', 'error');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Shapes management helpers
  const handleShapeChange = (index, field, value) => {
    const updated = [...shapes];
    updated[index][field] = value;
    setShapes(updated);
  };

  const handleAddShape = () => {
    const newShape = {
      id: `shape-${Date.now()}`,
      name: 'Custom Shaped Cake',
      shape: 'Custom Shape',
      tag: 'Special Edition',
      icon: '✨',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
      description: 'Exclusive custom crafted cake design',
      is_active: true,
    };
    setShapes([...shapes, newShape]);
    showToast('New shape card added! Configure its details and click Save.', 'info');
  };

  const handleDeleteShape = (index) => {
    if (shapes.length <= 1) {
      showToast('At least one cake shape must remain active.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${shapes[index].name}"?`)) {
      const updated = shapes.filter((_, i) => i !== index);
      setShapes(updated);
      showToast('Shape removed.', 'info');
    }
  };

  // Flavour field update helper
  const handleFlavourFieldChange = (flavourIndex, field, value) => {
    const updated = [...flavours];
    updated[flavourIndex][field] = value;
    setFlavours(updated);
  };

  // Flavour management helpers
  const handleDeleteFlavour = (flavourIndex) => {
    if (flavours.length <= 1) {
      showToast('At least one flavour must be maintained.', 'error');
      return;
    }
    if (window.confirm(`Delete flavour "${flavours[flavourIndex].name}"?`)) {
      const updated = flavours.filter((_, i) => i !== flavourIndex);
      setFlavours(updated);
      showToast('Flavour removed.', 'info');
    }
  };

  const handleAddWeightToFlavour = (flavourIndex) => {
    if (!newWeightInput.weight.trim() || !newWeightInput.price) {
      showToast('Please enter both weight and price.', 'error');
      return;
    }

    const priceNum = parseFloat(newWeightInput.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Please enter a valid positive price.', 'error');
      return;
    }

    const updated = [...flavours];
    const existingWeights = updated[flavourIndex].weights || [];

    // Check duplicate
    if (existingWeights.some((w) => w.weight.toLowerCase() === newWeightInput.weight.toLowerCase())) {
      showToast(`Weight "${newWeightInput.weight}" already exists for this flavour.`, 'error');
      return;
    }

    const mergedWeights = sortWeightsAscending([
      ...existingWeights,
      { weight: newWeightInput.weight.trim(), price: priceNum },
    ]);

    updated[flavourIndex].weights = mergedWeights;
    if (!updated[flavourIndex].min_order_weight) {
      updated[flavourIndex].min_order_weight = mergedWeights[0].weight;
    }

    setFlavours(updated);
    setNewWeightInput({ weight: '0.5kg', price: '' });
    showToast(`Added weight tier to ${flavours[flavourIndex].name} (Sorted Min to Max)!`, 'success');
  };

  const handleDeleteWeightFromFlavour = (flavourIndex, weightIndex) => {
    const updated = [...flavours];
    if (updated[flavourIndex].weights.length <= 1) {
      showToast('Each flavour must have at least one weight and price.', 'error');
      return;
    }
    const filtered = updated[flavourIndex].weights.filter((_, idx) => idx !== weightIndex);
    updated[flavourIndex].weights = sortWeightsAscending(filtered);
    setFlavours(updated);
  };

  const handleUpdateWeightPrice = (flavourIndex, weightIndex, newPrice) => {
    const priceNum = parseFloat(newPrice) || 0;
    const updated = [...flavours];
    updated[flavourIndex].weights[weightIndex].price = priceNum;
    setFlavours(updated);
  };

  const handleCreateFlavour = (e) => {
    e.preventDefault();
    if (!newFlavourForm.name.trim()) {
      showToast('Please enter a flavour name.', 'error');
      return;
    }

    const sortedWeights = sortWeightsAscending(newFlavourForm.weights);

    const newEntry = {
      id: newFlavourForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: newFlavourForm.name.trim(),
      description: newFlavourForm.description.trim() || 'Delicious freshly baked artisan sponge and cream.',
      min_order_weight: newFlavourForm.min_order_weight || (sortedWeights[0]?.weight ? `${sortedWeights[0].weight}` : '0.5kg (500g)'),
      is_eggless_available: newFlavourForm.is_eggless_available,
      is_egg_available: newFlavourForm.is_egg_available,
      is_active: newFlavourForm.is_active,
      weights: sortedWeights,
    };

    setFlavours([...flavours, newEntry]);
    setNewFlavourModal(false);
    setNewFlavourForm({
      name: '',
      description: '',
      min_order_weight: '0.5kg (500g)',
      is_eggless_available: true,
      is_egg_available: true,
      is_active: true,
      weights: [
        { weight: '0.5kg', price: 649, is_min: true },
        { weight: '1.0kg', price: 1149, is_min: false },
        { weight: '1.5kg', price: 1599, is_min: false },
        { weight: '2.0kg', price: 2099, is_min: false },
        { weight: '3.0kg', price: 2999, is_min: false },
      ],
    });
    showToast('New flavour created! Click "Save Changes" to publish.', 'success');
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="animate-spin text-3xl">🍰</div>
        <div className="text-sm font-bold text-chocolate">Loading Photo Cake Studio configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin Studio Management</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Photo Cake Studio Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configure shapes with device or web link photos, dietary eggs/eggless options, and customize flavours with their individual minimum order badges, weights, and prices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConfig}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Reload from server"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('shapes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'shapes'
              ? 'bg-chocolate text-cream shadow-xs'
              : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cake Shapes ({shapes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dietary')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'dietary'
              ? 'bg-chocolate text-cream shadow-xs'
              : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>Eggs & Eggless Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flavours')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'flavours'
              ? 'bg-chocolate text-cream shadow-xs'
              : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Delicious Flavours & Weights ({flavours.length})</span>
        </button>
      </div>

      {/* TAB 1: CAKE SHAPES */}
      {activeTab === 'shapes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-chocolate">Shape Cards & Photos</h2>
              <p className="text-xs text-slate-500">
                Admins can update each shape photo via a Web Link (URL) OR directly upload an image from Device Storage.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddShape}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Shape</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shapes.map((shape, idx) => (
              <div
                key={shape.id || idx}
                className="bg-white rounded-3xl p-5 border border-amber-100/90 shadow-xs flex flex-col justify-between space-y-4 relative group"
              >
                {/* Delete Shape Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteShape(idx)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                  title="Remove Shape"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Top: Image Preview & Shape Badge */}
                <div className="space-y-3">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-cream border border-slate-100 shadow-2xs">
                    <img
                      src={shape.image}
                      alt={shape.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500';
                      }}
                    />
                    <span className="absolute top-2 left-2 text-base bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-xs font-bold">
                      {shape.icon || '🎂'}
                    </span>
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      {shape.shape || 'Cake Shape'}
                    </span>
                  </div>

                  {/* Dual Photo Controls: Web Link OR Device Upload */}
                  <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                      <span>Update Shape Photo</span>
                      {uploadingIndex === idx && (
                        <span className="text-[10px] text-amber-700 animate-pulse font-medium">Uploading...</span>
                      )}
                    </div>

                    {/* Method 1: Upload from Device Storage */}
                    <div>
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[idx] = el)}
                        onChange={(e) => handleDeviceUpload(idx, e.target.files?.[0])}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        disabled={uploadingIndex === idx}
                        className="w-full py-2 px-3 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-xl text-xs font-bold text-chocolate flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>Upload from Device Storage</span>
                      </button>
                    </div>

                    {/* Method 2: Web URL Link */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        <span>Or Paste Web Image Link:</span>
                      </label>
                      <input
                        type="text"
                        value={shape.image || ''}
                        onChange={(e) => handleShapeChange(idx, 'image', e.target.value)}
                        placeholder="https://... or /images/..."
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono text-slate-700 truncate"
                      />
                    </div>
                  </div>

                  {/* Shape Details Fields */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Shape Name:</label>
                      <input
                        type="text"
                        value={shape.name || ''}
                        onChange={(e) => handleShapeChange(idx, 'name', e.target.value)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 text-chocolate focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Tagline / Tag:</label>
                        <input
                          type="text"
                          value={shape.tag || ''}
                          onChange={(e) => handleShapeChange(idx, 'tag', e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Icon / Emoji:</label>
                        <input
                          type="text"
                          value={shape.icon || ''}
                          onChange={(e) => handleShapeChange(idx, 'icon', e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-amber-500 text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Description:</label>
                      <textarea
                        rows={2}
                        value={shape.description || ''}
                        onChange={(e) => handleShapeChange(idx, 'description', e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom: Active status */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Visible on Storefront:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shape.is_active ?? true}
                      onChange={(e) => handleShapeChange(idx, 'is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EGGS & EGGLESS SETTINGS */}
      {activeTab === 'dietary' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-chocolate">Dietary Configuration (Egg & Eggless)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control whether photo cakes can be ordered as Eggless, With Egg, or both, and configure customer labels.
            </p>
          </div>

          <div className="space-y-4">
            {/* Allow Eggless Toggle */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Allow 100% Eggless Preparation</span>
                </div>
                <div className="text-xs text-emerald-800">Customers can select pure vegetarian dairy sponge for custom photo cakes.</div>
              </div>
              <input
                type="checkbox"
                checked={dietary.allow_eggless ?? true}
                onChange={(e) => setDietary({ ...dietary, allow_eggless: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Allow With Egg Toggle */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>🥚</span>
                  <span>Allow With Egg (Classic Sponge)</span>
                </div>
                <div className="text-xs text-amber-800">Customers can select traditional classic bakery sponge made with farm eggs.</div>
              </div>
              <input
                type="checkbox"
                checked={dietary.allow_egg ?? true}
                onChange={(e) => setDietary({ ...dietary, allow_egg: e.target.checked })}
                className="w-5 h-5 accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Default Selection */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Default Selection on Custom Photo Cake Studio:
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-chocolate cursor-pointer">
                  <input
                    type="radio"
                    name="default_dietary"
                    value="eggless"
                    checked={dietary.default_dietary === 'eggless'}
                    onChange={() => setDietary({ ...dietary, default_dietary: 'eggless' })}
                    className="accent-emerald-600"
                  />
                  <span>100% Eggless (Pre-selected)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-chocolate cursor-pointer">
                  <input
                    type="radio"
                    name="default_dietary"
                    value="egg"
                    checked={dietary.default_dietary === 'egg'}
                    onChange={() => setDietary({ ...dietary, default_dietary: 'egg' })}
                    className="accent-amber-600"
                  />
                  <span>With Egg (Classic)</span>
                </label>
              </div>
            </div>

            {/* Custom Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Eggless Display Label:</label>
                <input
                  type="text"
                  value={dietary.eggless_label || ''}
                  onChange={(e) => setDietary({ ...dietary, eggless_label: e.target.value })}
                  placeholder="e.g. 100% Pure Eggless"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium text-chocolate"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">With Egg Display Label:</label>
                <input
                  type="text"
                  value={dietary.egg_label || ''}
                  onChange={(e) => setDietary({ ...dietary, egg_label: e.target.value })}
                  placeholder="e.g. With Egg (Classic Sponge)"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium text-chocolate"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DELICIOUS FLAVOURS & WEIGHTS */}
      {activeTab === 'flavours' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-chocolate">Delicious Flavours & Custom Weight Pricing</h2>
              <p className="text-xs text-slate-500">
                Add, delete, and update photo cake flavours. Weights are automatically sorted ascending from minimum kg to maximum kg.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewFlavourModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Flavour</span>
            </button>
          </div>

          {/* Flavours List */}
          <div className="space-y-5">
            {flavours.map((flavour, fIdx) => (
              <div
                key={flavour.id || fIdx}
                className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4"
              >
                {/* Flavour Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      {fIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-chocolate text-base sm:text-lg">
                        {flavour.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{flavour.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Dietary Badges */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      {flavour.is_eggless_available && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Eggless</span>
                      )}
                      {flavour.is_egg_available && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">With Egg</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFlavour(fIdx)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete this flavour"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Flavour Editable Details: Name, Description & Minimum Order Weight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Flavour Name:
                    </label>
                    <input
                      type="text"
                      value={flavour.name || ''}
                      onChange={(e) => handleFlavourFieldChange(fIdx, 'name', e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 text-chocolate focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Minimum Order Badge / Size:
                    </label>
                    <input
                      type="text"
                      value={flavour.min_order_weight || ''}
                      onChange={(e) => handleFlavourFieldChange(fIdx, 'min_order_weight', e.target.value)}
                      placeholder="e.g. 0.5kg (500g) or 1.0kg"
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 text-emerald-800 focus:outline-none focus:border-amber-500 bg-white"
                    />
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Storefront badge: "Minimum Order: {flavour.min_order_weight || (flavour.weights?.[0]?.weight || '0.5kg (500g)')}"
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Flavour Description:
                    </label>
                    <input
                      type="text"
                      value={flavour.description || ''}
                      onChange={(e) => handleFlavourFieldChange(fIdx, 'description', e.target.value)}
                      placeholder="e.g. Rich Belgian dark chocolate ganache"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>

                {/* Weight & Price Matrix for This Flavour (Sorted Min to Max) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Configured Weights & Pricing for "{flavour.name}" (Sorted Min to Max):
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Minimum Order: {flavour.min_order_weight || (flavour.weights?.[0]?.weight || '0.5kg (500g)')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {sortWeightsAscending(flavour.weights || []).map((wTier, wIdx) => (
                      <div
                        key={wIdx}
                        className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-chocolate">{wTier.weight}</span>
                          {wIdx === 0 && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                              Min Size
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteWeightFromFlavour(fIdx, wIdx)}
                            className="text-slate-400 hover:text-rose-600 text-xs cursor-pointer"
                            title="Remove weight tier"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-semibold block">Price (₹):</label>
                          <input
                            type="number"
                            min={1}
                            value={wTier.price}
                            onChange={(e) => handleUpdateWeightPrice(fIdx, wIdx, e.target.value)}
                            className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-white text-chocolate focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Weight to this Flavour */}
                  <div className="p-3 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Weight Tier:</span>
                    </span>

                    <input
                      type="text"
                      placeholder="e.g. 0.5kg, 1.5kg, 4.0kg"
                      value={newWeightInput.weight}
                      onChange={(e) => setNewWeightInput({ ...newWeightInput, weight: e.target.value })}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white w-28 text-chocolate font-medium"
                    />

                    <input
                      type="number"
                      placeholder="Price ₹"
                      value={newWeightInput.price}
                      onChange={(e) => setNewWeightInput({ ...newWeightInput, price: e.target.value })}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white w-24 text-chocolate font-medium"
                    />

                    <button
                      type="button"
                      onClick={() => handleAddWeightToFlavour(fIdx)}
                      className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Add & Sort Tier
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create New Flavour */}
      {newFlavourModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-xl text-chocolate">Add Delicious Flavour</h3>
              <button
                type="button"
                onClick={() => setNewFlavourModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFlavour} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Flavour Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFlavourForm.name}
                  onChange={(e) => setNewFlavourForm({ ...newFlavourForm, name: e.target.value })}
                  placeholder="e.g. Lotus Biscoff Cream, Pistachio Mousse"
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 text-chocolate focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Minimum Order Badge / Size:
                </label>
                <input
                  type="text"
                  value={newFlavourForm.min_order_weight}
                  onChange={(e) => setNewFlavourForm({ ...newFlavourForm, min_order_weight: e.target.value })}
                  placeholder="e.g. 0.5kg (500g) or 1.0kg"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 text-emerald-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Description:</label>
                <textarea
                  rows={2}
                  value={newFlavourForm.description}
                  onChange={(e) => setNewFlavourForm({ ...newFlavourForm, description: e.target.value })}
                  placeholder="e.g. Belgian speculoos biscuit paste with whipped dairy cream"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Dietary Availability */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Dietary Availability:
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-chocolate cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFlavourForm.is_eggless_available}
                      onChange={(e) =>
                        setNewFlavourForm({ ...newFlavourForm, is_eggless_available: e.target.checked })
                      }
                      className="accent-emerald-600"
                    />
                    <span>Available as 100% Eggless</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-chocolate cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFlavourForm.is_egg_available}
                      onChange={(e) =>
                        setNewFlavourForm({ ...newFlavourForm, is_egg_available: e.target.checked })
                      }
                      className="accent-amber-600"
                    />
                    <span>Available With Egg</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewFlavourModal(false)}
                  className="text-xs font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Create Flavour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPhotoCakePage;
