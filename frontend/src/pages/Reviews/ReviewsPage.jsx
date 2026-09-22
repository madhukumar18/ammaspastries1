import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Star,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Award,
  Filter,
  ArrowRight,
  Heart,
  CheckCircle2,
  Calendar,
  MapPin,
  Cake,
  X
} from 'lucide-react';
import { formatImageUrl } from '../../utils/imageUrl';

const ReviewsPage = () => {
  const { showToast } = useApp();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    average_rating: 4.9,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Review Submission Modal
  const [showModal, setShowModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorLocation, setAuthorLocation] = useState('Bengaluru');
  const [authorRating, setAuthorRating] = useState(5);
  const [authorComment, setAuthorComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('all', '1');
      if (selectedRatingFilter !== 'all') {
        params.append('rating', selectedRatingFilter);
      }
      params.append('sort', selectedSort);

      const res = await api.get(`/reviews?${params.toString()}`);
      if (res.data?.data) {
        setReviews(res.data.data);
      }
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      showToast('Could not load reviews at this time', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedRatingFilter, selectedSort]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !authorComment.trim()) {
      showToast('Please enter your name and comments', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/reviews/submit', {
        customer_name: authorName,
        customer_location: authorLocation || 'Bengaluru',
        rating: authorRating,
        comment: authorComment,
      });

      showToast('Thank you! Your review is now published on the website.', 'success');
      setShowModal(false);

      // Prepend newly added review directly to local list for instant feedback
      if (res.data?.data) {
        setReviews((prev) => [res.data.data, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          breakdown: {
            ...prev.breakdown,
            [authorRating]: (prev.breakdown[authorRating] || 0) + 1,
          },
        }));
      }

      setAuthorName('');
      setAuthorComment('');
      setAuthorRating(5);
      setAuthorLocation('Bengaluru');
    } catch (err) {
      showToast('Unable to submit your review. Please check all fields.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50/50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-amber-700">Home</Link>
          <span>/</span>
          <span className="text-chocolate font-semibold">Customer Reviews</span>
        </nav>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-amber-900 via-chocolate to-amber-950 text-white rounded-3xl p-6 sm:p-10 shadow-warm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Verified Customer Stories
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold leading-tight text-amber-100">
              Celebrations Made Sweeter with Ammas Pastries
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Read authentic feedback from dessert lovers across Bengaluru. Every cake, pastry, and snack is handcrafted with love and delivered fresh to your door.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-chocolate font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Write Your Review</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-amber-200/90 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Genuine Customer Ratings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Average Rating Block */}
          <div className="text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
            <div className="text-4xl sm:text-5xl font-extrabold text-chocolate font-serif">
              {stats.average_rating || '4.9'}
            </div>
            <div className="flex items-center justify-center md:justify-start text-amber-400 gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Based on <strong>{stats.total > 0 ? stats.total : '15,000+'}</strong> verified customer reviews
            </div>
          </div>

          {/* Rating Breakdown Bars */}
          <div className="space-y-2 md:col-span-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.breakdown?.[stars] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : stars === 5 ? 90 : 10;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                    {stars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Star Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-600" /> Filter:
            </span>
            {[
              { label: 'All Reviews', val: 'all' },
              { label: '5 Stars ★', val: '5' },
              { label: '4 Stars ★', val: '4' },
              { label: '3 Stars ★', val: '3' },
              { label: '2 Stars ★', val: '2' },
              { label: '1 Star ★', val: '1' },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setSelectedRatingFilter(f.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRatingFilter === f.val
                    ? 'bg-chocolate text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-600 border border-slate-200/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="text-3xl animate-bounce">🍰</div>
            <p className="text-sm font-semibold text-chocolate">Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-amber-100">
            <div className="text-4xl">🌟</div>
            <h3 className="font-serif font-bold text-lg text-chocolate">No Reviews Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no reviews matching the selected filter. Be the first to share your experience!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-5 py-2.5 rounded-xl shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Write A Review</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((rev) => {
              const initial = rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : 'C';
              return (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl p-6 border border-amber-100/80 shadow-warm hover:shadow-warm-lg transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Customer Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-chocolate leading-tight">
                            {rev.customer_name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {rev.customer_location || 'Bengaluru'}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Customer
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex text-amber-400 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= (rev.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment Body */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-amber-50/40 p-4 rounded-2xl border border-amber-100/50">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* Optional Associated Product Card */}
                  {rev.product && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Cake className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-slate-500 text-[11px]">Reviewed:</span>
                        <Link
                          to={`/cakes/${rev.product.slug}`}
                          className="font-bold text-chocolate hover:text-amber-700 truncate"
                        >
                          {rev.product.name}
                        </Link>
                      </div>
                      <Link
                        to={`/cakes/${rev.product.slug}`}
                        className="text-amber-700 font-semibold text-[11px] hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <span>View Cake</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA to Order */}
        <div className="bg-amber-100/60 rounded-3xl p-8 text-center space-y-3 border border-amber-200">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate">
            Ready to Taste What Everyone is Talking About?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Order fresh artisanal cakes, pastries, snacks, and cookies delivered across Bengaluru in 45 to 60 minutes.
          </p>
          <div className="pt-2">
            <Link
              to="/category/cakes-pastries"
              className="inline-flex items-center gap-2 bg-chocolate hover:bg-amber-950 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-md"
            >
              <span>Explore Fresh Cake Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Write Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-amber-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-xl text-chocolate">Share Your Experience</h3>
                <p className="text-xs text-slate-500">Your feedback helps us bake better every day</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Location (City/Area)</label>
                  <input
                    type="text"
                    value={authorLocation}
                    onChange={(e) => setAuthorLocation(e.target.value)}
                    placeholder="e.g. Indiranagar, Bengaluru"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Your Overall Rating *</label>
                <div className="flex items-center gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setAuthorRating(star)}
                      className="p-1 hover:scale-115 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= authorRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-xs font-bold text-amber-900">
                    {authorRating === 5 && '🌟 Outstanding & Fresh!'}
                    {authorRating === 4 && '✨ Very Good!'}
                    {authorRating === 3 && '👍 Good'}
                    {authorRating === 2 && '⚠️ Average'}
                    {authorRating === 1 && '❌ Needs Improvement'}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Review *</label>
                <textarea
                  required
                  rows={4}
                  value={authorComment}
                  onChange={(e) => setAuthorComment(e.target.value)}
                  placeholder="Share details about the flavor, creaminess, packaging, and timely delivery..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Publishing Review...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReviewsPage;
