import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import ProductCarousel from '../../components/UI/ProductCarousel';
import { formatImageUrl } from '../../utils/imageUrl';
import {
  Trash2,
  Heart,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  Check,
  Truck,
  ShieldCheck
} from 'lucide-react';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    toggleWishlist,
    cartSubtotal,
    cartItemCount,
    showToast,
  } = useApp();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Delivery Fee: Free above 1000, else 50
  const deliveryFee = cartSubtotal >= 1000 || cartSubtotal === 0 ? 0 : 50;
  const tax = roundToTwo((cartSubtotal - couponDiscount) * 0.05);
  const finalTotal = Math.max(0, cartSubtotal - couponDiscount + deliveryFee + tax);

  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const catSlug = cart[0]?.product?.category?.slug || 'cakes-pastries';
        const res = await api.get(`/products?category=${catSlug}&per_page=10`);
        if (res.data?.data) {
          const cartProductIds = cart.map((item) => item.product?.id);
          const filtered = res.data.data.filter((p) => !cartProductIds.includes(p.id));
          setRelatedProducts(filtered.length > 0 ? filtered : res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load related products for cart:', err);
      }
    };

    if (cart.length > 0) {
      fetchRelated();
    }
  }, [cart[0]?.product?.category?.slug]);

  function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        subtotal: cartSubtotal,
      });

      if (res.data?.data) {
        setAppliedCoupon(res.data.data);
        setCouponDiscount(Number(res.data.data.discount));
        showToast(`Coupon "${res.data.data.code}" applied! Saved ₹${res.data.data.discount}`, 'success');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Invalid coupon code. Try "AMMAS100"', 'error');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    showToast('Coupon removed.', 'info');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 sm:p-16 border border-amber-100 shadow-warm space-y-4">
          <div className="text-6xl animate-bounce">🍰</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Your cart is waiting for something delicious
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Discover our fresh cream cakes, crunchy cookies, and melt-in-mouth pastries baked today.
          </p>
          <div className="pt-3">
            <Link
              to="/category/cakes-pastries"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-md transition-all hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Cakes & Treats</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Your Shopping Cart ({cartItemCount} item{cartItemCount === 1 ? '' : 's'})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Freshly baked upon order from your nearest Ammas Pastries kitchen
          </p>
        </div>
        <Link
          to="/category/cakes-pastries"
          className="text-xs font-bold text-amber-700 hover:text-amber-800"
        >
          + Add more items
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const hasCustomization = Boolean(item.customization);
            const isPhotoCake = item.customization?.is_photo_cake;
            const itemImage = formatImageUrl(
              item.customization?.photo_preview_url ||
              item.product.image_url,
              'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'
            );

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                {/* Image & Main Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-cream flex-shrink-0 border border-amber-100">
                    <img src={itemImage} alt={item.product.name} className="w-full h-full object-cover" />
                    {isPhotoCake && (
                      <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        Photo Cake
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-chocolate leading-snug">
                      {item.product.name}
                    </h3>
                    
                    {/* Variant & Customization Labels */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {item.variant && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-chocolate">
                          Size: {item.variant.size_weight}
                        </span>
                      )}
                      {item.customization?.flavour && (
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                          {item.customization.flavour}
                        </span>
                      )}
                      {item.customization?.is_eggless !== undefined && (
                        <span className={`px-2 py-0.5 rounded-md font-medium ${
                          item.customization.is_eggless
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-900'
                        }`}>
                          {item.customization.is_eggless ? '🌱 100% Eggless' : '🥚 With Egg'}
                        </span>
                      )}
                    </div>

                    {item.customization?.name_on_cake && (
                      <div className="text-[11px] text-slate-600">
                        Message: <strong className="text-amber-900">"{item.customization.name_on_cake}"</strong>
                      </div>
                    )}

                    <div className="text-sm font-bold text-chocolate sm:hidden pt-1">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Right: Quantity Controls & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-chocolate">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="hidden sm:block text-right min-w-[90px]">
                    <div className="text-base font-bold text-chocolate">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">₹{item.price} each</div>
                  </div>

                  {/* Actions (Wishlist & Remove) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        toggleWishlist(item.product);
                        removeFromCart(item.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                      title="Move to Wishlist"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-warm space-y-5">
            <h2 className="font-serif font-bold text-lg text-chocolate pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            {/* Coupon Code Form */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Apply Bakery Promo Code:</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-900">{appliedCoupon.code}</span>
                      <div className="text-[10px] text-emerald-700">Saved ₹{couponDiscount}</div>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-rose-600 font-semibold hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Try 'AMMAS100'"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-semibold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon}
                    className="bg-chocolate hover:bg-chocolate-light text-white font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}
            </div>

            {/* Financial Calculations */}
            <div className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-chocolate">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-600 uppercase text-[11px]">FREE</strong>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              {cartSubtotal < 1000 && (
                <div className="text-[10px] text-amber-700 italic">
                  Add ₹{1000 - cartSubtotal} more for FREE doorstep delivery!
                </div>
              )}

              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{tax}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-chocolate">
                <span>Total Payable</span>
                <span className="text-xl text-amber-700">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout', { state: { appliedCoupon, couponDiscount } })}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pt-1">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe Razorpay Encrypted Checkout</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Guaranteed fresh delivery in 45-60 minutes
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="pt-4">
          <ProductCarousel
            products={relatedProducts}
            title="Pairs Wonderfully With Your Selection"
            subtitle="Frequently ordered together • Same instant Add to Cart & Order actions"
            badgeText="Chef's Pairings"
          />
        </div>
      )}

    </div>
  );
};

export default CartPage;
