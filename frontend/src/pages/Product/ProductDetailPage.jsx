import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import ProductCard from '../../components/UI/ProductCard';
import ProductCarousel from '../../components/UI/ProductCarousel';
import { formatImageUrl } from '../../utils/imageUrl';
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
  Scale,
  ArrowRight
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
  const [snackQuantity, setSnackQuantity] = useState(1);
  const [selectedDryFruitPackIndex, setSelectedDryFruitPackIndex] = useState(0);
  const [dryFruitPackCount, setDryFruitPackCount] = useState(1);
  const [cakeSaleMode, setCakeSaleMode] = useState('weight'); // 'weight' or 'piece'
  const [cakeSelectedKg, setCakeSelectedKg] = useState(0.5);
  const [cakeSelectedPieces, setCakeSelectedPieces] = useState(1);
  const [selectedFixedWeightIndex, setSelectedFixedWeightIndex] = useState(0);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedChocolatePackIndex, setSelectedChocolatePackIndex] = useState(0);
  const [chocolatePackCount, setChocolatePackCount] = useState(1);
  const [chocolatePieceCount, setChocolatePieceCount] = useState(1);
  const [chocolateSaleMode, setChocolateSaleMode] = useState('weight'); // 'weight' or 'piece'

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
          setSnackQuantity(1);
          setSelectedDryFruitPackIndex(0);
          setDryFruitPackCount(1);
          setOrderMode('weight');
          setSelectedCreamId(null);
          setSelectedCupcakeEggId(null);
          setSelectedFixedWeightIndex(0);
          setSelectedChocolatePackIndex(0);
          setChocolatePackCount(1);
          setChocolatePieceCount(1);
          const chType = p.chocolate_pricing_type || (Array.isArray(p.chocolate_pack_options) && p.chocolate_pack_options.length > 0 ? 'weight' : (p.sell_by_pieces ? 'piece' : 'weight'));
          setChocolateSaleMode(chType === 'piece' ? 'piece' : 'weight');

          if (p.sell_by_kg) {
            setCakeSaleMode('weight');
          } else if (p.sell_by_pieces) {
            setCakeSaleMode('piece');
          }
          const initKg = Number(p.kg_default) || Number(p.kg_step) || 0.5;
          setCakeSelectedKg(initKg);
          const initPcs = Number(p.piece_default) || Number(p.piece_step) || 1;
          setCakeSelectedPieces(initPcs);

          let activeShapesList = [];
          if (p.shapes) {
            let rawShapes = p.shapes;
            if (typeof rawShapes === 'string') {
              try { rawShapes = JSON.parse(rawShapes); } catch (e) { rawShapes = []; }
            }
            if (Array.isArray(rawShapes)) {
              activeShapesList = rawShapes.filter((s) => s && (s.is_active === true || s.is_active === 1 || s.is_active === '1' || s.is_active === 'true'));
            }
          }
          if (activeShapesList.length > 0) {
            const heartShape = activeShapesList.find(
              (s) => String(s.shape || s.name || s.id || '').toLowerCase().includes('heart')
            );
            const defaultShape = heartShape || activeShapesList[0];
            setSelectedShape(defaultShape);
            setIsEggless(false); // Default to Egg price on page load
            if (defaultShape.image) {
              setActiveImage(defaultShape.image);
            }
          } else {
            setSelectedShape(null);
          }

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

  const isDessert = Boolean(
    product?.category?.slug === 'dessert' ||
    product?.category_id === 3 ||
    product?.category?.name?.toLowerCase().includes('dessert') ||
    product?.subcategory?.category?.slug === 'dessert' ||
    product?.subcategory?.name?.toLowerCase().includes('dessert') ||
    (product?.dessert_min_quantity && Number(product.dessert_min_quantity) > 0)
  );

  const isDryFruit = Boolean(
    product?.category?.slug === 'dry-fruits' ||
    product?.category_id === 4 ||
    product?.category?.name?.toLowerCase().includes('dry fruit') ||
    product?.subcategory?.category?.slug === 'dry-fruits' ||
    product?.subcategory?.name?.toLowerCase().includes('dry fruit') ||
    (Array.isArray(product?.dry_fruit_pack_options) && product.dry_fruit_pack_options.length > 0)
  );

  const isChocolate = Boolean(
    product?.category?.slug === 'chocolates' ||
    product?.category_id === 5 ||
    product?.category?.name?.toLowerCase().includes('chocolate') ||
    product?.subcategory?.category?.slug === 'chocolates' ||
    product?.subcategory?.name?.toLowerCase().includes('chocolate') ||
    (Array.isArray(product?.chocolate_pack_options) && product.chocolate_pack_options.length > 0)
  );

  const chocolatePacks = useMemo(() => {
    let packs = product?.chocolate_pack_options;
    if (typeof packs === 'string') {
      try { packs = JSON.parse(packs); } catch (e) { packs = []; }
    }
    if (Array.isArray(packs)) {
      return packs
        .filter((p) => p && Number(p.weight) > 0 && Number(p.price) > 0)
        .map((p) => {
          const w = Number(p.weight);
          const u = String(p.unit || 'g').toLowerCase();
          return {
            weight: w,
            unit: u,
            label: p.label || `${Number.isInteger(w) ? w : w}${u}`,
            price: Number(p.price),
          };
        });
    }
    return [];
  }, [product]);

  const chocolatePricingType = product?.chocolate_pricing_type || (chocolatePacks.length > 0 ? (product?.sell_by_pieces ? 'both' : 'weight') : (product?.sell_by_pieces ? 'piece' : 'weight'));
  const hasChocolateWeight = chocolatePricingType === 'weight' || chocolatePricingType === 'both' || chocolatePacks.length > 0;
  const hasChocolatePieces = chocolatePricingType === 'piece' || chocolatePricingType === 'both' || Boolean(product?.sell_by_pieces);
  const chocolateHasBoth = hasChocolateWeight && hasChocolatePieces && chocolatePacks.length > 0;

  const activeChocolatePack = chocolatePacks[selectedChocolatePackIndex] || chocolatePacks[0] || null;
  const chocolatePieceUnitPrice = Number(product?.piece_price || product?.base_price || 50);

  const chocolateActivePrice = useMemo(() => {
    if (!isChocolate) return null;
    const effectiveMode = chocolateHasBoth ? chocolateSaleMode : (hasChocolateWeight && chocolatePacks.length > 0 ? 'weight' : 'piece');
    if (effectiveMode === 'weight' && activeChocolatePack) {
      return activeChocolatePack.price * chocolatePackCount;
    } else {
      return chocolatePieceCount * chocolatePieceUnitPrice;
    }
  }, [isChocolate, chocolateHasBoth, chocolateSaleMode, hasChocolateWeight, chocolatePacks, activeChocolatePack, chocolatePackCount, chocolatePieceCount, chocolatePieceUnitPrice]);

  const isCakesAndPastries = Boolean(
    product &&
    (product.sell_by_kg || product.sell_by_pieces || product.enable_fixed_weight_pricing) &&
    (
      product.category?.slug === 'cakes-pastries' ||
      product.category_id === 1 ||
      product.category?.name?.toLowerCase().includes('cakes & pastries') ||
      product.category?.name?.toLowerCase().includes('cakes and pastries') ||
      product.subcategory?.category?.slug === 'cakes-pastries' ||
      product.category?.slug === 'sweets' ||
      product.category_id === 9 ||
      product.category?.name?.toLowerCase().includes('sweet') ||
      product.subcategory?.category?.slug === 'sweets' ||
      product.sell_by_kg !== null
    )
  );

  const fixedWeightOptions = useMemo(() => {
    if (!product?.enable_fixed_weight_pricing) return [];
    let raw = product.fixed_weight_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    if (Array.isArray(raw)) {
      return raw.filter((opt) => opt && String(opt.weight || '').trim() !== '' && Number(opt.price) > 0);
    }
    return [];
  }, [product]);

  const hasFixedWeightPricing = Boolean(
    isCakesAndPastries &&
    product?.enable_fixed_weight_pricing &&
    fixedWeightOptions.length > 0
  );

  const cakeKgStep = Number(product?.kg_step) || 0.5;
  const cakeKgDefault = Number(product?.kg_default) || cakeKgStep;
  const cakeKgMax = Number(product?.kg_max) || 10;
  const cakeKgPrice = Number(product?.kg_price || product?.base_price) || 0;

  const cakePieceStep = Number(product?.piece_step) || 1;
  const cakePieceDefault = Number(product?.piece_default) || cakePieceStep;
  const cakePieceMax = Number(product?.piece_max) || 20;
  const cakePiecePrice = Number(product?.piece_price) || 0;

  const cakeHasKg = Boolean(product?.sell_by_kg);
  const cakeHasPieces = Boolean(product?.sell_by_pieces);
  const cakeHasBoth = cakeHasKg && cakeHasPieces;

  const activeShapes = useMemo(() => {
    if (!product?.shapes) return [];
    let raw = product.shapes;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    if (Array.isArray(raw)) {
      return raw.filter(
        (s) => s && (s.is_active === true || s.is_active === 1 || s.is_active === '1' || s.is_active === 'true')
      );
    }
    return [];
  }, [product]);

  useEffect(() => {
    if (activeShapes.length > 0 && (!selectedShape || !activeShapes.some((s) => (s.id && s.id === selectedShape.id) || (s.shape && s.shape === selectedShape.shape) || (s.name && s.name === selectedShape.name)))) {
      const heart = activeShapes.find(
        (s) => String(s.shape || s.name || s.id || '').toLowerCase().includes('heart')
      );
      const defaultShape = heart || activeShapes[0];
      setSelectedShape(defaultShape);
      if (defaultShape.image) {
        setActiveImage(defaultShape.image);
      }
    }
  }, [activeShapes]);

  // Exact admin price for selected shape based on Egg / Eggless toggle
  const selectedShapeEggPrice = useMemo(() => {
    if (!selectedShape) return 0;
    if (selectedShape.egg_price !== undefined && selectedShape.egg_price !== null && selectedShape.egg_price !== '') {
      return Number(selectedShape.egg_price);
    }
    return Number(selectedShape.price || 0);
  }, [selectedShape]);

  const selectedShapeEgglessPrice = useMemo(() => {
    if (!selectedShape) return 0;
    if (selectedShape.eggless_price !== undefined && selectedShape.eggless_price !== null && selectedShape.eggless_price !== '') {
      return Number(selectedShape.eggless_price);
    }
    return Number(selectedShape.price || 0);
  }, [selectedShape]);

  const selectedShapeActiveUnitPrice = useMemo(() => {
    return isEggless ? selectedShapeEgglessPrice : selectedShapeEggPrice;
  }, [isEggless, selectedShapeEgglessPrice, selectedShapeEggPrice]);

  const effectiveCakeKgPrice = useMemo(() => {
    if (selectedShapeActiveUnitPrice > 0) {
      return selectedShapeActiveUnitPrice;
    }
    // Fallbacks if no shape price exists
    if (isEggless && product?.eggless_price && Number(product.eggless_price) > 0) {
      return Number(product.eggless_price);
    }
    if (!isEggless && product?.egg_price && Number(product.egg_price) > 0) {
      return Number(product.egg_price);
    }
    return cakeKgPrice;
  }, [selectedShapeActiveUnitPrice, isEggless, product, cakeKgPrice]);

  const cakeActivePrice = useMemo(() => {
    if (!isCakesAndPastries) return null;
    const baseShapePrice = selectedShapeActiveUnitPrice > 0 ? selectedShapeActiveUnitPrice : null;

    if (hasFixedWeightPricing) {
      const activeOption = fixedWeightOptions[selectedFixedWeightIndex] || fixedWeightOptions[0];
      const optPrice = activeOption ? Number(activeOption.price) : 0;
      if (baseShapePrice !== null) {
        const baseOptPrice = Number(fixedWeightOptions[0]?.price) || baseShapePrice;
        if (baseOptPrice > 0 && selectedFixedWeightIndex > 0) {
          return Math.round((optPrice / baseOptPrice) * baseShapePrice);
        }
        return baseShapePrice;
      }
      return optPrice;
    }

    if (cakeSaleMode === 'weight') {
      return Math.round(cakeSelectedKg * effectiveCakeKgPrice);
    } else {
      const effectivePiecePrice = cakePiecePrice > 0 ? cakePiecePrice : (baseShapePrice !== null ? baseShapePrice : effectiveCakeKgPrice);
      return Math.round(cakeSelectedPieces * effectivePiecePrice);
    }
  }, [isCakesAndPastries, selectedShapeActiveUnitPrice, effectiveCakeKgPrice, hasFixedWeightPricing, fixedWeightOptions, selectedFixedWeightIndex, cakeSaleMode, cakeSelectedKg, cakeSelectedPieces, cakePiecePrice]);

  const isBoth = !isDessert && !isDryFruit && !isCakesAndPastries && Boolean(
    product?.portion_type === 'both' ||
    (product?.piece_price && Number(product.piece_price) > 0) ||
    (weightStr && (weightStr.includes('piece') || weightStr.includes('slice') || weightStr.includes('portion') || weightStr.includes('pcs')) && (weightStr.includes('g') || weightStr.includes('kg')))
  );

  // Check if product is sold purely by portions or weights
  const isPortion = !isDessert && !isDryFruit && !isCakesAndPastries && !isBoth && Boolean(
    product?.portion_type === 'portion' ||
    (weightStr && (weightStr.includes('piece') || weightStr.includes('slice') || weightStr.includes('portion')))
  );

  const isThemeCake = Boolean(
    product?.category?.slug === 'theme-cakes' ||
    product?.category_id === 8 ||
    product?.category?.name?.toLowerCase().includes('theme cake') ||
    product?.subcategory?.category?.slug === 'theme-cakes' ||
    product?.subcategory?.name?.toLowerCase().includes('theme') ||
    (product?.theme_cake_default_weight && Number(product.theme_cake_default_weight) > 0)
  );

  // Dry Fruit Discrete Admin-Defined Pack Options
  const dryFruitPacks = useMemo(() => {
    if (!product || !isDryFruit) return [];
    let raw = product.dry_fruit_pack_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((p) => ({
        weight: Number(p.weight),
        unit: String(p.unit || 'g').toLowerCase() === 'kg' ? 'kg' : 'g',
        label: p.label || `${p.weight}${p.unit || 'g'}`,
        price: Number(p.price),
      }));
    }
    const match = String(product.weight || '').match(/^(\d+(?:\.\d+)?)\s*(g|kg)?$/i);
    const w = match ? Number(match[1]) : 200;
    const u = match && match[2] ? match[2].toLowerCase() : (w <= 10 ? 'kg' : 'g');
    return [
      { weight: w, unit: u, label: `${w}${u}`, price: Number(product.discount_price || product.base_price || 150) }
    ];
  }, [product, isDryFruit]);

  const activeDryFruitPack = dryFruitPacks[selectedDryFruitPackIndex] || dryFruitPacks[0] || null;

  // Unified available steps (grams to kgs, portions, or both) - Defined before early returns
  const steps = useMemo(() => {
    if (!product || isDryFruit) return [];

    // Dessert Dedicated Dynamic Piece Quantity & Pricing Stepper (Strictly pieces, never kg or g)
    if (isDessert) {
      const minQty = Math.max(1, parseInt(product.dessert_min_quantity || product.piece_default || 1, 10));
      const stepSize = Math.max(1, parseInt(product.dessert_step_size || product.piece_step || 1, 10));
      const rawLimit = product.piece_limit !== null && product.piece_limit !== undefined
        ? Number(product.piece_limit)
        : (product.piece_max ? Number(product.piece_max) : (product.dessert_max_quantity ? Number(product.dessert_max_quantity) : 20));
      const adminLimit = Math.max(minQty, rawLimit > 0 ? rawLimit : 20);

      const pricePerPiece = product.piece_price && Number(product.piece_price) > 0
        ? Number(product.piece_price)
        : (Number(product.dessert_default_price) > 0 && minQty > 0
            ? Number(product.dessert_default_price) / minQty
            : Number(product.discount_price || product.base_price || 50));

      let customTiers = [];
      if (typeof product.dessert_price_tiers === 'string') {
        try {
          customTiers = JSON.parse(product.dessert_price_tiers);
        } catch (e) {
          customTiers = [];
        }
      } else if (Array.isArray(product.dessert_price_tiers)) {
        customTiers = product.dessert_price_tiers;
      }

      const dessertSteps = [];

      for (let currentQty = minQty; currentQty <= adminLimit; currentQty += stepSize) {
        const tier = (customTiers || []).find((t) => Number(t.quantity) === currentQty && Number(t.price) > 0);
        const calcPrice = tier ? Math.round(Number(tier.price)) : Math.round(pricePerPiece * currentQty);

        dessertSteps.push({
          label: `${currentQty} ${currentQty === 1 ? 'Piece' : 'Pieces'}`,
          shortLabel: `${currentQty} Pcs`,
          quantityNum: currentQty,
          price: calcPrice,
          strikePrice: null,
          isCustomTier: Boolean(tier),
        });
      }

      // Safety check: ensure at least minQty step exists
      if (dessertSteps.length === 0) {
        dessertSteps.push({
          label: `${minQty} ${minQty === 1 ? 'Piece' : 'Pieces'}`,
          shortLabel: `${minQty} Pcs`,
          quantityNum: minQty,
          price: Math.round(pricePerPiece * minQty),
          strikePrice: null,
          isCustomTier: false,
        });
      }

      return dessertSteps;
    }

    // Theme Cake Dedicated Dynamic Weight & Pricing Stepper
    if (isThemeCake) {
      const defWeight = Number(product.theme_cake_default_weight) > 0
        ? Number(product.theme_cake_default_weight)
        : (product.weight && !isNaN(parseFloat(product.weight)) && parseFloat(product.weight) >= 1 ? parseFloat(product.weight) : 5);
      const defPrice = Number(product.theme_cake_default_price) > 0
        ? Number(product.theme_cake_default_price)
        : Number(product.discount_price || product.base_price || 2000);
      const stepSize = Number(product.theme_cake_step_size) > 0
        ? Number(product.theme_cake_step_size)
        : 1;

      let customTiers = [];
      if (typeof product.theme_cake_price_tiers === 'string') {
        try {
          customTiers = JSON.parse(product.theme_cake_price_tiers);
        } catch (e) {
          customTiers = [];
        }
      } else if (Array.isArray(product.theme_cake_price_tiers)) {
        customTiers = product.theme_cake_price_tiers;
      }

      const maxTierWeight = (customTiers || []).reduce((max, t) => Math.max(max, Number(t.weight) || 0), 0);
      const stepsCount = Math.max(10, Math.ceil((maxTierWeight - defWeight) / stepSize) + 1);

      const pricePerKg = defWeight > 0 ? (defPrice / defWeight) : (defPrice / 5);
      const themeSteps = [];

      for (let i = 0; i < stepsCount; i++) {
        const currentWeight = Math.round((defWeight + i * stepSize) * 100) / 100;
        const tier = (customTiers || []).find((t) => Math.abs(Number(t.weight) - currentWeight) < 0.01 && Number(t.price) > 0);
        const calcPrice = tier ? Math.round(Number(tier.price)) : Math.round(pricePerKg * currentWeight);

        themeSteps.push({
          label: `${currentWeight}kg`,
          weightNum: currentWeight,
          price: calcPrice,
          strikePrice: null,
          isCustomTier: Boolean(tier),
        });
      }

      return themeSteps;
    }

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
  }, [product, isBoth, isPortion, isThemeCake, isDessert]);

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
    ? (activeSnackPrice !== null ? activeSnackPrice * snackQuantity : null)
    : hasCupcakeVariants
    ? activeCupcakePrice
    : isDryFruit
    ? (activeDryFruitPack ? activeDryFruitPack.price * dryFruitPackCount : currentPrice)
    : isChocolate
    ? chocolateActivePrice
    : isCakesAndPastries
    ? cakeActivePrice
    : isDessert
    ? currentPrice
    : isThemeCake
    ? currentPrice
    : hasFlavours && activeFlavourPrice !== null
    ? activeFlavourPrice
    : (isBoth && orderMode === 'piece' ? pieceCount * piecePrice : currentPrice);
  const displayStrikePrice = hasSnackVariants || hasCupcakeVariants || isDryFruit || isChocolate || isCakesAndPastries || (isBoth && orderMode === 'piece') ? null : strikePrice;

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

  const handleDecreaseCakeKg = () => {
    setCakeSelectedKg((prev) => {
      const next = Math.round((prev - cakeKgStep) * 10) / 10;
      return next < cakeKgDefault ? cakeKgDefault : next;
    });
  };

  const handleIncreaseCakeKg = () => {
    setCakeSelectedKg((prev) => {
      const next = Math.round((prev + cakeKgStep) * 10) / 10;
      return next > cakeKgMax ? cakeKgMax : next;
    });
  };

  const handleDecreaseCakePieces = () => {
    setCakeSelectedPieces((prev) => {
      const next = prev - cakePieceStep;
      return next < cakePieceDefault ? cakePieceDefault : next;
    });
  };

  const handleIncreaseCakePieces = () => {
    setCakeSelectedPieces((prev) => {
      const next = prev + cakePieceStep;
      return next > cakePieceMax ? cakePieceMax : next;
    });
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

      addToCart(product, chosenVariant, snackQuantity, {
        product_type: 'snack',
        unit_type: selectedSnackUnit,
        portion_label: portionLabel,
        is_eggless: selectedSnackEggless,
        dietary: dietaryLabel,
        selected_price: activeSnackPrice,
        selected_weight_portion: comboLabel,
        snack_quantity: snackQuantity,
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

    // THEME CAKE ADD-TO-CART (RESPECTS ADMIN BASE WEIGHT, DYNAMIC WEIGHT PRICING & FLAVOUR SELECTION)
    if (isThemeCake) {
      if (hasFlavours && !selectedFlavour) {
        showToast('Please select a cake flavour first.', 'warning');
        return;
      }

      const chosenVariant = {
        id: `theme-${product.id}-${activeStep.label}`,
        size_weight: activeStep.label,
        price: activeStep.price,
        discount_price: null,
      };

      addToCart(product, chosenVariant, 1, {
        flavour: selectedFlavour?.name || null,
        is_eggless: isEggless,
        dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
        selected_price: activeStep.price,
        selected_weight_portion: activeStep.label,
        order_type: 'weight',
        theme_cake_base_weight: Number(product.theme_cake_default_weight || 5),
        theme_cake_base_price: Number(product.theme_cake_default_price || product.base_price || 2000),
        cake_theme: product.subcategory?.name || product.category?.name || 'Theme Cake',
      });
      return;
    }

    // DESSERT ADD-TO-CART (RESPECTS ADMIN MIN PIECES & DYNAMIC PIECE PRICING - NO WEIGHT)
    if (isDessert) {
      const chosenVariant = {
        id: `dessert-${product.id}-${activeStep.quantityNum || activeStep.label}`,
        size_weight: activeStep.label,
        price: activeStep.price,
        discount_price: null,
      };

      addToCart(product, chosenVariant, 1, {
        product_type: 'dessert',
        selected_price: activeStep.price,
        selected_weight_portion: activeStep.label,
        dessert_quantity: activeStep.quantityNum || parseInt(activeStep.label, 10) || 2,
        order_type: 'piece',
      });
      return;
    }

    // DRY FRUIT ADD-TO-CART (DISCRETE PACK OPTIONS & PACK COUNT MULTIPLIER)
    if (isDryFruit) {
      if (!activeDryFruitPack) {
        showToast('Please select a valid pack option.', 'warning');
        return;
      }

      const packPrice = Number(activeDryFruitPack.price);
      const packCount = Math.max(1, parseInt(dryFruitPackCount, 10) || 1);
      const totalPrice = packPrice * packCount;
      const portionLabel = `${activeDryFruitPack.label} Pack`;

      const chosenVariant = {
        id: `dryfruit-${product.id}-${activeDryFruitPack.label}`,
        size_weight: portionLabel,
        price: packPrice,
        discount_price: null,
      };

      addToCart(product, chosenVariant, packCount, {
        product_type: 'dry_fruit',
        pack_size: activeDryFruitPack.weight,
        unit: activeDryFruitPack.unit,
        pack_label: activeDryFruitPack.label,
        price_per_pack: packPrice,
        number_of_packs: packCount,
        selected_price: totalPrice,
        selected_weight_portion: `${packCount} × ${activeDryFruitPack.label} Pack${packCount > 1 ? 's' : ''}`,
        order_type: 'pack',
      });
      return;
    }

    // CHOCOLATES ADD-TO-CART (DISCRETE WEIGHT PACKS OR PIECE COUNT)
    if (isChocolate) {
      const effectiveMode = chocolateHasBoth ? chocolateSaleMode : (hasChocolateWeight && chocolatePacks.length > 0 ? 'weight' : 'piece');

      if (effectiveMode === 'weight' && activeChocolatePack) {
        const packPrice = Number(activeChocolatePack.price);
        const packCount = Math.max(1, parseInt(chocolatePackCount, 10) || 1);
        const totalPrice = packPrice * packCount;
        const portionLabel = `${activeChocolatePack.label} Pack`;

        const chosenVariant = {
          id: `chocolate-${product.id}-${activeChocolatePack.label}`,
          size_weight: portionLabel,
          price: packPrice,
          discount_price: null,
        };

        addToCart(product, chosenVariant, packCount, {
          product_type: 'chocolate',
          pack_size: activeChocolatePack.weight,
          unit: activeChocolatePack.unit,
          pack_label: activeChocolatePack.label,
          price_per_pack: packPrice,
          number_of_packs: packCount,
          selected_price: totalPrice,
          selected_weight_portion: `${packCount} × ${activeChocolatePack.label} Pack${packCount > 1 ? 's' : ''}`,
          order_type: 'pack',
        });
        return;
      } else {
        const count = Math.max(1, parseInt(chocolatePieceCount, 10) || 1);
        const totalPrice = count * chocolatePieceUnitPrice;
        const portionLabel = `${count} ${count === 1 ? 'Piece' : 'Pieces'}`;

        const chosenVariant = {
          id: `chocolate-piece-${product.id}-${count}`,
          size_weight: portionLabel,
          price: chocolatePieceUnitPrice,
          discount_price: null,
        };

        addToCart(product, chosenVariant, count, {
          product_type: 'chocolate',
          piece_count: count,
          unit_price: chocolatePieceUnitPrice,
          selected_price: totalPrice,
          selected_weight_portion: portionLabel,
          order_type: 'piece',
        });
        return;
      }
    }

    // CAKES & PASTRIES ADD-TO-CART (FIXED WEIGHT PRICING OR WEIGHT / PIECES CUSTOM STEPPER)
    if (isCakesAndPastries) {
      const shapeLabel = selectedShape ? ` • ${selectedShape.name || selectedShape.shape}` : '';

      if (hasFixedWeightPricing) {
        const chosen = fixedWeightOptions[selectedFixedWeightIndex] || fixedWeightOptions[0];
        if (!chosen) {
          showToast('Please select a weight option.', 'warning');
          return;
        }
        const total = cakeActivePrice || Number(chosen.price);
        const baseLabel = String(chosen.weight).trim();
        const label = `${baseLabel}${shapeLabel}`;
        const chosenVariant = {
          id: `cake-fixed-${product.id}-${baseLabel}${selectedShape ? `-${selectedShape.shape}` : ''}`,
          size_weight: label,
          price: total,
          discount_price: null,
        };

        addToCart(product, chosenVariant, 1, {
          is_eggless: isEggless,
          dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
          selected_price: total,
          selected_weight_portion: label,
          order_type: 'fixed_weight',
          unit_price: total,
          quantity: 1,
          unit: 'fixed',
          shape: selectedShape ? (selectedShape.name || selectedShape.shape) : null,
          shape_price: effectiveCakeKgPrice,
          shape_egg_price: selectedShapeEggPrice,
          shape_eggless_price: selectedShapeEgglessPrice,
          shape_image: selectedShape?.image || null,
        });
        return;
      }

      if (cakeSaleMode === 'weight') {
        const total = cakeActivePrice || Math.round(cakeSelectedKg * effectiveCakeKgPrice);
        const baseLabel = `${cakeSelectedKg} kg`;
        const label = `${baseLabel}${shapeLabel}`;
        const chosenVariant = {
          id: `cake-kg-${product.id}-${cakeSelectedKg}${selectedShape ? `-${selectedShape.shape}` : ''}`,
          size_weight: label,
          price: total,
          discount_price: null,
        };

        addToCart(product, chosenVariant, 1, {
          is_eggless: isEggless,
          dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
          selected_price: total,
          selected_weight_portion: label,
          order_type: 'weight',
          unit_price: effectiveCakeKgPrice,
          quantity: cakeSelectedKg,
          unit: 'kg',
          shape: selectedShape ? (selectedShape.name || selectedShape.shape) : null,
          shape_price: effectiveCakeKgPrice,
          shape_egg_price: selectedShapeEggPrice,
          shape_eggless_price: selectedShapeEgglessPrice,
          shape_image: selectedShape?.image || null,
        });
        return;
      } else {
        const total = cakeActivePrice || Math.round(cakeSelectedPieces * cakePiecePrice);
        const baseLabel = `${cakeSelectedPieces} ${cakeSelectedPieces === 1 ? 'Piece' : 'Pieces'}`;
        const label = `${baseLabel}${shapeLabel}`;
        const chosenVariant = {
          id: `cake-pcs-${product.id}-${cakeSelectedPieces}${selectedShape ? `-${selectedShape.shape}` : ''}`,
          size_weight: label,
          price: total,
          discount_price: null,
        };

        addToCart(product, chosenVariant, 1, {
          is_eggless: isEggless,
          dietary: isEggless ? '100% Pure Eggless' : 'With Egg',
          selected_price: total,
          selected_weight_portion: label,
          order_type: 'piece',
          unit_price: cakePiecePrice,
          quantity: cakeSelectedPieces,
          unit: 'pcs',
          shape: selectedShape ? (selectedShape.name || selectedShape.shape) : null,
          shape_price: effectiveCakeKgPrice,
          shape_egg_price: selectedShapeEggPrice,
          shape_eggless_price: selectedShapeEgglessPrice,
          shape_image: selectedShape?.image || null,
        });
        return;
      }
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
      const res = await api.post('/reviews/submit', {
        product_id: product?.id,
        customer_name: reviewerName,
        rating: reviewerRating,
        comment: reviewerComment,
      });
      showToast('Thank you! Your review is now published on the website.', 'success');
      setShowReviewModal(false);

      if (res.data?.data) {
        setProduct((prev) => ({
          ...prev,
          approved_reviews: [res.data.data, ...(prev?.approved_reviews || [])],
        }));
      }

      setReviewerName('');
      setReviewerComment('');
      setReviewerRating(5);
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
              src={formatImageUrl(activeImage || product.image_url)}
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
                  <img src={formatImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
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

              {/* Step 3: Quantity Selector for Snacks */}
              {selectedSnackEggless !== null && (
                <div className="space-y-2 pt-2 border-t border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                      <span>3. CHOOSE QUANTITY:</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                        Step 3
                      </span>
                    </label>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {snackQuantity} {snackQuantity === 1 ? (selectedSnackUnit === 'piece' ? 'Piece' : 'Pack') : (selectedSnackUnit === 'piece' ? 'Pieces' : 'Packs')}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Total Price:</span>
                        <span className="text-lg sm:text-xl font-black text-chocolate font-mono">
                          ₹{((activeSnackPrice || 0) * snackQuantity).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          (₹{activeSnackPrice} each)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Use + or − to select how many you need to order.
                      </p>
                    </div>

                    {/* Stepper Buttons: [-] Current [+] */}
                    <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSnackQuantity((prev) => Math.max(1, prev - 1))}
                        disabled={snackQuantity <= 1}
                        className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                          snackQuantity <= 1
                            ? 'opacity-30 text-slate-400 cursor-not-allowed'
                            : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                        }`}
                        title="Decrease quantity"
                      >
                        −
                      </button>

                      <div className="min-w-[70px] text-center px-1.5">
                        <div className="font-extrabold text-sm text-chocolate">{snackQuantity}</div>
                        <div className="text-[10px] font-bold text-amber-700">₹{(activeSnackPrice || 0) * snackQuantity}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSnackQuantity((prev) => prev + 1)}
                        className="w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Add one more (+)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Pick Chips */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5 flex-wrap gap-1.5">
                    <span>Quick Quantity Pick:</span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((qtyVal) => (
                        <button
                          key={qtyVal}
                          type="button"
                          onClick={() => setSnackQuantity(qtyVal)}
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                            snackQuantity === qtyVal
                              ? 'bg-amber-500 text-chocolate shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'
                          }`}
                        >
                          {qtyVal} {selectedSnackUnit === 'piece' ? (qtyVal === 1 ? 'Pc' : 'Pcs') : 'pk'}
                        </button>
                      ))}
                    </div>
                  </div>
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
                          {isCakesAndPastries && selectedShapeActiveUnitPrice > 0 ? (
                            <span className="text-xs font-bold text-emerald-800 font-mono">
                              ₹{Number(selectedShapeEgglessPrice > 0 ? selectedShapeEgglessPrice : (selectedShape.price || 0)).toLocaleString('en-IN')}
                            </span>
                          ) : hasFlavours && selectedFlavour?.eggless_price ? (
                            <span className="text-xs font-bold text-emerald-800 font-mono">
                              ₹{Number(selectedFlavour.eggless_price).toLocaleString('en-IN')}
                            </span>
                          ) : null}
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
                          {isCakesAndPastries && selectedShapeActiveUnitPrice > 0 ? (
                            <span className="text-xs font-bold text-amber-900 font-mono">
                              ₹{Number(selectedShapeEggPrice > 0 ? selectedShapeEggPrice : (selectedShape.price || 0)).toLocaleString('en-IN')}
                            </span>
                          ) : hasFlavours && selectedFlavour?.egg_price ? (
                            <span className="text-xs font-bold text-amber-900 font-mono">
                              ₹{Number(selectedFlavour.egg_price).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-500">Classic bakery sponge</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* DRY FRUIT DISCRETE PACK SELECTOR & PACK COUNT MULTIPLIER */}
          {isDryFruit && !hasCupcakeVariants && !hasSnackVariants ? (
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 p-4 sm:p-5 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥜</span>
                  <div>
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950 block">
                      Choose Pack Size:
                    </label>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Select an admin-curated discrete pack size
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  {dryFruitPacks.length} Pack Option{dryFruitPacks.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Discrete Pack Selection Cards (Admin-defined packs ONLY - No continuous or auto-scaling) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {dryFruitPacks.map((pack, idx) => {
                  const isSelected = idx === selectedDryFruitPackIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDryFruitPackIndex(idx)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 min-h-[64px] ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-extrabold text-xs sm:text-sm text-emerald-950">
                          {pack.label}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full pt-1 border-t border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-medium">Fixed Pack</span>
                        <span className="font-black text-xs sm:text-sm text-emerald-800 font-mono">
                          ₹{pack.price}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pack Multiplier Stepper ([ - ] N Packs [ + ]) */}
              {activeDryFruitPack && (
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs font-mono">
                          {dryFruitPackCount} × {activeDryFruitPack.label} Pack{dryFruitPackCount > 1 ? 's' : ''}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-emerald-950 font-mono">
                          ₹{activeDryFruitPack.price * dryFruitPackCount}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (₹{activeDryFruitPack.price} × {dryFruitPackCount})
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Unit size stays <strong>{activeDryFruitPack.label}</strong>. Stepper adjusts the number of packs.
                      </p>
                    </div>

                    {/* Stepper Buttons: [-] Current [+] */}
                    <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setDryFruitPackCount((prev) => Math.max(1, prev - 1))}
                        disabled={dryFruitPackCount <= 1}
                        className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                          dryFruitPackCount <= 1
                            ? 'opacity-30 text-slate-400 cursor-not-allowed'
                            : 'bg-white hover:bg-emerald-100 text-emerald-900 shadow-xs cursor-pointer active:scale-95'
                        }`}
                        title="Decrease packs (min 1)"
                      >
                        -
                      </button>

                      <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5 font-mono">
                        <div className="font-extrabold text-xs text-emerald-950">
                          {dryFruitPackCount} {dryFruitPackCount === 1 ? 'Pack' : 'Packs'}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-700">
                          ₹{activeDryFruitPack.price * dryFruitPackCount}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDryFruitPackCount((prev) => prev + 1)}
                        className="w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Add pack (+)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Pack Count Presets */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-emerald-100 flex-wrap gap-1.5">
                    <span className="font-medium text-emerald-800">Quick Packs:</span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {[1, 2, 3, 5, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDryFruitPackCount(val)}
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer font-mono ${
                            val === dryFruitPackCount
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white border border-emerald-200 text-emerald-900 hover:border-emerald-400'
                          }`}
                        >
                          {val} {val === 1 ? 'Pack' : 'Packs'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isChocolate ? (
            /* CHOCOLATES PACKAGING & PIECE SELECTOR */
            <div className="bg-gradient-to-br from-amber-950/5 via-white to-amber-900/5 p-4 sm:p-5 rounded-3xl border-2 border-amber-800/40 shadow-sm space-y-4">
              {chocolateHasBoth && (
                <div className="flex items-center gap-1.5 p-1 bg-amber-100/70 rounded-xl border border-amber-300">
                  <button
                    type="button"
                    onClick={() => setChocolateSaleMode('weight')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
                      chocolateSaleMode === 'weight'
                        ? 'bg-amber-900 text-white shadow-xs'
                        : 'text-amber-950 hover:bg-white/60'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>By Weight (Packs)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChocolateSaleMode('piece')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px] ${
                      chocolateSaleMode === 'piece'
                        ? 'bg-amber-900 text-white shadow-xs'
                        : 'text-amber-950 hover:bg-white/60'
                    }`}
                  >
                    <span>🍬</span>
                    <span>By Piece Count</span>
                  </button>
                </div>
              )}

              {/* WEIGHT VARIANTS MODE */}
              {(!chocolateHasBoth ? hasChocolateWeight && chocolatePacks.length > 0 : chocolateSaleMode === 'weight') ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-800 animate-pulse" />
                      <label className="text-xs font-bold uppercase tracking-wider text-amber-950">
                        Select Pack Size:
                      </label>
                    </div>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      {chocolatePacks.length} Pack Option{chocolatePacks.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Discrete Pack Selection Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {chocolatePacks.map((pack, idx) => {
                      const isSelected = idx === selectedChocolatePackIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedChocolatePackIndex(idx)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 min-h-[64px] ${
                            isSelected
                              ? 'border-amber-800 bg-amber-100/60 ring-2 ring-amber-700/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/30'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-950">
                              {pack.label}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black bg-amber-800 text-white px-1.5 py-0.2 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between w-full pt-1 border-t border-amber-200/60">
                            <span className="text-[10px] text-slate-500 font-medium">Fixed Pack</span>
                            <span className="font-black text-xs sm:text-sm text-amber-900 font-mono">
                              ₹{pack.price}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pack Multiplier Stepper */}
                  {activeChocolatePack && (
                    <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-amber-800 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs font-mono">
                              {chocolatePackCount} × {activeChocolatePack.label} Pack{chocolatePackCount > 1 ? 's' : ''}
                            </span>
                            <span className="text-lg sm:text-xl font-black text-amber-950 font-mono">
                              ₹{activeChocolatePack.price * chocolatePackCount}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              (₹{activeChocolatePack.price} × {chocolatePackCount})
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800 font-medium">
                            Pack size stays <strong>{activeChocolatePack.label}</strong>. Stepper adjusts the number of packs.
                          </p>
                        </div>

                        {/* Stepper Buttons: [-] Current [+] */}
                        <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setChocolatePackCount((prev) => Math.max(1, prev - 1))}
                            disabled={chocolatePackCount <= 1}
                            className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                              chocolatePackCount <= 1
                                ? 'opacity-30 text-slate-400 cursor-not-allowed'
                                : 'bg-white hover:bg-amber-100 text-amber-900 shadow-xs cursor-pointer active:scale-95'
                            }`}
                            title="Decrease packs (min 1)"
                          >
                            -
                          </button>

                          <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5 font-mono">
                            <div className="font-extrabold text-xs text-amber-950">
                              {chocolatePackCount} {chocolatePackCount === 1 ? 'Pack' : 'Packs'}
                            </div>
                            <div className="text-[10px] font-bold text-amber-800">
                              ₹{activeChocolatePack.price * chocolatePackCount}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setChocolatePackCount((prev) => prev + 1)}
                            className="w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="Add pack (+)"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Quick Pack Presets */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-100 flex-wrap gap-1.5">
                        <span className="font-medium text-amber-900">Quick Packs:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {[1, 2, 3, 5, 10].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setChocolatePackCount(val)}
                              className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer font-mono ${
                                val === chocolatePackCount
                                  ? 'bg-amber-800 text-white shadow-2xs'
                                  : 'bg-white border border-amber-200 text-amber-900 hover:border-amber-400'
                              }`}
                            >
                              {val} {val === 1 ? 'Pack' : 'Packs'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PIECE COUNT MODE: starts at 1, clicking + increments by 1 with admin default price */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-800 animate-pulse" />
                      <label className="text-xs font-bold uppercase tracking-wider text-amber-950">
                        Select Pieces:
                      </label>
                    </div>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      ₹{chocolatePieceUnitPrice} / Piece
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-amber-800 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs font-mono">
                            {chocolatePieceCount} {chocolatePieceCount === 1 ? 'Piece' : 'Pieces'}
                          </span>
                          <span className="text-lg sm:text-xl font-black text-amber-950 font-mono">
                            ₹{chocolatePieceCount * chocolatePieceUnitPrice}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            (₹{chocolatePieceUnitPrice}/pc × {chocolatePieceCount})
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium">
                          Click <strong>+</strong> to add more pieces (+1 per click)
                        </p>
                      </div>

                      {/* Stepper Buttons: [-] Current [+] */}
                      <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setChocolatePieceCount((prev) => Math.max(1, prev - 1))}
                          disabled={chocolatePieceCount <= 1}
                          className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                            chocolatePieceCount <= 1
                              ? 'opacity-30 text-slate-400 cursor-not-allowed'
                              : 'bg-white hover:bg-amber-100 text-amber-900 shadow-xs cursor-pointer active:scale-95'
                          }`}
                          title="Decrease pieces (-1)"
                        >
                          -
                        </button>

                        <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5 font-mono">
                          <div className="font-extrabold text-xs text-amber-950">
                            {chocolatePieceCount} {chocolatePieceCount === 1 ? 'Pc' : 'Pcs'}
                          </div>
                          <div className="text-[10px] font-bold text-amber-800">
                            ₹{chocolatePieceCount * chocolatePieceUnitPrice}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setChocolatePieceCount((prev) => prev + 1)}
                          className="w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Add piece (+1)"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Piece Presets */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-100 flex-wrap gap-1.5">
                      <span className="font-medium text-amber-900">Quick Quantity:</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {[1, 2, 4, 6, 12, 24].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setChocolatePieceCount(val)}
                            className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer font-mono ${
                              val === chocolatePieceCount
                                ? 'bg-amber-800 text-white shadow-2xs'
                                : 'bg-white border border-amber-200 text-amber-900 hover:border-amber-400'
                            }`}
                          >
                            {val} {val === 1 ? 'Pc' : 'Pcs'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : !hasCupcakeVariants && !hasSnackVariants && !isChocolate && (
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

            {isCakesAndPastries ? (
              <div className="space-y-4">
                {/* CAKE SHAPES SELECTOR (Round, Heart, Square) - Active only */}
                {activeShapes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                        <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                          Select Cake Shape:
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-pink-800 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
                        {selectedShape ? selectedShape.name || selectedShape.shape : 'Select Shape'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {activeShapes.map((sItem) => {
                        const isShapeSelected = (selectedShape?.id && selectedShape.id === sItem.id) ||
                          (selectedShape?.shape && selectedShape.shape === sItem.shape) ||
                          (selectedShape?.name && selectedShape.name === sItem.name);
                        const shapeLower = String(sItem.shape || sItem.name || '').toLowerCase();
                        const icon = shapeLower.includes('heart') ? '💖' : shapeLower.includes('round') ? '⚪' : shapeLower.includes('square') ? '⬛' : '🎂';
                        
                        // Exact admin price for current egg/eggless state
                        const itemPrice = isEggless
                          ? (sItem.eggless_price !== undefined && sItem.eggless_price !== null && sItem.eggless_price !== '' ? Number(sItem.eggless_price) : Number(sItem.price || 0))
                          : (sItem.egg_price !== undefined && sItem.egg_price !== null && sItem.egg_price !== '' ? Number(sItem.egg_price) : Number(sItem.price || 0));

                        return (
                          <button
                            key={sItem.id || sItem.shape || sItem.name}
                            type="button"
                            onClick={() => {
                              setSelectedShape(sItem);
                              if (sItem.image) {
                                setActiveImage(sItem.image);
                              }
                            }}
                            className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center gap-1 min-h-[74px] ${
                              isShapeSelected
                                ? 'border-pink-600 bg-pink-50/90 shadow-xs ring-2 ring-pink-500/20'
                                : 'border-slate-200 hover:border-pink-300 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xl">{icon}</span>
                            <span className={`text-xs font-bold ${isShapeSelected ? 'text-pink-900 font-black' : 'text-slate-700'}`}>
                              {sItem.name || sItem.shape}
                            </span>
                            {itemPrice > 0 && (
                              <span className="text-[11px] font-black text-chocolate font-mono">
                                ₹{itemPrice.toLocaleString('en-IN')} <span className="text-[9px] font-medium text-slate-500">({isEggless ? 'Veg' : 'Egg'})</span>
                              </span>
                            )}
                            {isShapeSelected && (
                              <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 absolute top-2 right-2">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasFixedWeightPricing ? (
                  /* FIXED WEIGHT PRICING PRESET SELECTION (NO +/- BUTTONS, ONLY ADMIN PRESETS) */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                          Select Weight Option:
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                        Fixed Weight Pricing
                      </span>
                    </div>

                    {/* Preset Weight Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {fixedWeightOptions.map((opt, idx) => {
                        const isSelected = idx === selectedFixedWeightIndex;
                        return (
                          <button
                            key={`fixed-opt-${idx}-${opt.weight}`}
                            type="button"
                            onClick={() => setSelectedFixedWeightIndex(idx)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[72px] ${
                              isSelected
                                ? 'border-chocolate bg-amber-50/80 shadow-xs ring-2 ring-chocolate/20'
                                : 'border-slate-200 hover:border-amber-300 bg-white hover:bg-slate-50/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 w-full mb-1">
                              <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-chocolate font-black' : 'text-slate-800'}`}>
                                {opt.weight}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-chocolate text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="text-sm sm:text-base font-black text-chocolate font-mono">
                              ₹{Number(opt.price).toLocaleString('en-IN')}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium italic">
                      Choose from the weight options above. Regular quantity adjustment is disabled for fixed weight pricing.
                    </p>
                  </div>
                ) : (
                  /* CAKES & PASTRIES SALE OPTIONS STEPPER (SELL BY KG / SELL BY PIECES) */
                  <>
                    {/* Mode Switcher: show only when both options are enabled */}
                    {cakeHasBoth && (
                      <div className="flex items-center gap-1.5 p-1 bg-amber-100/70 rounded-xl border border-amber-300">
                        <button
                          type="button"
                          onClick={() => setCakeSaleMode('weight')}
                          className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[38px] ${
                            cakeSaleMode === 'weight'
                              ? 'bg-chocolate text-white shadow-xs'
                              : 'text-amber-950 hover:bg-white/60'
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>By Weight</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCakeSaleMode('piece')}
                          className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[38px] ${
                            cakeSaleMode === 'piece'
                              ? 'bg-chocolate text-white shadow-xs'
                              : 'text-amber-950 hover:bg-white/60'
                          }`}
                        >
                          <span>🍰</span>
                          <span>By Pieces</span>
                        </button>
                      </div>
                    )}

                    {/* Weight Stepper Mode */}
                    {(!cakeHasBoth ? cakeHasKg : cakeSaleMode === 'weight') ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                              Select Weight:
                            </label>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                            ₹{effectiveCakeKgPrice} / kg • Default: {cakeKgDefault} kg • Max: {cakeKgMax} kg
                          </span>
                        </div>

                        {/* Stepper Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 bg-chocolate text-white font-black text-xs sm:text-sm rounded-lg shadow-xs font-mono">
                                {cakeSelectedKg} kg
                              </span>
                              <span className="text-lg sm:text-xl font-black text-chocolate font-mono">
                                ₹{Math.round(cakeSelectedKg * effectiveCakeKgPrice).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                (₹{effectiveCakeKgPrice}/kg × {cakeSelectedKg} kg)
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Starts at {cakeKgDefault} kg in steps of +{cakeKgStep} kg up to {cakeKgMax} kg
                            </p>
                          </div>

                          {/* Stepper Buttons: [ - ] Current [ + ] */}
                          <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                            <button
                              type="button"
                              onClick={handleDecreaseCakeKg}
                              disabled={cakeSelectedKg <= cakeKgDefault}
                              className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                                cakeSelectedKg <= cakeKgDefault
                                  ? 'opacity-30 text-slate-400 cursor-not-allowed'
                                  : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                              }`}
                              title={cakeSelectedKg <= cakeKgDefault ? `Default starting weight is ${cakeKgDefault} kg` : 'Decrease weight (-)'}
                            >
                              −
                            </button>

                            <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5 font-mono">
                              <div className="font-extrabold text-xs sm:text-sm text-chocolate">{cakeSelectedKg} kg</div>
                              <div className="text-[10px] font-bold text-amber-700">₹{Math.round(cakeSelectedKg * effectiveCakeKgPrice)}</div>
                            </div>

                            <button
                              type="button"
                              onClick={handleIncreaseCakeKg}
                              disabled={cakeSelectedKg >= cakeKgMax}
                              className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer ${
                                cakeSelectedKg >= cakeKgMax ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                              title={cakeSelectedKg >= cakeKgMax ? `Max weight limit is ${cakeKgMax} kg` : 'Add weight (+)'}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {cakeSelectedKg >= cakeKgMax && (
                          <div className="text-[10px] text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Maximum order weight for this cake is <strong>{cakeKgMax} kg</strong>.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Piece Stepper Mode */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                              Select Pieces:
                            </label>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                            ₹{cakePiecePrice} / pc • Default: {cakePieceDefault} pcs • Max: {cakePieceMax} pcs
                          </span>
                        </div>

                        {/* Stepper Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 bg-chocolate text-white font-black text-xs sm:text-sm rounded-lg shadow-xs font-mono">
                                {cakeSelectedPieces} {cakeSelectedPieces === 1 ? 'Pc' : 'Pcs'}
                              </span>
                              <span className="text-lg sm:text-xl font-black text-chocolate font-mono">
                                ₹{Math.round(cakeSelectedPieces * cakePiecePrice).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                (₹{cakePiecePrice}/pc × {cakeSelectedPieces} pcs)
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Starts at {cakePieceDefault} pcs in steps of +{cakePieceStep} up to {cakePieceMax} pcs
                            </p>
                          </div>

                          {/* Stepper Buttons: [ - ] Current [ + ] */}
                          <div className="flex items-center self-start sm:self-auto gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl shadow-2xs">
                            <button
                              type="button"
                              onClick={handleDecreaseCakePieces}
                              disabled={cakeSelectedPieces <= cakePieceDefault}
                              className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg transition-all ${
                                cakeSelectedPieces <= cakePieceDefault
                                  ? 'opacity-30 text-slate-400 cursor-not-allowed'
                                  : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                              }`}
                              title={cakeSelectedPieces <= cakePieceDefault ? `Default starting quantity is ${cakePieceDefault} pieces` : 'Decrease pieces (-)'}
                            >
                              −
                            </button>

                            <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5 font-mono">
                              <div className="font-extrabold text-xs sm:text-sm text-chocolate">{cakeSelectedPieces} pcs</div>
                              <div className="text-[10px] font-bold text-amber-700">₹{Math.round(cakeSelectedPieces * cakePiecePrice)}</div>
                            </div>

                            <button
                              type="button"
                              onClick={handleIncreaseCakePieces}
                              disabled={cakeSelectedPieces >= cakePieceMax}
                              className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate shadow-xs transition-all active:scale-95 cursor-pointer ${
                                cakeSelectedPieces >= cakePieceMax ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                              title={cakeSelectedPieces >= cakePieceMax ? `Max pieces limit is ${cakePieceMax} pcs` : 'Add pieces (+)'}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {cakeSelectedPieces >= cakePieceMax && (
                          <div className="text-[10px] text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Maximum pieces for this cake is <strong>{cakePieceMax} pcs</strong>.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : isBoth && orderMode === 'piece' ? (
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
              /* WEIGHT (OR REGULAR PORTION / DESSERT PIECE) STEPPER */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <label className="text-xs font-bold uppercase tracking-wider text-chocolate">
                      {isDessert
                        ? `Quantity (Min Base: ${steps[0]?.label || '2 Pieces'}):`
                        : isThemeCake
                        ? `Weight (Min Base: ${steps[0]?.label || '5kg'}):`
                        : isPortion
                        ? 'Portions / Pieces:'
                        : 'Weight (Grams to Kgs):'}
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDessert
                      ? 'text-rose-800 bg-rose-100/90 border-rose-300'
                      : 'text-amber-800 bg-amber-100/90 border-amber-300'
                  }`}>
                    {isDessert
                      ? `Default: ${steps[0]?.label || '1 Piece'} • Step: +${product.dessert_step_size || product.piece_step || 1} • Max: ${steps[steps.length - 1]?.label || '20 Pieces'}`
                      : isThemeCake
                      ? `Starting Base: ${steps[0]?.label || '5kg'} @ ₹${steps[0]?.price}`
                      : isPortion
                      ? `Base: ${steps[0]?.label || '1 Pc'}`
                      : `Default: ${steps[0]?.label || '500g'}`}
                  </span>
                </div>

                {isDessert && (
                  <div className="text-[11px] text-rose-950 bg-rose-100/90 border border-rose-300/90 p-2.5 rounded-xl flex items-center gap-2">
                    <span className="text-base">🍮</span>
                    <span>
                      <strong>Dessert Order:</strong> Handcrafted strictly in <strong>Pieces</strong>. Starts at default <strong>{steps[0]?.label || '1 Piece'}</strong>, scaling by <strong>+{product.dessert_step_size || product.piece_step || 1} pcs</strong> up to <strong>{steps[steps.length - 1]?.label || '20 Pieces'}</strong>.
                    </span>
                  </div>
                )}

                {isThemeCake && (
                  <div className="text-[11px] text-amber-900 bg-amber-100/80 border border-amber-300/80 p-2.5 rounded-xl flex items-center gap-2">
                    <span className="text-base">🎂</span>
                    <span>
                      <strong>Theme Cake Base Weight:</strong> Handcrafted starting from a minimum of <strong>{steps[0]?.label || '5kg'}</strong>. Weights below {steps[0]?.label || '5kg'} are not available for this cake design.
                    </span>
                  </div>
                )}

                {/* Interactive Stepper Box */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border shadow-2xs ${
                  isDessert ? 'border-rose-200' : 'border-amber-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 font-black text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-1 ${
                        isDessert ? 'bg-rose-500 text-white' : 'bg-amber-500 text-chocolate'
                      }`}>
                        <span>{activeStep.label}</span>
                        {activeStep.isCustomTier && (
                          <span className="text-[9px] bg-white text-rose-900 font-bold px-1 rounded">Special Tier</span>
                        )}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-chocolate">
                        ₹{Number(activeStep.price).toLocaleString('en-IN')}
                      </span>
                      {activeStep.strikePrice && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{Number(activeStep.strikePrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isDessert
                        ? `Starts at default ${steps[0]?.label || '1 Piece'} in steps of +${product.dessert_step_size || product.piece_step || 1} up to ${steps[steps.length - 1]?.label || '20 Pieces'}.`
                        : isThemeCake
                        ? `Starts at minimum ${steps[0]?.label || '5kg'}. Click + to scale weight upwards in ${product.theme_cake_step_size || 1}kg increments.`
                        : isPortion
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
                          : isDessert
                          ? 'bg-white hover:bg-rose-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                          : 'bg-white hover:bg-amber-100 text-chocolate shadow-xs cursor-pointer active:scale-95'
                      }`}
                      title={
                        isDessert
                          ? (currentStepIndex <= 0 ? `Default starting quantity is ${steps[0]?.label || '1 Piece'}` : `Decrease ${product.dessert_step_size || product.piece_step || 1} pcs (-)`)
                          : isThemeCake
                          ? `Minimum weight locked to ${steps[0]?.label || '5kg'}`
                          : isPortion
                          ? "Decrease portion"
                          : "Decrease weight"
                      }
                    >
                      -
                    </button>

                    <div className="min-w-[75px] sm:min-w-[85px] text-center px-1.5">
                      <div className="font-extrabold text-xs text-chocolate">{activeStep.label}</div>
                      <div className={`text-[10px] font-bold ${isDessert ? 'text-rose-700' : 'text-amber-700'}`}>
                        ₹{Number(activeStep.price).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncreaseStep}
                      disabled={currentStepIndex >= steps.length - 1}
                      className={`w-9 h-9 min-h-[40px] flex items-center justify-center rounded-lg font-black text-lg shadow-xs transition-all active:scale-95 cursor-pointer ${
                        isDessert
                          ? 'bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate'
                      } ${
                        currentStepIndex >= steps.length - 1 ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title={
                        currentStepIndex >= steps.length - 1
                          ? (isDessert ? `Maximum order limit (${steps[steps.length - 1]?.label}) reached` : 'Maximum reached')
                          : isDessert ? `Add ${product.dessert_step_size || product.piece_step || 1} pcs (+)` : isPortion ? "Increase portion (+)" : "Increase weight (+)"
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {isDessert && currentStepIndex >= steps.length - 1 && (
                  <div className="text-[10px] text-rose-900 bg-rose-100/90 border border-rose-300 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Maximum order limit for this dessert is <strong>{steps[steps.length - 1]?.label}</strong>.</span>
                  </div>
                )}

                {/* Quick Step Indicators */}
                {steps.length > 1 && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5">
                    <span>
                      {isDessert
                        ? `Quantity Quick Pick (Min ${steps[0]?.label || '2 Pieces'}):`
                        : isThemeCake
                        ? `Weight Quick Pick (Min ${steps[0]?.label || '5kg'}):`
                        : isPortion
                        ? 'Portion Scale:'
                        : 'Scale:'}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {steps.slice(0, 8).map((s, idx) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                            idx === currentStepIndex
                              ? isDessert
                                ? 'bg-rose-500 text-white shadow-2xs'
                                : 'bg-amber-500 text-chocolate shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'
                          }`}
                        >
                          {s.shortLabel || s.label}
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
                      : `Add to Cart (${snackQuantity} ${selectedSnackUnit === 'piece' ? (snackQuantity === 1 ? 'Piece' : 'Pieces') : (snackQuantity === 1 ? 'Pack' : 'Packs')} • ₹${((activeSnackPrice || 0) * snackQuantity).toLocaleString('en-IN')})`
                    : hasCupcakeVariants
                    ? !selectedCreamId || !selectedCupcakeEggId
                      ? 'Select Options to Add'
                      : !isCupcakeAvailable
                      ? 'Out of Stock'
                      : 'Add to Cart'
                    : isDryFruit
                    ? `Add to Cart (${dryFruitPackCount} × ${activeDryFruitPack?.label || 'Pack'} • ₹${((activeDryFruitPack?.price || 0) * dryFruitPackCount).toLocaleString('en-IN')})`
                    : isChocolate
                    ? (chocolateHasBoth ? chocolateSaleMode : (hasChocolateWeight && chocolatePacks.length > 0 ? 'weight' : 'piece')) === 'weight'
                      ? `Add to Cart (${chocolatePackCount} × ${activeChocolatePack?.label || 'Pack'} • ₹${((activeChocolatePack?.price || 0) * chocolatePackCount).toLocaleString('en-IN')})`
                      : `Add to Cart (${chocolatePieceCount} ${chocolatePieceCount === 1 ? 'Pc' : 'Pcs'} • ₹${((chocolatePieceUnitPrice || 0) * chocolatePieceCount).toLocaleString('en-IN')})`
                    : isCakesAndPastries
                    ? hasFixedWeightPricing
                      ? `Add to Cart (${fixedWeightOptions[selectedFixedWeightIndex]?.weight || ''}${selectedShape ? ` • ${selectedShape.name || selectedShape.shape}` : ''} • ₹${Number(cakeActivePrice || fixedWeightOptions[selectedFixedWeightIndex]?.price || 0).toLocaleString('en-IN')})`
                      : `Add to Cart (${cakeSaleMode === 'weight' ? `${cakeSelectedKg} kg` : `${cakeSelectedPieces} ${cakeSelectedPieces === 1 ? 'Pc' : 'Pcs'}`}${selectedShape ? ` • ${selectedShape.name || selectedShape.shape}` : ''} • ₹${(cakeActivePrice || 0).toLocaleString('en-IN')})`
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
                      ? `Order Now (${snackQuantity} ${selectedSnackUnit === 'piece' ? (snackQuantity === 1 ? 'Piece' : 'Pieces') : (snackQuantity === 1 ? 'Pack' : 'Packs')} • ₹${((activeSnackPrice || 0) * snackQuantity).toLocaleString('en-IN')})`
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

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline px-2 py-1"
            >
              <span>All Customer Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-chocolate bg-amber-100/70 hover:bg-amber-200/80 px-4 py-2 rounded-xl transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span>Write A Review</span>
            </button>
          </div>
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
