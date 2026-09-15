import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  Sparkles,
  Camera,
  Check,
  ShoppingBag,
  ShieldCheck,
  Zap,
  X,
  Info
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

const DEFAULT_SHAPES = [
  {
    id: 'heart',
    name: 'Heart Shaped Cake',
    shape: 'Heart Shape',
    tag: 'Romantic & Celebrations',
    icon: '❤️',
    image: '/images/shapes/heart-cake.jpg',
    description: 'Perfect for Anniversaries, Valentine & Romantic Celebrations',
  },
  {
    id: 'round',
    name: 'Round Shaped Cake',
    shape: 'Round Shape',
    tag: 'Classic Bestseller',
    icon: '⭕',
    image: '/images/shapes/round-cake.jpg',
    description: 'Timeless circular bakery cake with delicate whipped piping',
  },
  {
    id: 'square',
    name: 'Square Shaped Cake',
    shape: 'Square Shape',
    tag: 'Modern & Grand',
    icon: '⬛',
    image: '/images/shapes/square-cake.jpg',
    description: 'Contemporary sleek square cut, maximizes edible photo space',
  },
];

const DEFAULT_FLAVOURS = [
  {
    id: 'dutch-chocolate-truffle',
    name: 'Dutch Chocolate Truffle',
    description: 'Rich Belgian dark chocolate ganache with moist cocoa sponge',
    is_eggless_available: true,
    is_egg_available: true,
    min_order_weight: '0.5kg (500g)',
    weights: [
      { weight: '0.5kg', price: 649, is_min: true },
      { weight: '1.0kg', price: 1149, is_min: false },
      { weight: '1.5kg', price: 1599, is_min: false },
      { weight: '2.0kg', price: 2099, is_min: false },
      { weight: '3.0kg', price: 2999, is_min: false },
    ],
  },
  {
    id: 'black-forest',
    name: 'Black Forest with Red Cherries',
    description: 'German chocolate sponge soaked in cherry syrup with sweet cherries',
    is_eggless_available: true,
    is_egg_available: true,
    min_order_weight: '0.5kg (500g)',
    weights: [
      { weight: '0.5kg', price: 599, is_min: true },
      { weight: '1.0kg', price: 1099, is_min: false },
      { weight: '1.5kg', price: 1499, is_min: false },
      { weight: '2.0kg', price: 1999, is_min: false },
      { weight: '3.0kg', price: 2799, is_min: false },
    ],
  },
  {
    id: 'fresh-fruit-cream',
    name: 'Seasonal Fresh Fruit Cream',
    description: 'Fresh dairy cream infused with tropical kiwi, pineapple, and strawberries',
    is_eggless_available: true,
    is_egg_available: true,
    min_order_weight: '0.5kg (500g)',
    weights: [
      { weight: '0.5kg', price: 649, is_min: true },
      { weight: '1.0kg', price: 1149, is_min: false },
      { weight: '1.5kg', price: 1599, is_min: false },
      { weight: '2.0kg', price: 2099, is_min: false },
      { weight: '3.0kg', price: 2999, is_min: false },
    ],
  },
  {
    id: 'royal-red-velvet',
    name: 'Royal Red Velvet & Cream Cheese',
    description: 'Crimson velvet crumb layered with Philadelphia cream cheese frosting',
    is_eggless_available: true,
    is_egg_available: true,
    min_order_weight: '0.5kg (500g)',
    weights: [
      { weight: '0.5kg', price: 699, is_min: true },
      { weight: '1.0kg', price: 1249, is_min: false },
      { weight: '1.5kg', price: 1699, is_min: false },
      { weight: '2.0kg', price: 2249, is_min: false },
      { weight: '3.0kg', price: 3199, is_min: false },
    ],
  },
  {
    id: 'butterscotch-caramel',
    name: 'Butterscotch Caramel Praline',
    description: 'Crunchy caramelized cashew praline with smooth golden butterscotch cream',
    is_eggless_available: true,
    is_egg_available: true,
    min_order_weight: '0.5kg (500g)',
    weights: [
      { weight: '0.5kg', price: 599, is_min: true },
      { weight: '1.0kg', price: 1049, is_min: false },
      { weight: '1.5kg', price: 1499, is_min: false },
      { weight: '2.0kg', price: 1949, is_min: false },
      { weight: '3.0kg', price: 2699, is_min: false },
    ],
  },
  {
    id: 'pineapple-delight',
    name: 'Classic Sweet Pineapple Delight',
    description: 'Light vanilla sponge loaded with juicy pineapple chunks and fruit cream',
    is_eggless_available: true,
    is_egg_available: true,
    min_order_weight: '0.5kg (500g)',
    weights: [
      { weight: '0.5kg', price: 549, is_min: true },
      { weight: '1.0kg', price: 999, is_min: false },
      { weight: '1.5kg', price: 1399, is_min: false },
      { weight: '2.0kg', price: 1849, is_min: false },
      { weight: '3.0kg', price: 2599, is_min: false },
    ],
  },
];

