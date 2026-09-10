import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { ShieldCheck, FileText } from 'lucide-react';

const PolicyPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace('/', '') || 'terms-and-conditions';

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/content/policies/${slug}`);
        if (res.data?.data) {
          setPolicy(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching policy:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [slug]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="bg-gradient-to-r from-cream via-amber-50 to-cream rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal & Policy</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
          {policy?.title || 'Bakery Policy'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Last updated: September 2026 • Ammas Pastries Legal Compliance
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-xs leading-relaxed text-xs sm:text-sm text-slate-700 whitespace-pre-line space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading policy content...</div>
        ) : policy?.content ? (
          <div>{policy.content}</div>
        ) : (
          <div>Policy details will be loaded here.</div>
        )}
      </div>

    </div>
  );
};

export default PolicyPage;
