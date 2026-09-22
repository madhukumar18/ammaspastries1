import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatImageUrl } from '../../utils/imageUrl';

const ProductCard = ({ product, onAddToCart, onOrderNow }) => {
  const navigate = useNavigate();
  const { cart, addToCart, updateCartQuantity, removeFromCart, toggleWishlist, isInWishlist } = useApp();

  const isFavorited = isInWishlist(product.id);

  // Compute snack min starting price if applicable
  const sv = product.snack_variants;
  let snackStartingPrice = null;
  if (sv && sv.pricing_type) {
    const prices = [];
    if (sv.piece) {
      if (sv.piece.egg_price) prices.push(Number(sv.piece.egg_price));
      if (sv.piece.eggless_price) prices.push(Number(sv.piece.eggless_price));
    }
    if (sv.weight) {
      if (sv.weight.egg_price) prices.push(Number(sv.weight.egg_price));
      if (sv.weight.eggless_price) prices.push(Number(sv.weight.eggless_price));
    }
    if (prices.length > 0) {
      snackStartingPrice = Math.min(...prices);
    }
  }

  const isThemeCake = Boolean(
    product.category?.slug === 'theme-cakes' ||
    product.category_id === 8 ||
    product.category?.name?.toLowerCase().includes('theme cake') ||
    (product.theme_cake_default_weight && Number(product.theme_cake_default_weight) > 0)
  );

  const isDessert = Boolean(
    product.category?.slug === 'dessert' ||
    product.category_id === 3 ||
    product.category?.name?.toLowerCase().includes('dessert') ||
    (product.dessert_min_quantity && Number(product.dessert_min_quantity) > 0)
  );

  const isDryFruit = Boolean(
    product.category?.slug === 'dry-fruits' ||
    product.category_id === 4 ||
    product.category?.name?.toLowerCase().includes('dry fruit') ||
    (Array.isArray(product.dry_fruit_pack_options) && product.dry_fruit_pack_options.length > 0)
  );

  let dryFruitStartingPrice = null;
  let firstDryFruitPackLabel = null;
  if (isDryFruit) {
    let packs = product.dry_fruit_pack_options;
    if (typeof packs === 'string') {
      try { packs = JSON.parse(packs); } catch (e) { packs = []; }
    }
    if (Array.isArray(packs) && packs.length > 0) {
      const prices = packs.map((p) => Number(p.price)).filter((pr) => pr > 0);
      if (prices.length > 0) {
        dryFruitStartingPrice = Math.min(...prices);
      }
      firstDryFruitPackLabel = packs[0].label || `${packs[0].weight}${packs[0].unit || 'g'}`;
    }
  }

  const isChocolate = Boolean(
    product.category?.slug === 'chocolates' ||
    product.category_id === 5 ||
    product.category?.name?.toLowerCase().includes('chocolate') ||
    (Array.isArray(product.chocolate_pack_options) && product.chocolate_pack_options.length > 0) ||
    Boolean(product.chocolate_pricing_type)
  );

  let chocolateStartingPrice = null;
  let firstChocolatePackLabel = null;
  if (isChocolate) {
    let packs = product.chocolate_pack_options;
    if (typeof packs === 'string') {
      try { packs = JSON.parse(packs); } catch (e) { packs = []; }
    }
    const prices = [];
    if (Array.isArray(packs) && packs.length > 0) {
      packs.forEach((p) => {
        const pr = Number(p.price);
        if (pr > 0) prices.push(pr);
      });
      firstChocolatePackLabel = packs[0].label || `${packs[0].weight}${packs[0].unit || 'g'}`;
    }
    if ((product.chocolate_pricing_type === 'piece' || product.chocolate_pricing_type === 'both' || product.sell_by_pieces) && product.piece_price && Number(product.piece_price) > 0) {
      prices.push(Number(product.piece_price));
    }
    if (prices.length > 0) {
      chocolateStartingPrice = Math.min(...prices);
    }
  }

  const isSnack = Boolean(
    product.category?.slug === 'snacks' ||
    product.category?.name?.toLowerCase().includes('snack') ||
    Boolean(product.snack_variants)
  );

  const primaryPrice = snackStartingPrice !== null
    ? snackStartingPrice
    : dryFruitStartingPrice !== null
    ? dryFruitStartingPrice
    : chocolateStartingPrice !== null
    ? chocolateStartingPrice
    : isDessert && (product.dessert_default_price && Number(product.dessert_default_price) > 0)
    ? Number(product.dessert_default_price)
    : (product.theme_cake_default_price && Number(product.theme_cake_default_price) > 0)
    ? Number(product.theme_cake_default_price)
    : (product.discount_price || product.base_price || product.price || 0);
  const originalPrice = snackStartingPrice !== null || dryFruitStartingPrice !== null || chocolateStartingPrice !== null ? null : (product.discount_price ? product.base_price : null);

  // Selected default variant if available
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;

  // Cart status for this product
  const cartItems = (cart || []).filter((item) => item.product?.id === product.id);
  const totalCartQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const primaryCartItem = cartItems[0] || null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Theme Cakes and Cupcakes require custom configuration
    if (isThemeCake || (product.cupcake_variants?.matrix && product.cupcake_variants.matrix.length > 0)) {
      navigate(`/cakes/${product.slug}`);
      return;
    }

    // Quick Add for Desserts directly to cart
    if (isDessert) {
      const minQty = Math.max(1, parseInt(product.dessert_min_quantity || 2, 10));
      const defPrice = Number(product.dessert_default_price || product.base_price || 100);
      const chosenVariant = {
        id: `dessert-${product.id}-${minQty}`,
        size_weight: `${minQty} Pcs`,
        price: defPrice,
        discount_price: null,
      };
      addToCart(product, chosenVariant, 1, {
        product_type: 'dessert',
        selected_price: defPrice,
        selected_weight_portion: `${minQty} Pcs`,
        dessert_quantity: minQty,
        order_type: 'piece',
      });
      return;
    }

    // Quick Add for Snacks directly to cart
    if (isSnack && product.snack_variants) {
      const svData = product.snack_variants;
      const unit = (svData.pricing_type === 'weight' && !svData.piece) ? 'weight' : 'piece';
      const unitData = unit === 'piece' ? svData.piece : svData.weight;
      const eggless = unitData?.eggless_price !== undefined && unitData?.eggless_price !== null && unitData?.eggless_price !== '';
      const price = eggless ? Number(unitData.eggless_price) : Number(unitData?.egg_price || product.base_price || 0);
      const portionLabel = unit === 'piece' ? '1 Piece' : `${unitData?.value || ''} (${unitData?.unit || 'grams'})`.trim();
      const dietaryLabel = eggless ? '100% Pure Eggless' : 'With Egg';
      const chosenVariant = {
        id: `snack-${product.id}-${unit}-${eggless ? 'eggless' : 'egg'}`,
        size_weight: portionLabel,
        price: price,
        discount_price: null,
      };
      addToCart(product, chosenVariant, 1, {
        product_type: 'snack',
        unit_type: unit,
        portion_label: portionLabel,
        is_eggless: eggless,
        dietary: dietaryLabel,
        selected_price: price,
        selected_weight_portion: `${portionLabel} • ${dietaryLabel}`,
        snack_quantity: 1,
      });
      return;
    }

    // Quick Add for Dry Fruits directly to cart (defaults to 1st pack option)
    if (isDryFruit) {
      let packs = product.dry_fruit_pack_options;
      if (typeof packs === 'string') {
        try { packs = JSON.parse(packs); } catch (e) { packs = []; }
      }
      const activePack = Array.isArray(packs) && packs.length > 0 ? packs[0] : {
        weight: 200,
        unit: 'g',
        label: product.weight || '200g',
        price: primaryPrice,
      };
      const packPrice = Number(activePack.price);
      const chosenVariant = {
        id: `dryfruit-${product.id}-${activePack.label || `${activePack.weight}${activePack.unit || 'g'}`}`,
        size_weight: `${activePack.label || `${activePack.weight}${activePack.unit || 'g'}`} Pack`,
        price: packPrice,
        discount_price: null,
      };
      addToCart(product, chosenVariant, 1, {
        product_type: 'dry_fruit',
        pack_size: activePack.weight,
        unit: activePack.unit || 'g',
        pack_label: activePack.label || `${activePack.weight}${activePack.unit || 'g'}`,
        price_per_pack: packPrice,
        number_of_packs: 1,
        selected_price: packPrice,
        selected_weight_portion: `1 × ${activePack.label || `${activePack.weight}${activePack.unit || 'g'}`} Pack`,
        order_type: 'pack',
      });
      return;
    }

    // Quick Add for Chocolates directly to cart
    if (isChocolate) {
      let packs = product.chocolate_pack_options;
      if (typeof packs === 'string') {
        try { packs = JSON.parse(packs); } catch (e) { packs = []; }
      }
      const pricingType = product.chocolate_pricing_type || (Array.isArray(packs) && packs.length > 0 ? 'weight' : 'piece');
      if (pricingType === 'piece' && (product.piece_price || product.base_price)) {
        const piecePrice = Number(product.piece_price || product.base_price || 0);
        const chosenVariant = {
          id: `chocolate-${product.id}-piece-1`,
          size_weight: '1 Piece',
          price: piecePrice,
          discount_price: null,
        };
        addToCart(product, chosenVariant, 1, {
          product_type: 'chocolate',
          order_type: 'piece',
          piece_count: 1,
          price_per_piece: piecePrice,
          selected_price: piecePrice,
          selected_weight_portion: '1 Piece',
        });
        return;
      }

      const activePack = Array.isArray(packs) && packs.length > 0 ? packs[0] : {
        weight: 100,
        unit: 'g',
        label: product.weight || '100g',
        price: primaryPrice,
      };
      const packPrice = Number(activePack.price || primaryPrice);
      const chosenVariant = {
        id: `chocolate-${product.id}-${activePack.label || `${activePack.weight}${activePack.unit || 'g'}`}`,
        size_weight: `${activePack.label || `${activePack.weight}${activePack.unit || 'g'}`} Pack`,
        price: packPrice,
        discount_price: null,
      };
      addToCart(product, chosenVariant, 1, {
        product_type: 'chocolate',
        pack_size: activePack.weight,
        unit: activePack.unit || 'g',
        pack_label: activePack.label || `${activePack.weight}${activePack.unit || 'g'}`,
        price_per_pack: packPrice,
        number_of_packs: 1,
        selected_price: packPrice,
        selected_weight_portion: `1 × ${activePack.label || `${activePack.weight}${activePack.unit || 'g'}`} Pack`,
        order_type: 'pack',
      });
      return;
    }

    if (onAddToCart) {
      onAddToCart(product, defaultVariant, 1);
    } else {
      addToCart(product, defaultVariant, 1);
    }
  };

  const handleOrderNow = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isThemeCake || (product.cupcake_variants?.matrix && product.cupcake_variants.matrix.length > 0)) {
      navigate(`/cakes/${product.slug}`);
      return;
    }

    if (onOrderNow) {
      onOrderNow(product, defaultVariant, 1);
    } else {
      handleAddToCart(e);
      navigate('/checkout');
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-amber-100/80 shadow-xs hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between h-full">
      
      {/* Top Image Container */}
      <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-cream mb-1.5 sm:mb-2">
        <Link to={`/cakes/${product.slug}`}>
          <img
            src={formatImageUrl(product.image_url, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500')}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges: New, Popular, Eggless */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 sm:gap-1 pointer-events-none">
          {product.is_new_arrival && (
            <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs">
              NEW
            </span>
          )}
          {product.is_popular && (
            <span className="bg-berry text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs">
              BESTSELLER
            </span>
          )}
          {!['party-items', 'dry-fruits'].includes(product.category?.slug) && (
            product.is_eggless ? (
              <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 shadow-xs">
                <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-white"></span>
                <span>Eggless</span>
              </span>
            ) : (
              <span className="bg-amber-800/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 shadow-xs">
                <span>With Egg</span>
              </span>
            )
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500 backdrop-blur-xs shadow-xs'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFavorited ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Weight / Size hint badge */}
        {(product.weight || isDessert || isDryFruit || isChocolate) && (
          <div className="absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-medium px-1 sm:px-1.5 py-0.5 rounded">
            {isDessert
              ? (product.dessert_min_quantity ? `${product.dessert_min_quantity} Pcs` : (product.weight && product.weight.includes('Pc') ? product.weight : '2 Pcs'))
              : isDryFruit
              ? (firstDryFruitPackLabel || product.weight || 'Pack')
              : isChocolate
              ? (product.chocolate_pricing_type === 'piece' ? '1 Pc' : (firstChocolatePackLabel || product.weight || 'Pack'))
              : product.weight}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">5.0</span>
          </div>

          {/* Title */}
          <Link to={`/cakes/${product.slug}`} className="block group-hover:text-amber-700 transition-colors">
            <h3 className="font-serif font-bold text-chocolate text-[11px] sm:text-xs md:text-sm line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-tight sm:leading-relaxed">
            {product.short_description || product.description || 'Freshly baked with pure dairy cream.'}
          </p>
        </div>

        {/* Bottom: Price & Weight Info */}
        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm md:text-base font-bold text-chocolate">
                ₹{Number(primaryPrice).toLocaleString('en-IN')}
              </span>
              {originalPrice && (
                <span className="text-[8px] sm:text-[10px] text-slate-400 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-[8px] sm:text-[9px] text-emerald-600 font-medium shrink-0">In Stock</span>
              {sv && sv.pricing_type ? (
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">
                  • {sv.pricing_type === 'both' ? 'Piece & Weight' : sv.pricing_type === 'piece' ? 'By Piece' : `${sv.weight?.value || ''} ${sv.weight?.unit || 'Weight'}`.trim()}
                </span>
              ) : isDryFruit ? (
                <span className="text-[8px] sm:text-[9px] text-emerald-700 font-medium truncate">
                  • Pack: {firstDryFruitPackLabel || product.weight || '200g'}
                </span>
              ) : isChocolate ? (
                <span className="text-[8px] sm:text-[9px] text-amber-900 font-medium truncate">
                  • {product.chocolate_pricing_type === 'piece' ? 'By Piece' : `Pack: ${firstChocolatePackLabel || product.weight || '100g'}`}
                </span>
              ) : isDessert ? (
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">
                  • Min {product.dessert_min_quantity ? `${product.dessert_min_quantity} Pcs` : (product.weight && product.weight.includes('Pc') ? product.weight : '2 Pcs')}
                </span>
              ) : product.weight ? (
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">• Min {product.weight}</span>
              ) : defaultVariant?.size_weight ? (
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">• Min {defaultVariant.size_weight}</span>
              ) : (
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">• Min 0.5kg</span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Action Buttons / In-Cart Quantity Stepper with + Mark */}
        {totalCartQty > 0 ? (
          <div className="mt-1.5 sm:mt-2 flex items-center justify-between bg-amber-50 border sm:border-2 border-amber-400 rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-2xs">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (primaryCartItem) {
                  if (primaryCartItem.quantity <= 1) {
                    removeFromCart(primaryCartItem.id);
                  } else {
                    updateCartQuantity(primaryCartItem.id, primaryCartItem.quantity - 1);
                  }
                }
              }}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-rose-50 text-chocolate hover:text-rose-700 rounded-md sm:rounded-lg font-black text-xs sm:text-base shadow-xs active:scale-95 transition-all cursor-pointer border border-amber-200"
              title="Decrease quantity (−)"
            >
              −
            </button>

            <div className="text-center px-0.5 sm:px-1">
              <span className="font-extrabold text-[10px] sm:text-xs text-chocolate block leading-none">
                {totalCartQty} in Cart
              </span>
              <span className="text-[8px] sm:text-[10px] text-amber-800 font-bold">
                ₹{((primaryCartItem?.price || primaryPrice) * totalCartQty).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (primaryCartItem) {
                  updateCartQuantity(primaryCartItem.id, primaryCartItem.quantity + 1);
                }
              }}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-chocolate rounded-md sm:rounded-lg font-black text-xs sm:text-base shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Add more (+)"
            >
              +
            </button>
          </div>
        ) : (
          <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/90 font-bold text-[10px] sm:text-xs py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer min-h-[30px] sm:min-h-[38px]"
              title="Add item to cart (+)"
            >
              <span className="text-xs sm:text-base font-black text-amber-800 leading-none">+</span>
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={handleOrderNow}
              className="flex items-center justify-center gap-0.5 sm:gap-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-[10px] sm:text-[11px] py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[30px] sm:min-h-[38px]"
              title="Order directly"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-200 text-amber-200 shrink-0" />
              <span>Order</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductCard;
