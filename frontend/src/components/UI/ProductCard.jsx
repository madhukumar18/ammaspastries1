import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useApp();

  const isFavorited = isInWishlist(product.id);
  const primaryPrice = product.discount_price || product.base_price || product.price || 0;
  const originalPrice = product.discount_price ? product.base_price : null;

  // Selected default variant if available
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, defaultVariant, 1);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative bg-white rounded-3xl p-3 sm:p-4 border border-amber-100/80 shadow-xs hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
      
      {/* Top Image Container */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream mb-3">
        <Link to={`/cakes/${product.slug}`}>
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges: New, Popular, Eggless */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
          {product.is_new_arrival && (
            <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              NEW
            </span>
          )}
          {product.is_popular && (
            <span className="bg-berry text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              BESTSELLER
            </span>
          )}
          {product.is_eggless && (
            <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              100% Eggless
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500 backdrop-blur-xs shadow-xs'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Weight / Size hint badge */}
        {product.weight && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            {product.weight}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">5.0</span>
          </div>

          {/* Title */}
          <Link to={`/cakes/${product.slug}`} className="block group-hover:text-amber-700 transition-colors">
            <h3 className="font-serif font-bold text-chocolate text-base sm:text-lg line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.short_description || product.description || 'Freshly baked with pure dairy cream and natural ingredients.'}
          </p>
        </div>

        {/* Bottom: Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-chocolate">
                ₹{Number(primaryPrice).toLocaleString('en-IN')}
              </span>
              {originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">In Stock</span>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
