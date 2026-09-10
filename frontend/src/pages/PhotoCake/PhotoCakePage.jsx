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
  Cake,
  X,
  Info
} from 'lucide-react';

const PhotoCakePage = () => {
  const navigate = useNavigate();
  const { addToCart, showToast } = useApp();

  // Selected base cake model
  const [baseCakes, setBaseCakes] = useState([]);
  const [selectedCake, setSelectedCake] = useState(null);

  // Photo customization state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadId, setUploadId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form Fields
  const [nameOnCake, setNameOnCake] = useState('');
  const [description, setDescription] = useState('');
  const [cakeSize, setCakeSize] = useState('1kg');
  const [flavour, setFlavour] = useState('Dutch Chocolate Truffle');
  const [isEggless, setIsEggless] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const fileInputRef = useRef(null);

  // Load available cake products
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        const res = await api.get('/products?category=cakes-pastries&per_page=6');
        if (res.data?.data && res.data.data.length > 0) {
          setBaseCakes(res.data.data);
          setSelectedCake(res.data.data[0]);
        }
      } catch (err) {
        console.warn('Error fetching cakes:', err);
      }
    };
    fetchCakes();
  }, []);

  // Pricing based on size
  const sizePrices = {
    '500g': 649,
    '1kg': 1149,
    '1.5kg': 1599,
    '2kg': 2099,
  };

  const calculatedUnitPrice = sizePrices[cakeSize] || 1149;

  // Handle Photo selection & upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    // Local client-side preview immediately
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setPhotoFile(file);

    // Upload to server for safe storage & token generation
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

  const handleAddToCart = () => {
    if (!uploadId) {
      showToast('Please upload a photo for your custom photo cake!', 'error');
      return;
    }

    if (!nameOnCake.trim()) {
      showToast('Please enter the name or message to print on the cake.', 'error');
      return;
    }

    const customization = {
      is_photo_cake: true,
      name_on_cake: nameOnCake.trim(),
      description: description.trim(),
      cake_size: cakeSize,
      flavour: flavour,
      is_eggless: isEggless,
      photo_cake_upload_id: uploadId,
      photo_preview_url: photoPreview,
    };

    const dummyProduct = selectedCake || {
      id: 9999,
      name: `Custom Photo Cake (${flavour})`,
      slug: 'custom-photo-cake',
      image_url: photoPreview,
      base_price: calculatedUnitPrice,
    };

    // Construct virtual variant
    const variant = {
      id: null,
      size_weight: cakeSize,
      price: calculatedUnitPrice,
    };

    addToCart(dummyProduct, variant, quantity, customization);
    showToast('Your custom photo cake is added to cart! 🎂', 'success');
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
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
            Turn your treasured photographs into safe, 100% edible masterpieces. Printed using certified food-grade sugar sheets and edible inks on pure dairy fresh cream cakes.
          </p>
        </div>
      </div>

      {/* 2-Column Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Interactive Canvas / Live Frame Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-28">
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-warm text-center space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Cake Design Preview
            </div>

            {/* Circular / Heart / Square Cake Frame */}
            <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-amber-200/80 shadow-2xl overflow-hidden bg-gradient-to-tr from-amber-100 via-amber-50 to-amber-200 flex items-center justify-center group">
              {photoPreview ? (
                <>
                  <img
                    src={photoPreview}
                    alt="Customer Cake Upload"
                    className="w-full h-full object-cover"
                  />
                  {/* Piped Border Effect */}
                  <div className="absolute inset-0 rounded-full border-[10px] border-dashed border-white/60 pointer-events-none" />
                  
                  {/* Name Overlay Banner */}
                  {nameOnCake && (
                    <div className="absolute bottom-6 left-4 right-4 bg-chocolate/85 backdrop-blur-xs text-amber-200 font-serif font-bold text-xs sm:text-sm py-1.5 px-3 rounded-full shadow-lg border border-amber-400/40 truncate">
                      {nameOnCake}
                    </div>
                  )}

                  {/* Remove Photo button */}
                  <button
                    onClick={removePhoto}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
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
                </div>
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
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
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
          
          {/* Step 1: Base Cake Theme Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Choose Base Cake Style:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {baseCakes.map((cake) => {
                const isSelected = selectedCake?.id === cake.id;
                return (
                  <button
                    key={cake.id}
                    type="button"
                    onClick={() => setSelectedCake(cake)}
                    className={`p-2 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-amber-200'
                    }`}
                  >
                    <img src={cake.image_url} alt="" className="w-full h-16 object-cover rounded-xl mb-1.5" />
                    <div className="text-[11px] font-bold text-chocolate truncate">{cake.name}</div>
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

          {/* Step 3: Size Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Cake Size / Weight:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['500g', '1kg', '1.5kg', '2kg'].map((sz) => {
                const isSelected = cakeSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setCakeSize(sz)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500/10 font-bold text-chocolate ring-2 ring-amber-500/30'
                        : 'border-slate-200 hover:border-amber-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{sz}</div>
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">₹{sizePrices[sz]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Flavour Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Delicious Flavour:
            </label>
            <select
              value={flavour}
              onChange={(e) => setFlavour(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none focus:border-amber-500"
            >
              <option value="Dutch Chocolate Truffle">Dutch Chocolate Truffle</option>
              <option value="Black Forest">Black Forest with Red Cherries</option>
              <option value="Fresh Fruit Cream">Seasonal Fresh Fruit Cream</option>
              <option value="Royal Red Velvet">Royal Red Velvet & Cream Cheese</option>
              <option value="Butterscotch Caramel">Butterscotch Caramel Praline</option>
              <option value="Pineapple Delight">Classic Sweet Pineapple Delight</option>
            </select>
          </div>

          {/* Step 5: Eggless Toggle & Special Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-900">100% Eggless Preparation</span>
              </div>
              <input
                type="checkbox"
                checked={isEggless}
                onChange={(e) => setIsEggless(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
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

          {/* Price & Submit */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Price:</div>
              <div className="text-2xl font-bold text-chocolate">
                ₹{(calculatedUnitPrice * quantity).toLocaleString('en-IN')}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Custom Cake To Cart</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PhotoCakePage;
