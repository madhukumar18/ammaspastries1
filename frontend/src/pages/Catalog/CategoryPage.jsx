import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/UI/ProductCard';
import { ProductCardSkeleton } from '../../components/UI/SkeletonLoader';
import { Filter, SlidersHorizontal, Cake, Check, Sparkles } from 'lucide-react';

const CategoryPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSub = searchParams.get('sub');

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [egglessOnly, setEgglessOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Fetch Category info & Products
  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const catSlug = slug || 'cakes-pastries';
        const [catRes, prodRes] = await Promise.allSettled([
          api.get(`/categories/${catSlug}`),
          api.get(`/products?category=${catSlug}${currentSub ? `&sub=${currentSub}` : ''}&eggless=${egglessOnly}&sort=${sortBy}`),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
          setCategory(catRes.value.data.data);
        }

        if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) {
          setProducts(prodRes.value.data.data);
          if (prodRes.value.data.pagination) {
            setPagination(prodRes.value.data.pagination);
          }
        }
      } catch (err) {
        console.warn('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, currentSub, egglessOnly, sortBy]);

  const handleSubSelect = (subSlug) => {
    if (subSlug === currentSub) {
      searchParams.delete('sub');
    } else {
      searchParams.set('sub', subSlug);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-cream via-amber-50 to-cream rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
            <Cake className="w-4 h-4" />
            <span>Category Catalog</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-chocolate">
            {category?.name || 'Cakes & Bakery Delights'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {category?.description || 'Browse our artisanal baked creations, crafted fresh daily with pure dairy ingredients.'}
          </p>
        </div>
      </div>

      {/* Filter & Subcategory Chips */}
      <div className="space-y-4">
        {/* Subcategories */}
        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => handleSubSelect(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                !currentSub
                  ? 'bg-chocolate text-white shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border border-amber-200/80'
              }`}
            >
              All {category.name}
            </button>
            {category.subcategories.map((sub) => {
              const isSelected = currentSub === sub.slug;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubSelect(sub.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-chocolate text-white shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-700 border border-amber-200/80'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Filter controls: Eggless toggle & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEgglessOnly(!egglessOnly)}
              className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                egglessOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${egglessOnly ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span>100% Eggless Only</span>
              {egglessOnly && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-chocolate font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="popular">Popularity</option>
              <option value="newest">New Arrivals</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-amber-100 p-8">
          <div className="text-4xl mb-3">🍰</div>
          <h3 className="font-serif text-lg font-bold text-chocolate mb-1">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            We couldn't find items matching your current filters. Try unchecking "100% Eggless Only" or explore other categories.
          </p>
          <button
            onClick={() => {
              setEgglessOnly(false);
              handleSubSelect(null);
            }}
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-full"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
};

export default CategoryPage;
