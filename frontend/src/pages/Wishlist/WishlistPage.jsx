import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { formatImageUrl } from '../../utils/imageUrl';

const WishlistPage = () => {
  const { wishlist, toggleWishlist, addToCart } = useApp();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
          Your Wishlist is Empty
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Keep track of your favorite cakes, pastries and snack treats. Tap the heart icon on any product to save it here!
        </p>
        <div className="pt-2">
          <Link
            to="/category/cakes-pastries"
            className="inline-block text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-full shadow-xs transition-colors"
          >
            Explore Cakes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            My Saved Treats ({wishlist.length})
          </h1>
          <p className="text-xs text-slate-500">Easily move your saved sweets to your cart anytime</p>
        </div>
        <Link to="/category/cakes-pastries" className="text-xs font-bold text-amber-700 hover:text-amber-800">
          Continue Browsing →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          const price = item.discount_price || item.base_price || item.price || 0;
          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-amber-100 shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream mb-3">
                <img src={formatImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleWishlist(item)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs text-rose-600 flex items-center justify-center hover:bg-white transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Link to={`/cakes/${item.slug}`} className="block">
                  <h3 className="font-serif font-bold text-sm text-chocolate hover:text-amber-700 truncate">
                    {item.name}
                  </h3>
                </Link>
                <div className="text-base font-bold text-chocolate">₹{price}</div>

                <button
                  onClick={() => {
                    addToCart(item);
                    toggleWishlist(item);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-chocolate hover:bg-chocolate-light text-cream-light font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default WishlistPage;
