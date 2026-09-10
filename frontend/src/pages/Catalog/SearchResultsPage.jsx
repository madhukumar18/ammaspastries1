import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/UI/ProductCard';
import { ProductCardSkeleton } from '../../components/UI/SkeletonLoader';
import { Search, ArrowLeft } from 'lucide-react';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}&per_page=16`);
        if (res.data?.data) {
          setProducts(res.data.data);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err) {
        console.warn('Search page error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      performSearch();
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
              Search Results for "{query}"
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Found {pagination.total} product{pagination.total === 1 ? '' : 's'} matching your query
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-amber-100 p-8 space-y-3">
          <div className="text-4xl">🔍</div>
          <h2 className="font-serif text-lg font-bold text-chocolate">
            No cakes or treats found for "{query}"
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try checking for typos or searching for broader terms like "Chocolate", "Truffle", "Fruit", or "Brownie".
          </p>
          <div className="pt-2">
            <Link
              to="/category/cakes-pastries"
              className="inline-block text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-5 py-2.5 rounded-full shadow-xs"
            >
              Browse All Cakes
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchResultsPage;
