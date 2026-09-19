import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ProductCard = ({ product, onAddToCart, onOrderNow }) => {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useApp();

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

  const primaryPrice = snackStartingPrice !== null
    ? snackStartingPrice
    : (product.discount_price || product.base_price || product.price || 0);
  const originalPrice = snackStartingPrice !== null ? null : (product.discount_price ? product.base_price : null);

  // Selected default variant if available
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;

  const requiresCustomization = Boolean(
    (product.snack_variants?.pricing_type === 'both') ||
    (product.cupcake_variants?.matrix && product.cupcake_variants.matrix.length > 0) ||
    (product.category?.slug === 'theme-cakes' && product.flavours?.length > 0)
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (requiresCustomization) {
      navigate(`/cakes/${product.slug}`);
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
    if (requiresCustomization) {
      navigate(`/cakes/${product.slug}`);
      return;
    }
    if (onOrderNow) {
      onOrderNow(product, defaultVariant, 1);
    } else {
      addToCart(product, defaultVariant, 1);
      navigate('/checkout');
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative bg-white rounded-2xl p-2.5 sm:p-3 border border-amber-100/80 shadow-xs hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between">
      
      {/* Top Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-cream mb-2">
        <Link to={`/cakes/${product.slug}`}>
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges: New, Popular, Eggless */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {product.is_new_arrival && (
            <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-xs">
              NEW
            </span>
          )}
          {product.is_popular && (
            <span className="bg-berry text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-xs">
              BESTSELLER
            </span>
          )}
          {!['party-items', 'dry-fruits'].includes(product.category?.slug) && (
            product.is_eggless ? (
              <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>Eggless</span>
              </span>
            ) : (
              <span className="bg-amber-800/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span>With Egg</span>
              </span>
            )
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500 backdrop-blur-xs shadow-xs'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Weight / Size hint badge */}
        {product.weight && (
          <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
            {product.weight}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-slate-500">5.0</span>
          </div>

          {/* Title */}
          <Link to={`/cakes/${product.slug}`} className="block group-hover:text-amber-700 transition-colors">
            <h3 className="font-serif font-bold text-chocolate text-xs sm:text-sm line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
            {product.short_description || product.description || 'Freshly baked with pure dairy cream.'}
          </p>
        </div>

        {/* Bottom: Price & Weight Info */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold text-chocolate">
                ₹{Number(primaryPrice).toLocaleString('en-IN')}
              </span>
              {originalPrice && (
                <span className="text-[10px] text-slate-400 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-emerald-600 font-medium">In Stock</span>
              {sv && sv.pricing_type ? (
                <span className="text-[9px] text-slate-400 font-medium">
                  • {sv.pricing_type === 'both' ? 'Piece & Weight' : sv.pricing_type === 'piece' ? 'By Piece' : `${sv.weight?.value || ''} ${sv.weight?.unit || 'Weight'}`.trim()}
                </span>
              ) : product.weight ? (
                <span className="text-[9px] text-slate-400 font-medium">• Min {product.weight}</span>
              ) : defaultVariant?.size_weight ? (
                <span className="text-[9px] text-slate-400 font-medium">• Min {defaultVariant.size_weight}</span>
              ) : (
                <span className="text-[9px] text-slate-400 font-medium">• Min 0.5kg</span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Action Buttons: Add to Cart + Order Now */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/90 font-bold text-[11px] py-2 px-1 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer min-h-[38px]"
            title="Add item to cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Add</span>
          </button>

          <button
            type="button"
            onClick={handleOrderNow}
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-[11px] py-2 px-1 rounded-lg shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[38px]"
            title="Order directly"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-200 text-amber-200 shrink-0" />
            <span>Order</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
