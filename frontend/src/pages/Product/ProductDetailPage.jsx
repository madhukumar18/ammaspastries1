import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import ProductCard from '../../components/UI/ProductCard';
import ProductCarousel from '../../components/UI/ProductCarousel';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  MessageSquare,
  Scale
} from 'lucide-react';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, showToast } = useApp();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(null);
  const [isEggless, setIsEggless] = useState(true);
  const [orderMode, setOrderMode] = useState('weight'); // 'weight' or 'piece'
  const [pieceCount, setPieceCount] = useState(1);

  // Review Form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data?.data) {
          const p = res.data.data.product;
          setProduct(p);
          setRelated(res.data.data.related || []);
          setActiveImage(p.image_url);
          setIsEggless(Boolean(p.is_eggless));
          setCurrentStepIndex(0);
          setPieceCount(p.piece_min ? Number(p.piece_min) : 1);
          setOrderMode('weight');
        }
      } catch (err) {
        console.warn('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Check if product is sold by both grams and pieces
  const weightStr = String(product?.weight || '').toLowerCase();
  const isBoth = Boolean(
    product?.portion_type === 'both' ||
    (product?.piece_price && Number(product.piece_price) > 0) ||
    (weightStr && (weightStr.includes('piece') || weightStr.includes('slice') || weightStr.includes('portion') || weightStr.includes('pcs')) && (weightStr.includes('g') || weightStr.includes('kg')))
  );

  // Check if product is sold purely by portions or weights
  const isPortion = !isBoth && Boolean(
    product?.portion_type === 'portion' ||
    (weightStr && (weightStr.includes('piece') || weightStr.includes('slice') || weightStr.includes('portion')))
  );

  // Unified available steps (grams to kgs, portions, or both) - Defined before early returns
  const steps = useMemo(() => {
    if (!product) return [];

    // If product has explicit variants from DB
    if (product.variants && product.variants.length > 0) {
      if (isBoth) {
        // When in both mode, filter weight variants for the weight tab
        const weightVariants = product.variants.filter((v) => {
          const sw = String(v?.size_weight || '').toLowerCase();
          return !sw.includes('piece') && !sw.includes('slice');
        });
        if (weightVariants.length > 0) {
          return weightVariants.map((v) => ({
            label: v?.size_weight ? String(v.size_weight) : '500g',
            price: Number(v.discount_price || v.price || 0),
            strikePrice: v.discount_price ? Number(v.price) : null,
            variant: v,
          }));
        }
      } else {
        return product.variants.map((v) => ({
          label: v?.size_weight ? String(v.size_weight) : '500g',
          price: Number(v.discount_price || v.price || 0),
          strikePrice: v.discount_price ? Number(v.price) : null,
          variant: v,
        }));
      }
    }

    const baseP = Number(product.discount_price || product.base_price || 499);
    const defWeight = product.weight ? String(product.weight) : (isPortion ? '1 Piece' : '500g');

    if (isBoth) {
      const cleanWeight = defWeight && !defWeight.toLowerCase().includes('piece') ? defWeight : '500g';
      return [
        { label: cleanWeight, price: baseP, strikePrice: null },
        { label: '1kg', price: Math.round(baseP * 1.8), strikePrice: null },
        { label: '1.5kg', price: Math.round(baseP * 2.6), strikePrice: null },
        { label: '2kg', price: Math.round(baseP * 3.4), strikePrice: null },
      ];
    } else if (isPortion) {
      return [
        { label: defWeight, price: baseP, strikePrice: null },
        { label: '2 Pieces', price: Math.round(baseP * 1.9), strikePrice: null },
        { label: '4 Pieces', price: Math.round(baseP * 3.6), strikePrice: null },
        { label: '6 Pieces', price: Math.round(baseP * 5.2), strikePrice: null },
      ];
    } else {
      // Weight mode: scale from grams to kilograms
      return [
        { label: defWeight, price: baseP, strikePrice: null },
        { label: '1kg', price: Math.round(baseP * 1.8), strikePrice: null },
        { label: '1.5kg', price: Math.round(baseP * 2.6), strikePrice: null },
        { label: '2kg', price: Math.round(baseP * 3.4), strikePrice: null },
        { label: '3kg', price: Math.round(baseP * 5.0), strikePrice: null },
      ];
    }
  }, [product, isBoth, isPortion]);

  const activeStep = steps[currentStepIndex] || steps[0] || {
    label: product?.weight || '500g',
    price: Number(product?.discount_price || product?.base_price || 499),
    strikePrice: null,
  };

  const piecePrice = Number(product?.piece_price || (product?.base_price ? Math.round(Number(product.base_price) / 4) : 120));
  const pieceLimit = product?.piece_limit !== undefined && product?.piece_limit !== null ? Number(product.piece_limit) : 20;
  const isUnlimited = pieceLimit === 0;

  const currentPrice = Number(activeStep?.price || product?.discount_price || product?.base_price || 0);
  const strikePrice = activeStep?.strikePrice ? Number(activeStep.strikePrice) : (product?.discount_price ? Number(product.base_price) : null);

  const displayPrice = isBoth && orderMode === 'piece' ? pieceCount * piecePrice : currentPrice;
  const displayStrikePrice = isBoth && orderMode === 'piece' ? null : strikePrice;

  const isFavorited = product ? isInWishlist(product.id) : false;

  const handleDecreaseStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleIncreaseStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (isBoth && orderMode === 'piece') {
      const label = `${pieceCount} ${pieceCount === 1 ? 'Piece' : 'Pieces'}`;
      const chosenVariant = {
        id: `piece-${pieceCount}`,
        size_weight: label,
        price: pieceCount * piecePrice,
        discount_price: null,
      };

      addToCart(product, chosenVariant, 1, {
        is_eggless: isEggless,
        dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
        selected_weight_portion: label,
        order_type: 'pieces',
        pieces: pieceCount,
      });
      return;
    }

    const chosenVariant = activeStep.variant || {
      id: `step-${activeStep.label}`,
      size_weight: activeStep.label,
      price: activeStep.price,
      discount_price: activeStep.strikePrice ? activeStep.price : null,
    };

    addToCart(product, chosenVariant, 1, {
      is_eggless: isEggless,
      dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
      selected_weight_portion: activeStep.label,
      order_type: 'weight',
    });
  };

  const handleOrderNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      showToast('Please fill out your name and review comment.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post('/reviews/submit', {
        product_id: product?.id,
        customer_name: reviewerName,
        rating: reviewerRating,
        comment: reviewerComment,
      });
      showToast('Thank you! Your review has been submitted for moderation.', 'success');
      setShowReviewModal(false);
      setReviewerName('');
      setReviewerComment('');
    } catch (err) {
      showToast('Unable to submit review. Please try again.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-spin text-4xl mb-3">🍰</div>
        <p className="text-sm font-semibold text-chocolate">Preparing fresh cake details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-chocolate">Cake Not Found</h2>
        <p className="text-xs text-slate-500">The product you are looking for might be out of season or moved.</p>
        <Link to="/category/cakes-pastries" className="inline-block text-xs font-bold text-white bg-amber-600 px-5 py-2.5 rounded-full">
          Explore All Cakes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-amber-700">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category?.slug || 'cakes-pastries'}`} className="hover:text-amber-700">
          {product.category?.name || 'Cakes'}
        </Link>
        <span>/</span>
        <span className="text-chocolate font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-cream shadow-warm border border-amber-100">
            <img
              src={activeImage || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {!['party-items', 'dry-fruits', 'chocolates'].includes(product.category?.slug) && (
              <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs text-chocolate text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-amber-200">
                <span className={`w-2 h-2 rounded-full ${isEggless ? 'bg-emerald-600' : 'bg-amber-700'}`} />
                <span>{isEggless ? '100% Pure Eggless' : 'With Egg (Classic)'}</span>
              </span>
            )}
          </div>

          {/* Thumbnails if multiple images exist */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === img.image_url ? 'border-amber-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Controls (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">5.0</span>
              <span className="text-xs text-slate-400">({product.approved_reviews?.length || 12} reviews)</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-chocolate leading-tight">
              {product.name}
            </h1>

            {product.sku && (
              <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
                SKU: {product.sku}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-chocolate">
              ₹{Number(displayPrice).toLocaleString('en-IN')}
            </span>
            {displayStrikePrice && (
              <span className="text-base text-slate-400 line-through">
                ₹{Number(displayStrikePrice).toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full ml-auto">
              Inclusive of GST
            </span>
          </div>

          {/* Recipe / Dietary Selection (Eggless vs With Egg, hidden on party-items & dry-fruits) */}
          {!['party-items', 'dry-fruits', 'chocolates'].includes(product.category?.slug) && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Dietary Preference:
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Baked Fresh for You
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsEggless(true)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isEggless
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-chocolate flex items-center gap-1.5">
                      <span>100% Pure Eggless</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Veg</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Pure vegetarian dairy sponge</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEggless(false)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    !isEggless
                      ? 'border-amber-700 bg-amber-50/50 shadow-xs ring-2 ring-amber-700/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-700 border-2 border-white ring-1 ring-amber-700 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-chocolate flex items-center gap-1.5">
                      <span>With Egg</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Classic</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Classic bakery sponge</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* SINGLE UNIFIED WEIGHT / PORTION SECTION WITH + / - STEPPER */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 p-4 sm:p-5 rounded-3xl border-2 border-amber-300/80 shadow-sm space-y-3.5">
            
            {/* If product supports Both: Render interactive Mode Switcher */}
            {isBoth && (
              <div className="flex items-center gap-1.5 p-1 bg-amber-100/70 rounded-2xl border border-amber-300">
                <button
                  type="button"
                  onClick={() => setOrderMode('weight')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orderMode === 'weight'
                      ? 'bg-chocolate text-white shadow-xs'
                      : 'text-amber-950 hover:bg-white/60'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Order by Weight (Grams / Kgs)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderMode('piece')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orderMode === 'piece'
                      ? 'bg-chocolate text-white shadow-xs'
                      : 'text-amber-950 hover:bg-white/60'
                  }`}
                >
                  <span>🍰</span>
                  <span>Order by Pieces (1 to {isUnlimited ? '∞' : pieceLimit})</span>
                </button>
              </div>
            )}

            {isBoth && orderMode === 'piece' ? (
              /* PIECES STEPPER (1 PIECE TO ADMIN LIMIT) */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <label className="text-xs font-black uppercase tracking-wider text-chocolate">
                      Select Pieces:
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    ₹{piecePrice} / piece • {isUnlimited ? 'Unlimited' : `Max ${pieceLimit} Pieces`}
                  </span>
                </div>

                {/* Interactive Stepper Box for Pieces */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 bg-amber-500 text-chocolate font-black text-sm sm:text-base rounded-xl shadow-xs">
                        {pieceCount} {pieceCount === 1 ? 'Piece' : 'Pieces'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-chocolate">
                        ₹{pieceCount * piecePrice}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (₹{piecePrice} × {pieceCount})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isUnlimited
                        ? 'Click the + button to add more pieces without limit'
                        : `Click + or - to select between 1 and ${pieceLimit} pieces`}
                    </p>
                  </div>

                  {/* Stepper Buttons: [-] Current [+] */}
                  <div className="flex items-center self-start sm:self-auto gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setPieceCount((prev) => Math.max(1, prev - 1))}
                      disabled={pieceCount <= 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl transition-all ${
                        pieceCount <= 1
                          ? 'opacity-30 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                      }`}
                      title="Decrease pieces"
                    >
                      -
                    </button>

                    <div className="min-w-[85px] sm:min-w-[95px] text-center px-2">
                      <div className="font-extrabold text-sm text-chocolate">{pieceCount} {pieceCount === 1 ? 'Piece' : 'Pieces'}</div>
                      <div className="text-[10px] font-bold text-amber-700">₹{pieceCount * piecePrice}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isUnlimited || pieceCount < pieceLimit) {
                          setPieceCount((prev) => prev + 1);
                        }
                      }}
                      disabled={!isUnlimited && pieceCount >= pieceLimit}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer ${
                        !isUnlimited && pieceCount >= pieceLimit ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title={!isUnlimited && pieceCount >= pieceLimit ? `Reached max bakery limit of ${pieceLimit} pieces` : 'Add another piece (+)'}
                    >
                      +
                    </button>
                  </div>
                </div>

                {!isUnlimited && pieceCount >= pieceLimit && (
                  <div className="text-[11px] text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Max bakery limit for this item is <strong>{pieceLimit} pieces</strong>. For larger catering quantities, please contact us.</span>
                  </div>
                )}

                {/* Quick Piece Selector Chips */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1 flex-wrap gap-2">
                  <span>Quick Pick Pieces:</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {[1, 2, 4, 6, 8, 10, 12, 16, 20]
                      .filter((val) => isUnlimited || val <= pieceLimit)
                      .slice(0, 6)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPieceCount(val)}
                          className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            val === pieceCount
                              ? 'bg-amber-500 text-chocolate shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'
                          }`}
                        >
                          {val} {val === 1 ? 'Pc' : 'Pcs'}
                        </button>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              /* WEIGHT (OR REGULAR PORTION) STEPPER */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <label className="text-xs font-black uppercase tracking-wider text-chocolate">
                      {isPortion ? 'Select Portions / Pieces:' : 'Select Cake Weight (Grams to Kgs):'}
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    {isPortion
                      ? `Base: ${steps[0]?.label || '1 Piece'} (Min Order)`
                      : `Default: ${steps[0]?.label || '500g'} (Min Order)`}
                  </span>
                </div>

                {/* Interactive Stepper Box */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 bg-amber-500 text-chocolate font-black text-sm sm:text-base rounded-xl shadow-xs">
                        {activeStep.label}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-chocolate">
                        ₹{activeStep.price}
                      </span>
                      {activeStep.strikePrice && (
                        <span className="text-xs sm:text-sm text-slate-400 line-through">
                          ₹{activeStep.strikePrice}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isPortion
                        ? 'Click the + button to scale portions or pieces'
                        : 'Click the + button to increase weight from grams to kilograms'}
                    </p>
                  </div>

                  {/* Stepper Buttons: [-] Current [+] */}
                  <div className="flex items-center self-start sm:self-auto gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-2xs">
                    <button
                      type="button"
                      onClick={handleDecreaseStep}
                      disabled={currentStepIndex <= 0}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl transition-all ${
                        currentStepIndex <= 0
                          ? 'opacity-30 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                      }`}
                      title={isPortion ? "Decrease portion" : "Decrease weight"}
                    >
                      -
                    </button>

                    <div className="min-w-[85px] sm:min-w-[95px] text-center px-2">
                      <div className="font-extrabold text-sm text-chocolate">{activeStep.label}</div>
                      <div className="text-[10px] font-bold text-amber-700">₹{activeStep.price}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncreaseStep}
                      disabled={currentStepIndex >= steps.length - 1}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer ${
                        currentStepIndex >= steps.length - 1 ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title={isPortion ? "Increase portion (+)" : "Increase weight (+)"}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Step Indicators */}
                {steps.length > 1 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
                    <span>{isPortion ? 'Portion Scale:' : 'Scale (Grams to Kgs):'}</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {steps.map((s, idx) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            idx === currentStepIndex
                              ? 'bg-amber-500 text-chocolate shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons: Add to Cart, Order Now, Wishlist */}
          <div className="pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 font-bold text-sm py-3.5 px-4 rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>
                  Add to Cart (
                  {isBoth && orderMode === 'piece'
                    ? `${pieceCount} ${pieceCount === 1 ? 'Piece' : 'Pieces'}`
                    : activeStep?.label || 'Item'}
                  )
                </span>
              </button>

              <button
                type="button"
                onClick={handleOrderNow}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm py-3.5 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>Order Now (₹{Number(displayPrice || 0).toLocaleString('en-IN')})</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-rose-500 font-semibold'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
                <span>{isFavorited ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                ✓ Baked Fresh on Confirmation
              </span>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Delivery in 45-60 Mins</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Freshly Baked On Order</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Quality Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Free Celebration Candle</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-bold text-chocolate">About This Creation</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description || product.short_description}
            </p>
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate">
              Customer Reviews ({product.approved_reviews?.length || 0})
            </h2>
            <p className="text-xs text-slate-500">Verified reviews from customers who enjoyed this cake</p>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-chocolate bg-amber-100/70 hover:bg-amber-200/80 px-4 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            <MessageSquare className="w-4 h-4 text-amber-700" />
            <span>Write A Review</span>
          </button>
        </div>

        {product.approved_reviews && product.approved_reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.approved_reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-chocolate">{rev.customer_name}</div>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                <div className="text-[10px] text-slate-400">{rev.customer_location || 'Bengaluru'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No public reviews yet for this cake. Be the first to share your experience!
          </div>
        )}
      </section>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-amber-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-serif font-bold text-lg text-chocolate">Write a Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Priya Venkatesh"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewerRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewerRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder="Tell us about the freshness, taste, and presentation..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:from-amber-700 hover:to-amber-600 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review For Verification'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Related Products Carousel with same Cart and Order actions */}
      {related.length > 0 && (
        <ProductCarousel
          products={related}
          title="Related Delights You May Also Love"
          subtitle="Artisan companions baked fresh daily • Same instant Add to Cart & Order Now"
          badgeText="Frequently Ordered Together"
        />
      )}

    </div>
  );
};

export default ProductDetailPage;
