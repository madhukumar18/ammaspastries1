import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/UI/ProductCard';
import { ProductCardSkeleton } from '../../components/UI/SkeletonLoader';
import { Sparkles, Flame, ArrowLeft } from 'lucide-react';

const CuratedListPage = () => {
  const location = useLocation();
  const isNewArrivals = location.pathname.includes('new-arrivals');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurated = async () => {
      setLoading(true);
      try {
        const endpoint = isNewArrivals ? '/new-arrivals' : '/most-popular';
        const res = await api.get(endpoint);
        if (res.data?.data) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching curated products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurated();
  }, [isNewArrivals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb & Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <div className="bg-gradient-to-r from-cream via-amber-50 to-cream rounded-3xl p-6 sm:p-10 border border-amber-200 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              {isNewArrivals ? <Sparkles className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5 text-rose-600" />}
              <span>{isNewArrivals ? 'Handcrafted Arrivals' : 'All-Time Customer Favorites'}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
              {isNewArrivals ? 'Explore Our New Arrivals' : 'Explore Most Popular Cakes & Treats'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isNewArrivals
                ? 'Fresh seasonal cakes and innovative confectionery recipes just launched from our ovens.'
                : 'The highest-rated, most celebrated pastries loved across thousands of celebrations.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </div>
  );
};

export default CuratedListPage;
