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
  const [selectedFlavour, setSelectedFlavour] = useState(null);
  const [selectedCreamId, setSelectedCreamId] = useState(null);
  const [selectedCupcakeEggId, setSelectedCupcakeEggId] = useState(null);
  const [selectedSnackUnit, setSelectedSnackUnit] = useState(null);
  const [selectedSnackEggless, setSelectedSnackEggless] = useState(null);

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
          setSelectedCreamId(null);
          setSelectedCupcakeEggId(null);

          if (p.snack_variants && p.snack_variants.pricing_type) {
            const pType = p.snack_variants.pricing_type;
            if (pType === 'piece') {
              setSelectedSnackUnit('piece');
              setSelectedSnackEggless(Boolean(p.is_eggless));
            } else if (pType === 'weight') {
              setSelectedSnackUnit('weight');
              setSelectedSnackEggless(Boolean(p.is_eggless));
            } else {
              // 'both' -> customer must first select type before choosing egg/eggless
              setSelectedSnackUnit(null);
              setSelectedSnackEggless(null);
            }
          } else {
            setSelectedSnackUnit(null);
            setSelectedSnackEggless(null);
          }
          if (p.flavours && Array.isArray(p.flavours) && p.flavours.length > 0) {
            const isTheme = Boolean(
              p.category?.slug === 'theme-cakes' ||
              p.category_id === 8 ||
              p.category?.name?.toLowerCase().includes('theme cake') ||
              p.subcategory?.category?.slug === 'theme-cakes' ||
              p.subcategory?.name?.toLowerCase().includes('theme')
            );
            setSelectedFlavour(isTheme ? null : p.flavours[0]);
          } else {
            setSelectedFlavour(null);
          }
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

  const hasFlavours = Boolean(product?.flavours && Array.isArray(product.flavours) && product.flavours.length > 0);
  const isThemeCake = Boolean(
    product?.category?.slug === 'theme-cakes' ||
    product?.category_id === 8 ||
    product?.category?.name?.toLowerCase().includes('theme cake') ||
    product?.subcategory?.category?.slug === 'theme-cakes'
  );

  const hasCupcakeVariants = Boolean(
    product?.cupcake_variants?.matrix &&
    Array.isArray(product.cupcake_variants.matrix) &&
    product.cupcake_variants.matrix.length > 0 &&
    product.cupcake_variants.cream_options?.length > 0 &&
    product.cupcake_variants.egg_options?.length > 0
  );

  const hasSnackVariants = Boolean(
    product?.snack_variants &&
    product.snack_variants.pricing_type &&
    (
      (product.snack_variants.pricing_type === 'piece' && product.snack_variants.piece) ||
      (product.snack_variants.pricing_type === 'weight' && product.snack_variants.weight) ||
      (product.snack_variants.pricing_type === 'both' && product.snack_variants.piece && product.snack_variants.weight)
    )
  );

  const activeSnackPrice = useMemo(() => {
    if (!hasSnackVariants) return null;
    const sv = product.snack_variants;
    const unit = selectedSnackUnit;
    if (!unit) return null;
    const unitData = unit === 'piece' ? sv.piece : sv.weight;
    if (!unitData) return null;
    if (selectedSnackEggless === null) return null;
    const rawPrice = selectedSnackEggless ? unitData.eggless_price : unitData.egg_price;
    return rawPrice !== undefined && rawPrice !== null && rawPrice !== '' ? Number(rawPrice) : null;
  }, [hasSnackVariants, product, selectedSnackUnit, selectedSnackEggless]);

  const handleSelectSnackUnit = (unit) => {
    setSelectedSnackUnit(unit);
    // If eggless preference was not yet chosen, default to pure eggless
    if (selectedSnackEggless === null) {
      setSelectedSnackEggless(true);
    }
  };

  const handleSelectSnackDietary = (eggless) => {
    setSelectedSnackEggless(eggless);
  };

  const activeCupcakeItem = useMemo(() => {
    if (!hasCupcakeVariants || !selectedCreamId || !selectedCupcakeEggId) return null;
    return (
      product.cupcake_variants.matrix.find(
        (m) => m.cream_id === selectedCreamId && m.egg_id === selectedCupcakeEggId
      ) || null
    );
  }, [hasCupcakeVariants, selectedCreamId, selectedCupcakeEggId, product]);

  const activeCupcakePrice = activeCupcakeItem?.price ? Number(activeCupcakeItem.price) : null;
  const isCupcakeAvailable = activeCupcakeItem ? activeCupcakeItem.is_available !== false : true;

  const handleSelectCreamOption = (creamId) => {
    setSelectedCreamId(creamId);
    // User requirement: Changing Cream type resets Egg type and hides price until both are selected
    setSelectedCupcakeEggId(null);
  };

  const handleSelectCupcakeEgg = (eggId) => {
    setSelectedCupcakeEggId(eggId);
  };

  const activeFlavourPrice = useMemo(() => {
    if (!hasFlavours || !selectedFlavour) return null;
    const eggPrice = Number(selectedFlavour.egg_price !== undefined && selectedFlavour.egg_price !== null ? selectedFlavour.egg_price : (product?.egg_price || product?.base_price || 0));
    const egglessPrice = Number(selectedFlavour.eggless_price !== undefined && selectedFlavour.eggless_price !== null ? selectedFlavour.eggless_price : (product?.eggless_price || eggPrice || 0));
    return isEggless ? egglessPrice : eggPrice;
  }, [hasFlavours, selectedFlavour, isEggless, product]);

  const displayPrice = hasSnackVariants
    ? activeSnackPrice
    : hasCupcakeVariants
    ? activeCupcakePrice
    : hasFlavours && activeFlavourPrice !== null
    ? activeFlavourPrice
    : (isBoth && orderMode === 'piece' ? pieceCount * piecePrice : currentPrice);
  const displayStrikePrice = hasSnackVariants || hasCupcakeVariants || (isBoth && orderMode === 'piece') ? null : strikePrice;

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

    if (hasSnackVariants) {
      if (!selectedSnackUnit) {
        showToast('Please choose an order type (Piece or Weight).', 'warning');
        return;
      }
      if (selectedSnackEggless === null) {
        showToast('Please select Dietary Preference (Egg or Eggless).', 'warning');
        return;
      }

      const sv = product.snack_variants;
      const unitData = selectedSnackUnit === 'piece' ? sv.piece : sv.weight;
      const portionLabel = selectedSnackUnit === 'piece'
        ? '1 Piece'
        : `${unitData?.value || ''} (${unitData?.unit || 'grams'})`.trim();
      const dietaryLabel = selectedSnackEggless ? '100% Pure Eggless' : 'With Egg';
      const comboLabel = `${portionLabel} • ${dietaryLabel}`;

      const chosenVariant = {
        id: `snack-${product.id}-${selectedSnackUnit}-${selectedSnackEggless ? 'eggless' : 'egg'}`,
        size_weight: portionLabel,
        price: activeSnackPrice,
        discount_price: null,
      };

      addToCart(product, chosenVariant, 1, {
        product_type: 'snack',
        unit_type: selectedSnackUnit,
        portion_label: portionLabel,
        is_eggless: selectedSnackEggless,
        dietary: dietaryLabel,
        selected_price: activeSnackPrice,
        selected_weight_portion: comboLabel,
      });
      return;
    }

    if (hasCupcakeVariants) {
      if (!selectedCreamId) {
        showToast('Please select a Cream Type (Step 1).', 'warning');
        return;
      }
      if (!selectedCupcakeEggId) {
        showToast('Please select Dietary Preference (Step 2).', 'warning');
        return;
      }
      if (!isCupcakeAvailable) {
        showToast('This cupcake combination is currently unavailable.', 'warning');
        return;
      }

      const creamObj = product.cupcake_variants.cream_options?.find((c) => c.id === selectedCreamId);
      const eggObj = product.cupcake_variants.egg_options?.find((e) => e.id === selectedCupcakeEggId);
      const creamName = creamObj?.name || selectedCreamId;
      const eggName = eggObj?.name || selectedCupcakeEggId;
      const comboLabel = `${creamName} + ${eggName}`;

      const chosenVariant = {
        id: `cupcake-${selectedCreamId}-${selectedCupcakeEggId}`,
        size_weight: comboLabel,
        price: activeCupcakePrice,
        discount_price: null,
      };

      addToCart(product, chosenVariant, 1, {
        cream_type: creamName,
        egg_type: eggName,
        dietary: eggName,
        is_eggless: eggName.toLowerCase().includes('eggless'),
        selected_price: activeCupcakePrice,
        selected_weight_portion: comboLabel,
        product_type: 'cupcake',
      });
      return;
    }

    if (isThemeCake && hasFlavours && !selectedFlavour) {
      showToast('Please select a cake flavour first.', 'warning');
      return;
    }

    if (hasFlavours && selectedFlavour) {
      const flavorPrice = activeFlavourPrice !== null ? activeFlavourPrice : Number(displayPrice);
      const label = `${selectedFlavour.name} (${isEggless ? '100% Pure Eggless' : 'With Egg'})`;
      const chosenVariant = {
        id: `flavour-${selectedFlavour.id || selectedFlavour.name}-${isEggless ? 'eggless' : 'egg'}`,
        size_weight: product.weight || '1 Cake',
        price: flavorPrice,
        discount_price: null,
      };

      addToCart(product, chosenVariant, 1, {
        flavour: selectedFlavour.name,
        is_eggless: isEggless,
        dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
        selected_price: flavorPrice,
        selected_weight_portion: product.weight || '1 Cake',
        cake_theme: product.subcategory?.name || product.category?.name || 'Theme Cake',
      });
      return;
    }

    if (isBoth && orderMode === 'piece') {
      const chosenVariant = {
        id: `piece-${pieceCount}`,
        size_weight: `${pieceCount} ${pieceCount === 1 ? 'Piece' : 'Pieces'}`,
        price: piecePrice,
        discount_price: null,
      };

      addToCart(product, chosenVariant, pieceCount, {
        is_eggless: isEggless,
        dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
        selected_weight_portion: `${pieceCount} ${pieceCount === 1 ? 'Piece' : 'Pieces'}`,
        order_type: 'piece',
      });
      return;
    }

    // Default weight variant
    const chosenVariant = activeStep.variant || {
      id: `default-${currentStepIndex}`,
      size_weight: activeStep.label,
      price: activeStep.price,
      discount_price: activeStep.strikePrice,
    };

    addToCart(product, chosenVariant, 1, {
      is_eggless: isEggless,
      dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
      selected_weight_portion: activeStep.label,
      order_type: 'weight',
    });
  };

  const handleOrderNow = () => {
    if (hasSnackVariants) {
      if (!selectedSnackUnit) {
        showToast('Please choose an order type (Piece or Weight).', 'warning');
        return;
      }
      if (selectedSnackEggless === null) {
        showToast('Please select Dietary Preference (Egg or Eggless).', 'warning');
        return;
      }
    }
    if (hasCupcakeVariants) {
      if (!selectedCreamId) {
        showToast('Please select a Cream Type (Step 1).', 'warning');
        return;
      }
      if (!selectedCupcakeEggId) {
        showToast('Please select Dietary Preference (Step 2).', 'warning');
        return;
      }
      if (!isCupcakeAvailable) {
        showToast('This cupcake combination is currently unavailable.', 'warning');
        return;
      }
    }
    if (isThemeCake && hasFlavours && !selectedFlavour) {
      showToast('Please select a cake flavour first.', 'warning');
      return;
    }
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-8">
      
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-square max-h-[360px] sm:max-h-[400px] w-full rounded-2xl overflow-hidden bg-cream shadow-xs border border-amber-100">
            <img
              src={activeImage || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {!['party-items', 'dry-fruits', 'chocolates'].includes(product.category?.slug) && (
              <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-chocolate text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 border border-amber-200">
                <span className={`w-2 h-2 rounded-full ${isEggless ? 'bg-emerald-600' : 'bg-amber-700'}`} />
                <span>{isEggless ? '100% Pure Eggless' : 'With Egg (Classic)'}</span>
              </span>
            )}
          </div>

          {/* Thumbnails if multiple images exist */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
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
        <div className="lg:col-span-7 space-y-3.5">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">5.0</span>
              <span className="text-xs text-slate-400">({product.approved_reviews?.length || 12} reviews)</span>
            </div>

            <h1 className="font-serif text-xl sm:text-2xl font-bold text-chocolate leading-tight">
              {product.name}
            </h1>

            {product.sku && (
              <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                SKU: {product.sku}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="py-2.5 px-3.5 bg-amber-50/60 rounded-xl border border-amber-100 flex items-baseline gap-2.5">
            {hasSnackVariants && !selectedSnackUnit ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 py-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="text-sm sm:text-base font-bold text-amber-950">
                    👉 Step 1: Choose Order Type (Piece or Weight)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full w-fit">
                  Select option below
                </span>
              </div>
            ) : hasSnackVariants && selectedSnackEggless === null ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 py-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-sm sm:text-base font-bold text-emerald-950">
                    👉 Step 2: Choose Dietary Preference (Egg or Eggless)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full w-fit">
                  Price revealed upon selection
                </span>
              </div>
            ) : hasCupcakeVariants && activeCupcakePrice === null ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 py-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-amber-950">
                    {!selectedCreamId ? '👉 Step 1: Choose Cream Option' : '👉 Step 2: Choose Dietary Preference'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full w-fit">
                  Price revealed upon selection
                </span>
              </div>
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-extrabold text-chocolate">
                  ₹{Number(hasSnackVariants ? activeSnackPrice : hasCupcakeVariants ? activeCupcakePrice : displayPrice).toLocaleString('en-IN')}
                </span>
                {!hasSnackVariants && !hasCupcakeVariants && displayStrikePrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{Number(displayStrikePrice).toLocaleString('en-IN')}
                  </span>
                )}
                {hasCupcakeVariants && !isCupcakeAvailable && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    Out of Stock
                  </span>
                )}
                <span className="text-[10px] sm:text-xs text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full ml-auto">
                  Inclusive of GST
                </span>
              </>
            )}
          </div>

          {/* SNACK FLEXIBLE PRICING COMPONENT (UNIT TYPE & EGG/EGGLESS) */}
          {hasSnackVariants ? (
            <div className="space-y-4">
              {/* If snack has BOTH Piece and Weight: Step 1 Selector */}
              {product.snack_variants.pricing_type === 'both' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                      <span>1. SELECT ORDER TYPE:</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                        Step 1
                      </span>
                    </label>
                    {selectedSnackUnit && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Piece Card */}
                    <button
                      type="button"
                      onClick={() => handleSelectSnackUnit('piece')}
                      className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedSnackUnit === 'piece'
                          ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30 shadow-xs font-bold'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedSnackUnit === 'piece' ? 'border-amber-600' : 'border-slate-300'
                      }`}>
                        {selectedSnackUnit === 'piece' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">Order by Piece</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            1 Pc
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                          Single snack portion
                        </div>
                      </div>
                    </button>

                    {/* Weight Card */}
                    <button
                      type="button"
                      onClick={() => handleSelectSnackUnit('weight')}
                      className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedSnackUnit === 'weight'
                          ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30 shadow-xs font-bold'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedSnackUnit === 'weight' ? 'border-amber-600' : 'border-slate-300'
                      }`}>
                        {selectedSnackUnit === 'weight' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">Order by Weight</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            {product.snack_variants.weight?.value || 'Portion'} ({product.snack_variants.weight?.unit || 'grams'})
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                          Packaged weight portion
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* SINGLE PRICING TYPE BANNER (PIECE ONLY OR WEIGHT ONLY) */
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {product.snack_variants.pricing_type === 'piece' ? '🍕' : '⚖️'}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-chocolate">
                        {product.snack_variants.pricing_type === 'piece'
                          ? 'Pricing: Sold by Piece'
                          : `Pricing: Sold by Weight (${product.snack_variants.weight?.value || ''} ${product.snack_variants.weight?.unit || 'grams'})`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {product.snack_variants.pricing_type === 'piece'
                          ? 'Single unit portion pricing'
                          : 'Standard packaged weight pricing'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    {product.snack_variants.pricing_type === 'piece' ? 'Unit: Piece' : `Unit: ${product.snack_variants.weight?.unit || 'grams'}`}
                  </span>
                </div>
              )}

              {/* Step 2: Egg vs Eggless Dietary Selector */}
              {selectedSnackUnit && (
                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1e4d4f] flex items-center gap-1.5">
                      <span>{product.snack_variants.pricing_type === 'both' ? '2. DIETARY PREFERENCE:' : 'DIETARY PREFERENCE:'}</span>
                      {product.snack_variants.pricing_type === 'both' && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                          Step 2
                        </span>
                      )}
                    </label>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0d8a56] bg-[#e6f9f0] border border-[#76e0a9] px-3 py-0.5 rounded-full">
                      Prepared Fresh
                    </span>
                  </div>

                  {(() => {
                    const activeUnitData = selectedSnackUnit === 'piece'
                      ? product.snack_variants.piece
                      : product.snack_variants.weight;
                    const eggPrice = activeUnitData?.egg_price !== undefined ? Number(activeUnitData.egg_price) : null;
                    const egglessPrice = activeUnitData?.eggless_price !== undefined ? Number(activeUnitData.eggless_price) : null;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {/* 100% Pure Eggless Option */}
                        <button
                          type="button"
                          onClick={() => handleSelectSnackDietary(true)}
                          className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            selectedSnackEggless === true
                              ? 'border-[#059669] bg-white ring-2 ring-[#059669]/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedSnackEggless === true ? 'border-[#059669]' : 'border-slate-300'
                          }`}>
                            {selectedSnackEggless === true && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">100% Pure Eggless</span>
                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded bg-[#dcfce7] text-[#15803d]">
                                  Veg
                                </span>
                              </div>
                              {egglessPrice !== null && (
                                <span className="text-xs font-bold text-chocolate">
                                  ₹{egglessPrice}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                              Pure vegetarian preparation
                            </div>
                          </div>
                        </button>

                        {/* With Egg Option */}
                        <button
                          type="button"
                          onClick={() => handleSelectSnackDietary(false)}
                          className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            selectedSnackEggless === false
                              ? 'border-[#b45309] bg-white ring-2 ring-[#b45309]/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedSnackEggless === false ? 'border-[#b45309]' : 'border-slate-300'
                          }`}>
                            {selectedSnackEggless === false && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#b45309]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">With Egg</span>
                                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded bg-[#fef3c7] text-[#92400e]">
                                  Classic
                                </span>
                              </div>
                              {eggPrice !== null && (
                                <span className="text-xs font-bold text-chocolate">
                                  ₹{eggPrice}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                              Classic recipe with egg
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : hasCupcakeVariants ? (
            <div className="space-y-4">
              {/* Step 1: Cream Type Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                    <span>1. SELECT CREAM TYPE:</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      Step 1
                    </span>
                  </label>
                  {selectedCreamId && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(product.cupcake_variants.cream_options || []).map((cream) => {
                    const isSelected = selectedCreamId === cream.id;
                    return (
                      <button
                        key={cream.id}
                        type="button"
                        onClick={() => handleSelectCreamOption(cream.id)}
                        className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30 shadow-xs font-bold'
                            : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {cream.name}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                            {cream.id.includes('without') ? 'Soft fluffy sponge without frosting' : 'Rich whipped cream topping'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Egg Type Selector (Appears Once Cream is Chosen, Matching Reference Image) */}
              {selectedCreamId && (
                <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1e4d4f] flex items-center gap-1.5">
                      <span>2. DIETARY PREFERENCE:</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                        Step 2
                      </span>
                    </label>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0d8a56] bg-[#e6f9f0] border border-[#76e0a9] px-3 py-0.5 rounded-full">
                      Baked Fresh for You
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {(product.cupcake_variants.egg_options || []).map((egg) => {
                      const isSelected = selectedCupcakeEggId === egg.id;
                      const isEgglessOption = egg.id.includes('eggless') || egg.name.toLowerCase().includes('eggless') || egg.name.toLowerCase().includes('veg');
                      
                      const matrixCombo = (product.cupcake_variants.matrix || []).find(
                        (m) => m.cream_id === selectedCreamId && m.egg_id === egg.id
                      );
                      const comboPrice = matrixCombo ? Number(matrixCombo.price) : null;
                      const isAvailable = matrixCombo ? matrixCombo.is_available !== false : true;

                      return (
                        <button
                          key={egg.id}
                          type="button"
                          onClick={() => handleSelectCupcakeEgg(egg.id)}
                          className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? isEgglessOption
                                ? 'border-[#059669] bg-white ring-1 ring-[#059669] shadow-xs'
                                : 'border-[#b45309] bg-white ring-1 ring-[#b45309] shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? isEgglessOption ? 'border-[#059669]' : 'border-[#b45309]'
                              : 'border-slate-300'
                          }`}>
                            {isSelected && (
                              <div className={`w-2.5 h-2.5 rounded-full ${isEgglessOption ? 'bg-[#059669]' : 'bg-[#b45309]'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">{egg.name}</span>
                                <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded ${
                                  isEgglessOption
                                    ? 'bg-[#dcfce7] text-[#15803d]'
                                    : 'bg-[#fef3c7] text-[#92400e]'
                                }`}>
                                  {egg.badge || (isEgglessOption ? 'Veg' : 'Classic')}
                                </span>
                              </div>
                              {comboPrice !== null && (
                                <span className="text-xs font-bold text-chocolate">
                                  ₹{comboPrice}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                              {isEgglessOption ? 'Pure vegetarian dairy sponge' : 'Classic bakery sponge'}
                            </div>
                            {!isAvailable && (
                              <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                                Currently Out of Stock
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : isThemeCake && hasFlavours ? (
            <div className="space-y-3">
              {/* Step 1: Flavour Dropdown (Flavours Only, No Prices, No Icons) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Select Flavour:
                </label>
                <select
                  value={selectedFlavour?.id || selectedFlavour?.name || ''}
                  onChange={(e) => {
                    const found = product.flavours.find(
                      (f) => String(f.id) === e.target.value || f.name === e.target.value
                    );
                    setSelectedFlavour(found || null);
                  }}
                  className="w-full text-xs sm:text-sm font-medium py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 min-h-[42px] cursor-pointer"
                >
                  <option value="" disabled>-- Select a Flavour --</option>
                  {product.flavours.map((flv, idx) => (
                    <option key={flv.id || idx} value={flv.id || flv.name}>
                      {flv.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Egg/Eggless Selector (Appears Once Flavour is Chosen, Matching Reference Image) */}
              {selectedFlavour && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1e4d4f]">
                      DIETARY PREFERENCE:
                    </label>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0d8a56] bg-[#e6f9f0] border border-[#76e0a9] px-3 py-0.5 rounded-full">
                      Baked Fresh for You
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {/* 100% Pure Eggless */}
                    <button
                      type="button"
                      onClick={() => setIsEggless(true)}
                      className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isEggless
                          ? 'border-[#059669] bg-white ring-1 ring-[#059669] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isEggless ? 'border-[#059669]' : 'border-slate-300'
                      }`}>
                        {isEggless && <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">100% Pure Eggless</span>
                          <span className="text-[10px] sm:text-[11px] bg-[#dcfce7] text-[#15803d] font-bold px-1.5 py-0.2 rounded">
                            Veg
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Pure vegetarian dairy sponge</div>
                      </div>
                    </button>

                    {/* With Egg */}
                    <button
                      type="button"
                      onClick={() => setIsEggless(false)}
                      className={`py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        !isEggless
                          ? 'border-[#b45309] bg-white ring-1 ring-[#b45309] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        !isEggless ? 'border-[#b45309]' : 'border-[#b45309]/50'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-[#b45309] ${!isEggless ? 'opacity-100' : 'opacity-40'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">With Egg</span>
                          <span className="text-[10px] sm:text-[11px] bg-[#fef3c7] text-[#92400e] font-bold px-1.5 py-0.2 rounded">
                            Classic
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Classic bakery sponge</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* FLAVOR SELECTION (FOR NON-THEME CAKES WITH FLAVOUR MATRIX) */}
              {hasFlavours && (
                <div className="space-y-2.5 p-3 bg-gradient-to-br from-amber-50/90 to-orange-50/60 rounded-xl border border-amber-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                      Choose Cake Flavor:
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                      {product.flavours.length} Available Flavors
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {product.flavours.map((flv, idx) => {
                      const isSelected = (selectedFlavour?.id && selectedFlavour.id === flv.id) || selectedFlavour?.name === flv.name;
                      const currentFlvPrice = isEggless
                        ? (flv.eggless_price || product.eggless_price || flv.egg_price)
                        : (flv.egg_price || product.egg_price || flv.eggless_price);
                      return (
                        <button
                          key={flv.id || idx}
                          type="button"
                          onClick={() => setSelectedFlavour(flv)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 min-h-[42px] ${
                            isSelected
                              ? 'border-amber-600 bg-white shadow-xs ring-2 ring-amber-500/30'
                              : 'border-amber-200/70 bg-white/70 hover:bg-white hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs text-chocolate">{flv.name}</span>
                            {isSelected && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.2 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-amber-100/60 w-full">
                            <span>{isEggless ? 'Eggless:' : 'With Egg:'}</span>
                            <span className="font-bold text-chocolate">₹{Number(currentFlvPrice).toLocaleString('en-IN')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recipe / Dietary Selection (Eggless vs With Egg, hidden on party-items & dry-fruits) */}
              {!['party-items', 'dry-fruits', 'chocolates'].includes(product.category?.slug) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Dietary Preference:
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Baked Fresh for You
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEggless(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 min-h-[42px] ${
                        isEggless
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-chocolate flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <span>100% Pure Eggless</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">Veg</span>
                          </div>
                          {hasFlavours && selectedFlavour?.eggless_price && (
                            <span className="text-xs font-bold text-emerald-800">
                              ₹{Number(selectedFlavour.eggless_price).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">Pure vegetarian dairy sponge</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEggless(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 min-h-[42px] ${
                        !isEggless
                          ? 'border-amber-700 bg-amber-50/50 shadow-2xs ring-2 ring-amber-700/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-amber-700 border-2 border-white ring-1 ring-amber-700 shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-chocolate flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <span>With Egg</span>
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">Classic</span>
                          </div>
                          {hasFlavours && selectedFlavour?.egg_price && (
                            <span className="text-xs font-bold text-amber-900">
                              ₹{Number(selectedFlavour.egg_price).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">Classic bakery sponge</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SINGLE UNIFIED WEIGHT / PORTION SECTION WITH + / - STEPPER */}
          {!hasCupcakeVariants && !hasSnackVariants && (
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 p-4 sm:p-5 rounded-3xl border-2 border-amber-300/80 shadow-sm space-y-3.5">
            
            {/* If product supports Both: Render interactive Mode Switcher */}
            {isBoth && (
              <div className="flex items-center gap-1.5 p-1 bg-amber-100/70 rounded-xl border border-amber-300">
                <button
                  type="button"
                  onClick={() => setOrderMode('weight')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
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
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                      Select Pieces:
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                    ₹{piecePrice} / pc • {isUnlimited ? 'Unlimited' : `Max ${pieceLimit}`}
                  </span>
                </div>

                {/* Interactive Stepper Box for Pieces */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-amber-500 text-chocolate font-black text-xs sm:text-sm rounded-lg shadow-xs">
                        {pieceCount} {pieceCount === 1 ? 'Piece' : 'Pieces'}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-chocolate">
                        ₹{pieceCount * piecePrice}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        (₹{piecePrice} × {pieceCount})
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isUnlimited
                        ? 'Click the + button to add more pieces'
                        : `Click + or - to select between 1 and ${pieceLimit} pieces`}
                    </p>
                  </div>

                  {/* Stepper Buttons: [-] Current [+] */}
                  <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setPieceCount((prev) => Math.max(1, prev - 1))}
                      disabled={pieceCount <= 1}
                      className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                        pieceCount <= 1
                          ? 'opacity-30 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                      }`}
                      title="Decrease pieces"
                    >
                      -
                    </button>

                    <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5">
                      <div className="font-extrabold text-xs text-chocolate">{pieceCount} {pieceCount === 1 ? 'Piece' : 'Pieces'}</div>
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
                      className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer ${
                        !isUnlimited && pieceCount >= pieceLimit ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title={!isUnlimited && pieceCount >= pieceLimit ? `Max ${pieceLimit} pieces` : 'Add (+)'}
                    >
                      +
                    </button>
                  </div>
                </div>

                {!isUnlimited && pieceCount >= pieceLimit && (
                  <div className="text-[10px] text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Max bakery limit: <strong>{pieceLimit} pieces</strong>.</span>
                  </div>
                )}

                {/* Quick Piece Selector Chips */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5 flex-wrap gap-1.5">
                  <span>Quick Pick:</span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {[1, 2, 4, 6, 8, 10, 12, 16, 20]
                      .filter((val) => isUnlimited || val <= pieceLimit)
                      .slice(0, 6)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPieceCount(val)}
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                      {isPortion ? 'Portions / Pieces:' : 'Weight (Grams to Kgs):'}
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                    {isPortion
                      ? `Base: ${steps[0]?.label || '1 Pc'}`
                      : `Default: ${steps[0]?.label || '500g'}`}
                  </span>
                </div>

                {/* Interactive Stepper Box */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-amber-500 text-chocolate font-black text-xs sm:text-sm rounded-lg shadow-xs">
                        {activeStep.label}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-chocolate">
                        ₹{activeStep.price}
                      </span>
                      {activeStep.strikePrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{activeStep.strikePrice}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isPortion
                        ? 'Click + to scale portions'
                        : 'Click + to scale weight from grams to kilograms'}
                    </p>
                  </div>

                  {/* Stepper Buttons: [-] Current [+] */}
                  <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={handleDecreaseStep}
                      disabled={currentStepIndex <= 0}
                      className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                        currentStepIndex <= 0
                          ? 'opacity-30 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                      }`}
                      title={isPortion ? "Decrease portion" : "Decrease weight"}
                    >
                      -
                    </button>

                    <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5">
                      <div className="font-extrabold text-xs text-chocolate">{activeStep.label}</div>
                      <div className="text-[10px] font-bold text-amber-700">₹{activeStep.price}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncreaseStep}
                      disabled={currentStepIndex >= steps.length - 1}
                      className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer ${
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
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5">
                    <span>{isPortion ? 'Portion Scale:' : 'Scale:'}</span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {steps.map((s, idx) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
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
          )}

          {/* Action Buttons: Add to Cart, Order Now, Wishlist */}
          <div className="pt-1 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  (hasSnackVariants && (!selectedSnackUnit || selectedSnackEggless === null)) ||
                  (hasCupcakeVariants && (!selectedCreamId || !selectedCupcakeEggId || !isCupcakeAvailable))
                }
                className={`w-full flex items-center justify-center gap-2 font-bold text-xs sm:text-sm py-2.5 px-3.5 min-h-[42px] rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer ${
                  (hasSnackVariants && (!selectedSnackUnit || selectedSnackEggless === null)) ||
                  (hasCupcakeVariants && (!selectedCreamId || !selectedCupcakeEggId || !isCupcakeAvailable))
                    ? 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>
                  {hasSnackVariants
                    ? !selectedSnackUnit
                      ? 'Choose Order Type'
                      : selectedSnackEggless === null
                      ? 'Select Dietary Option'
                      : `Add to Cart (${selectedSnackUnit === 'piece' ? '1 Pc' : product.snack_variants.weight?.value || 'Weight'})`
                    : hasCupcakeVariants
                    ? !selectedCreamId || !selectedCupcakeEggId
                      ? 'Select Options to Add'
                      : !isCupcakeAvailable
                      ? 'Out of Stock'
                      : 'Add to Cart'
                    : `Add to Cart (${
                        isBoth && orderMode === 'piece'
                          ? `${pieceCount} ${pieceCount === 1 ? 'Pc' : 'Pcs'}`
                          : activeStep?.label || 'Item'
                      })`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleOrderNow}
                disabled={
                  (hasSnackVariants && (!selectedSnackUnit || selectedSnackEggless === null)) ||
                  (hasCupcakeVariants && (!selectedCreamId || !selectedCupcakeEggId || !isCupcakeAvailable))
                }
                className={`w-full flex items-center justify-center gap-2 font-bold text-xs sm:text-sm py-2.5 px-3.5 min-h-[42px] rounded-xl shadow-md transition-all active:scale-98 cursor-pointer ${
                  (hasSnackVariants && (!selectedSnackUnit || selectedSnackEggless === null)) ||
                  (hasCupcakeVariants && (!selectedCreamId || !selectedCupcakeEggId || !isCupcakeAvailable))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white hover:shadow-lg'
                }`}
              >
                <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>
                  {hasSnackVariants
                    ? activeSnackPrice !== null
                      ? `Order Now (₹${Number(activeSnackPrice).toLocaleString('en-IN')})`
                      : 'Order Now'
                    : hasCupcakeVariants
                    ? activeCupcakePrice !== null
                      ? `Order Now (₹${Number(activeCupcakePrice).toLocaleString('en-IN')})`
                      : 'Order Now'
                    : `Order Now (₹${Number(displayPrice || 0).toLocaleString('en-IN')})`}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-0.5 pt-0.5">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border transition-all cursor-pointer min-h-[38px] ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-rose-500 font-semibold'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-600' : ''}`} />
                <span>{isFavorited ? 'Saved' : 'Wishlist'}</span>
              </button>

              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                ✓ Baked Fresh on Order
              </span>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>45-60 Mins Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Freshly Baked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Quality Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Free Candle</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 pt-1.5">
            <h2 className="text-xs font-bold text-chocolate">About This Creation</h2>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
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
