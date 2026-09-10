import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import ProductCard from '../../components/UI/ProductCard';
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
  MessageSquare
} from 'lucide-react';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart, toggleWishlist, isInWishlist, showToast } = useApp();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);

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

          if (p.variants && p.variants.length > 0) {
            setSelectedVariant(p.variants[0]);
          } else {
            setSelectedVariant(null);
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

  const isFavorited = isInWishlist(product.id);
  const currentPrice = selectedVariant
    ? selectedVariant.discount_price || selectedVariant.price
    : product.discount_price || product.base_price;
  const strikePrice = selectedVariant && selectedVariant.discount_price ? selectedVariant.price : (product.discount_price ? product.base_price : null);

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
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
        product_id: product.id,
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
            {product.is_eggless && (
              <span className="absolute top-4 left-4 bg-emerald-700/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                100% Pure Vegetarian / Eggless
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
              ₹{Number(currentPrice).toLocaleString('en-IN')}
            </span>
            {strikePrice && (
              <span className="text-base text-slate-400 line-through">
                ₹{Number(strikePrice).toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full ml-auto">
              Inclusive of GST
            </span>
          </div>

          {/* Size / Weight Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Cake Weight / Portion:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vPrice = v.discount_price || v.price;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-500/10 shadow-xs ring-2 ring-amber-500/30'
                          : 'border-slate-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-chocolate">{v.size_weight}</div>
                      <div className="text-xs font-semibold text-amber-700 mt-0.5">₹{vPrice}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart Controls */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center border border-slate-200 rounded-2xl bg-white p-1 shadow-2xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-lg"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-chocolate">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-lg"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart (₹{(currentPrice * quantity).toLocaleString('en-IN')})</span>
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3.5 rounded-2xl border transition-all ${
                isFavorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500'
              }`}
              title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-600' : ''}`} />
            </button>
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

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-chocolate">You May Also Relish</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetailPage;
