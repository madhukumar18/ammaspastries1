import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, MessageSquare, Award } from 'lucide-react';

const AdminReviewsPage = () => {
  const { showToast } = useApp();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, featured

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reviews');
      if (res.data?.data) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (id) => {
    try {
      const res = await api.post(`/admin/reviews/${id}/toggle-approval`);
      showToast(res.data?.message || 'Status updated', 'success');
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: !r.is_approved } : r))
      );
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const res = await api.post(`/admin/reviews/${id}/toggle-featured`);
      showToast(res.data?.message || 'Featured status updated', 'success');
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: !r.is_featured } : r))
      );
    } catch (err) {
      showToast('Failed to toggle featured', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      showToast('Review deleted.', 'success');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast('Failed to delete review', 'error');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return !!r.is_approved;
    if (filter === 'featured') return !!r.is_featured;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Customer Reviews & Testimonials</h1>
          <p className="text-sm text-gray-500">
            Moderate submitted customer reviews, verify authentic ratings, and feature top feedback on homepage.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl border border-cream-200 self-start">
          {['all', 'pending', 'approved', 'featured'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab ? 'bg-white text-bakery-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading customer reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-cream-200">
          <MessageSquare className="w-12 h-12 text-cream-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No reviews found matching "{filter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 border border-cream-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{rev.customer_name}</h4>
                    <p className="text-xs text-bakery-700 font-medium">
                      Product: {rev.product?.name || 'General Feedback'}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-600 italic leading-relaxed mb-4">"{rev.comment}"</p>
              </div>

              <div className="pt-3 border-t border-cream-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      rev.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {rev.is_approved ? 'Approved' : 'Pending Approval'}
                  </span>
                  {rev.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-gold-100 text-gold-800">
                      <Award className="w-3 h-3" /> Homepage Featured
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleApproval(rev.id)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      rev.is_approved
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={rev.is_approved ? 'Unapprove' : 'Approve'}
                  >
                    {rev.is_approved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(rev.id)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      rev.is_featured ? 'text-gold-600 bg-gold-50' : 'text-gray-400 hover:text-gold-600 hover:bg-gold-50'
                    }`}
                    title={rev.is_featured ? 'Unfeature' : 'Feature on homepage'}
                  >
                    <Award className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