const PhotoCakePage = () => {
  const navigate = useNavigate();
  const { addToCart, showToast } = useApp();

  // Dynamic configuration states loaded from API
  const [shapes, setShapes] = useState(DEFAULT_SHAPES);
  const [selectedShape, setSelectedShape] = useState(DEFAULT_SHAPES[0]);
  const [flavours, setFlavours] = useState(DEFAULT_FLAVOURS);
  const [selectedFlavour, setSelectedFlavour] = useState(DEFAULT_FLAVOURS[0]);
  const [dietaryConfig, setDietaryConfig] = useState({
    allow_eggless: true,
    allow_egg: true,
    default_dietary: 'eggless',
    eggless_label: '100% Pure Eggless',
    egg_label: 'With Egg (Classic Bakery)',
  });

  // Photo customization state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadId, setUploadId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form Fields
  const [nameOnCake, setNameOnCake] = useState('');
  const [description, setDescription] = useState('');
  const [cakeSize, setCakeSize] = useState('0.5kg');
  const [isEggless, setIsEggless] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const fileInputRef = useRef(null);

  // Load dynamic configuration from API and ensure ascending order from min to max kg
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/photo-cakes/config');
        if (res.data?.data) {
          const cfg = res.data.data;
          if (cfg.shapes && cfg.shapes.length > 0) {
            setShapes(cfg.shapes);
            setSelectedShape(cfg.shapes[0]);
          }
          if (cfg.flavours && cfg.flavours.length > 0) {
            const sortedFlavours = cfg.flavours.map((f) => {
              const sw = (f.weights || []).slice().sort((a, b) => parseWeightKg(a.weight) - parseWeightKg(b.weight));
              sw.forEach((w, idx) => {
                w.is_min = idx === 0;
              });
              return {
                ...f,
                weights: sw,
                min_order_weight: f.min_order_weight || (sw[0]?.weight ? `${sw[0].weight}` : '0.5kg (500g)'),
              };
            });

            setFlavours(sortedFlavours);
            const firstFlv = sortedFlavours[0];
            setSelectedFlavour(firstFlv);
            if (firstFlv.weights && firstFlv.weights.length > 0) {
              setCakeSize(firstFlv.weights[0].weight);
            }
            if (firstFlv.is_eggless_available !== false && firstFlv.is_egg_available === false) {
              setIsEggless(true);
            } else if (firstFlv.is_eggless_available === false && firstFlv.is_egg_available !== false) {
              setIsEggless(false);
            } else if (cfg.dietary) {
              setIsEggless(cfg.dietary.default_dietary !== 'egg');
            }
          }
        }
      } catch (err) {
        console.warn('Using default photo cake config:', err);
      }
    };

    fetchConfig();
  }, []);

  // Handle flavour change & recalculate available weights in ascending order
  const handleFlavourChange = (flavourName) => {
    const found = flavours.find((f) => f.name === flavourName) || flavours[0];
    setSelectedFlavour(found);

    // Sync dietary preference if the flavour only supports one preparation
    if (found.is_eggless_available !== false && found.is_egg_available === false) {
      setIsEggless(true);
    } else if (found.is_eggless_available === false && found.is_egg_available !== false) {
      setIsEggless(false);
    }

    const sortedWeights = (found.weights || [])
      .slice()
      .sort((a, b) => parseWeightKg(a.weight) - parseWeightKg(b.weight));

    if (sortedWeights.length > 0) {
      const exists = sortedWeights.some((w) => w.weight === cakeSize);
      if (!exists) {
        // Automatically default to the minimum weight for this flavour!
        setCakeSize(sortedWeights[0].weight);
      }
    }
  };

  // Strictly sort weights ascending from min kg to max kg
  const sortedWeights = (selectedFlavour?.weights || [])
    .slice()
    .sort((a, b) => parseWeightKg(a.weight) - parseWeightKg(b.weight));

  // Pricing based on selected flavour and weight tier
  const currentWeightTier = sortedWeights.find((w) => w.weight === cakeSize);
  const calculatedUnitPrice = currentWeightTier?.price || (sortedWeights[0]?.price || 649);

  // Handle Photo selection & upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setPhotoFile(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await api.post('/photo-cakes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        setUploadId(res.data.data.upload_id);
        showToast('Photo uploaded and verified successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload photo. Please try another image.', 'error');
      setPhotoPreview(null);
      setPhotoFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildCartPayload = () => {
    if (!uploadId) {
      showToast('Please upload a photo for your custom photo cake!', 'error');
      return null;
    }

    if (!nameOnCake.trim()) {
      showToast('Please enter the name or message to print on the cake.', 'error');
      return null;
    }

    const customization = {
      is_photo_cake: true,
      cake_shape: selectedShape.name,
      name_on_cake: nameOnCake.trim(),
      description: description.trim(),
      cake_size: cakeSize,
      flavour: selectedFlavour.name,
      is_eggless: isEggless,
      photo_cake_upload_id: uploadId,
      photo_preview_url: photoPreview,
    };

    const dummyProduct = {
      id: 9900 + (selectedShape.id === 'heart' ? 1 : selectedShape.id === 'round' ? 2 : 3),
      name: `Custom ${selectedShape.name} (${selectedFlavour.name})`,
      slug: `custom-${selectedShape.id}-photo-cake`,
      image_url: photoPreview || selectedShape.image,
      base_price: calculatedUnitPrice,
    };

    const variant = {
      id: null,
      size_weight: cakeSize,
      price: calculatedUnitPrice,
    };

    return { dummyProduct, variant, quantity, customization };
  };

  const handleAddToCart = () => {
    const payload = buildCartPayload();
    if (!payload) return;

    addToCart(payload.dummyProduct, payload.variant, payload.quantity, payload.customization);
    showToast(`Added ${selectedShape.name} to your cart! 🎂`, 'success');
  };

  const handleOrderNow = () => {
    const payload = buildCartPayload();
    if (!payload) return;

    addToCart(payload.dummyProduct, payload.variant, payload.quantity, payload.customization);
    showToast(`Proceeding to checkout for ${selectedShape.name}... 🎂`, 'success');
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hidden SVG defs for Heart Shaped Cake Clip */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <clipPath id="cakeHeartClip" clipPathUnits="objectBoundingBox">
            <path d="M 0.5, 0.88 C 0.2, 0.68, 0.04, 0.50, 0.04, 0.28 A 0.22, 0.22 0 0,1 0.48, 0.16 L 0.5, 0.19 L 0.52, 0.16 A 0.22, 0.22 0 0,1 0.96, 0.28 C 0.96, 0.50, 0.80, 0.68, 0.5, 0.88 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Header */}
      <div className="bg-gradient-to-r from-cream via-amber-50 to-cream rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Bakery Studio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
            Order Custom Photo Cake
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Turn your treasured photographs into safe, 100% edible masterpieces. Choose your favorite shape, upload your photo, select a delicious flavour, and order baked fresh.
          </p>
        </div>
      </div>

      {/* 2-Column Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Interactive Canvas / Live Frame Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-28">
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-warm text-center space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Live Cake Design Preview</span>
              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-serif font-bold capitalize">
                {selectedShape.name}
              </span>
            </div>

            {/* Dynamic Cake Frame by Shape */}
            <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center group">
              
              {/* Actual cake shape background & content */}
              <div
                className={`relative w-full h-full overflow-hidden bg-gradient-to-tr from-amber-100 via-amber-50 to-amber-200 flex items-center justify-center transition-all duration-300 ${
                  selectedShape.id === 'round'
                    ? 'rounded-full border-8 border-amber-200/90 shadow-2xl'
                    : selectedShape.id === 'square'
                    ? 'rounded-3xl border-8 border-amber-200/90 shadow-2xl'
                    : selectedShape.id === 'heart'
                    ? 'shadow-2xl'
                    : 'rounded-3xl border-8 border-amber-200/90 shadow-2xl'
                }`}
                style={
                  selectedShape.id === 'heart'
                    ? { clipPath: 'url(#cakeHeartClip)', WebkitClipPath: 'url(#cakeHeartClip)' }
                    : {}
                }
              >
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Customer Cake Upload"
                      className="w-full h-full object-cover"
                    />

                    {/* Inner Piped Border Effect */}
                    {selectedShape.id === 'round' && (
                      <div className="absolute inset-0 rounded-full border-[8px] border-dashed border-white/70 pointer-events-none" />
                    )}
                    {selectedShape.id === 'square' && (
                      <div className="absolute inset-0 rounded-2xl border-[8px] border-dashed border-white/70 pointer-events-none" />
                    )}
                    
                    {/* Name Overlay Banner */}
                    {nameOnCake && (
                      <div className="absolute bottom-6 left-4 right-4 bg-chocolate/85 backdrop-blur-xs text-amber-200 font-serif font-bold text-xs sm:text-sm py-1.5 px-3 rounded-full shadow-lg border border-amber-400/40 truncate text-center">
                        {nameOnCake}
                      </div>
                    )}

                    {/* Remove Photo button */}
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors z-10 cursor-pointer"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 text-center cursor-pointer space-y-2 hover:scale-105 transition-transform"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-200/70 text-amber-800 flex items-center justify-center">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="font-serif font-bold text-sm text-chocolate">Click to Upload Photo</div>
                    <div className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</div>
                    <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                      {selectedShape.name} Preview
                    </div>
                  </div>
                )}
              </div>

              {/* Decorative Heart Border Overlay if Heart Selected */}
              {selectedShape.id === 'heart' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                  <path
                    d="M 50,88 C 20,68 4,50 4,28 A 22,22 0 0,1 48,16 L 50,19 L 52,16 A 22,22 0 0,1 96,28 C 96,50 80,68 50,88 Z"
                    fill="none"
                    stroke="#fde68a"
                    strokeWidth="6"
                  />
                  <path
                    d="M 50,88 C 20,68 4,50 4,28 A 22,22 0 0,1 48,16 L 50,19 L 52,16 A 22,22 0 0,1 96,28 C 96,50 80,68 50,88 Z"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                </svg>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-700" />
                <span>{uploading ? 'Uploading Photo...' : photoPreview ? 'Replace Photo' : 'Upload Your Photo'}</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Edible FDA Approved Sugar Sheet</span>
            </div>
          </div>
        </div>

        {/* Right: Customization Form Fields (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-6">
          
          {/* Step 1: Base Cake Shape Selection (Loaded dynamically from API) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Choose Cake Shape:
              </label>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {selectedShape.name}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {shapes.map((shape) => {
                const isSelected = selectedShape.id === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => setSelectedShape(shape)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-amber-200 bg-white'
                    }`}
                  >
                    <div className="relative aspect-video sm:aspect-square w-full rounded-xl overflow-hidden mb-2 bg-cream">
                      <img
                        src={shape.image}
                        alt={shape.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = '/images/shapes/heart-cake.jpg';
                        }}
                      />
                      <span className="absolute top-1.5 left-1.5 text-sm bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-2xs">
                        {shape.icon || '🎂'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-chocolate flex items-center justify-between">
                        <span>{shape.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                        {shape.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Name on Cake */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Name / Message On Cake: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nameOnCake}
              onChange={(e) => setNameOnCake(e.target.value)}
              placeholder="e.g. Happy 25th Birthday Rahul!"
              maxLength={40}
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium text-chocolate placeholder:text-slate-400"
            />
            <div className="text-[10px] text-slate-400 text-right">{nameOnCake.length} / 40 characters</div>
          </div>

          {/* Step 3: Size Selection (Sorted Min to Max, with editable Minimum Order Badge) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Cake Size / Weight:
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                Minimum Order: {selectedFlavour?.min_order_weight || (sortedWeights[0]?.weight ? `${sortedWeights[0].weight}` : '0.5kg (500g)')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {sortedWeights.map((wTier, idx) => {
                const isSelected = cakeSize === wTier.weight;
                return (
                  <button
                    key={wTier.weight}
                    type="button"
                    onClick={() => setCakeSize(wTier.weight)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500/10 font-bold text-chocolate ring-2 ring-amber-500/30'
                        : 'border-slate-200 hover:border-amber-200 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{wTier.weight}</div>
                    {idx === 0 && (
                      <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 rounded mt-0.5">
                        Min Size
                      </span>
                    )}
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      ₹{wTier.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Flavour Selection (Loaded dynamically from API) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Delicious Flavour:
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                {flavours.length} Artisanal Flavours Available
              </span>
            </div>
            <select
              value={selectedFlavour?.name || ''}
              onChange={(e) => handleFlavourChange(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
            >
              {flavours.map((flv) => {
                const canEggless = flv.is_eggless_available !== false;
                const canEgg = flv.is_egg_available !== false;
                const recipeTag =
                  canEggless && canEgg
                    ? '(Eggless & With Egg)'
                    : canEggless
                    ? '(100% Eggless Only)'
                    : '(With Egg Only)';
                return (
                  <option key={flv.id || flv.name} value={flv.name}>
                    {flv.name} — {recipeTag}
                  </option>
                );
              })}
            </select>

            {/* Selected Flavour Dietary Badges & Description */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              {selectedFlavour?.description && (
                <p className="text-[11px] text-slate-500 italic">
                  {selectedFlavour.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] font-bold ml-auto">
                {selectedFlavour?.is_eggless_available !== false && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Eggless Recipe
                  </span>
                )}
                {selectedFlavour?.is_egg_available !== false && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    With Egg Recipe
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Step 5: Eggless / With Egg Recipe Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              5. Cake Preparation (Recipe Preference):
            </label>

            {(() => {
              const canEggless = selectedFlavour ? selectedFlavour.is_eggless_available !== false : true;
              const canEgg = selectedFlavour ? selectedFlavour.is_egg_available !== false : true;

              if (canEggless && canEgg) {
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEggless(true)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isEggless
                          ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isEggless ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isEggless ? '✓' : ''}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block">
                            100% Pure Eggless
                          </span>
                          <span className="text-[10px] text-emerald-700">
                            Pure vegetarian whipped recipe
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Veg
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEggless(false)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        !isEggless
                          ? 'border-amber-600 bg-amber-50/90 ring-2 ring-amber-500/30 shadow-xs'
                          : 'border-slate-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          !isEggless ? 'bg-amber-600 text-white' : 'border border-slate-300'
                        }`}>
                          {!isEggless ? '✓' : ''}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-amber-950 block">
                            With Egg (Classic)
                          </span>
                          <span className="text-[10px] text-amber-700">
                            Traditional fluffy sponge recipe
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Classic
                      </span>
                    </button>
                  </div>
                );
              }

              if (canEggless && !canEgg) {
                return (
                  <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          100% Pure Eggless Cake
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          This flavour "{selectedFlavour?.name}" is freshly baked exclusively in our pure vegetarian eggless recipe.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-full shrink-0">
                      Eggless Only
                    </span>
                  </div>
                );
              }

              return (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </span>
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">
                        Baked With Fresh Eggs (Classic Recipe)
                      </span>
                      <span className="text-[11px] text-amber-700">
                        This flavour "{selectedFlavour?.name}" is handcrafted exclusively using classic farm-fresh egg sponge.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full shrink-0">
                    With Egg Only
                  </span>
                </div>
              );
            })()}
          </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Special Decoration Instructions (Optional):
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Use blue piping borders, include 2 candles, write message in golden font"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Price & Dual Action Buttons: Add to Cart + Order Now */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Price:</div>
              <div className="text-2xl font-bold text-chocolate">
                ₹{(calculatedUnitPrice * quantity).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                Includes {cakeSize} {selectedShape.name} ({selectedFlavour.name})
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={handleOrderNow}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>Order Now (Checkout)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PhotoCakePage;
