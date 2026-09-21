import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  Crown,
  Sparkles,
  Search,
  X,
  Loader2,
  PartyPopper,
  Gift,
  Star,
  Cake,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Image as ImageIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatImageUrl } from '../../utils/imageUrl';

// Theme Cake Card
const ThemeCakeCard = ({ product }) => {
  const navigate = useNavigate();

  // Determine starting price from theme cake default price, flavors or base price
  let startingPrice = product.base_price || 0;
  if (product.theme_cake_default_price && Number(product.theme_cake_default_price) > 0) {
    startingPrice = Number(product.theme_cake_default_price);
  } else if (product.flavours && Array.isArray(product.flavours) && product.flavours.length > 0) {
    const validPrices = product.flavours
      .flatMap((f) => [f.egg_price, f.eggless_price])
      .filter((p) => p !== undefined && p !== null && !isNaN(Number(p)) && Number(p) > 0);
    if (validPrices.length > 0) {
      startingPrice = Math.min(...validPrices);
    }
  }

  const flavorCount = product.flavours?.length || 0;

  return (
    <div
      onClick={() => navigate(`/cakes/${product.slug}`)}
      className="group bg-white rounded-3xl border border-amber-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-amber-50/50">
        {product.image_url ? (
          <img
            src={formatImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-amber-100">
            <Cake className="w-10 h-10 text-amber-300" />
            <span className="text-[11px] text-amber-600 font-medium">Artisan Creation</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.is_new_arrival && (
            <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
              New
            </span>
          )}
          {product.is_popular && (
            <span className="text-[10px] font-extrabold bg-amber-500 text-chocolate px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" /> Popular
            </span>
          )}
        </div>

        {product.theme_cake_default_weight && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-black bg-amber-500 text-chocolate px-2.5 py-0.5 rounded-full shadow-xs">
            Min {product.theme_cake_default_weight}kg
          </span>
        )}

        {flavorCount > 0 && (
          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold bg-chocolate/85 backdrop-blur-xs text-amber-200 px-2.5 py-0.5 rounded-full shadow-xs">
            {flavorCount} {flavorCount === 1 ? 'Flavor' : 'Flavors'} Available
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-serif font-bold text-sm sm:text-base text-chocolate group-hover:text-amber-800 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {product.short_description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-amber-50 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">
              {product.theme_cake_default_weight ? `Starting from (${product.theme_cake_default_weight}kg Base)` : 'Starting from'}
            </span>
            <span className="text-base sm:text-lg font-black text-amber-800">
              ₹{Number(startingPrice).toLocaleString('en-IN')}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cakes/${product.slug}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-chocolate font-extrabold text-xs rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span>Order</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Subcategory Card
const ThemeSubcategoryCard = ({ subcategory, isSelected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative group text-left rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
      isSelected
        ? 'border-amber-500 shadow-xl ring-4 ring-amber-400/30 scale-[1.02]'
        : 'border-transparent hover:border-amber-300 hover:shadow-lg hover:-translate-y-1'
    }`}
  >
    {/* Cover Image */}
    <div className="aspect-[4/3] w-full overflow-hidden bg-amber-50/60 relative">
      {subcategory.image_url ? (
        <img
          src={formatImageUrl(subcategory.image_url)}
          alt={subcategory.name}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isSelected ? 'scale-108' : 'group-hover:scale-108'
          }`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-amber-100">
          <ImageIcon className="w-8 h-8 text-amber-300" />
          <span className="text-[10px] text-amber-600 font-semibold">Theme Collection</span>
        </div>
      )}

      {/* Gradient Shade */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity ${
          isSelected ? 'opacity-95' : 'opacity-75 group-hover:opacity-85'
        }`}
      />

      {/* Selected Indicator Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-amber-400 text-chocolate text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Active</span>
        </div>
      )}

      {/* Title & Description at Bottom of Image */}
      <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-white">
        <h3 className="font-serif font-bold text-base sm:text-lg leading-tight drop-shadow-md text-white">
          {subcategory.name}
        </h3>
        {subcategory.description && (
          <p className="text-white/80 text-[11px] sm:text-xs mt-1 line-clamp-1 drop-shadow-xs font-normal">
            {subcategory.description}
          </p>
        )}
      </div>
    </div>
  </button>
);

const ThemeCakePage = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);
  const [themeCategoryId, setThemeCategoryId] = useState(null);

  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');

  const cakesSectionRef = useRef(null);

  // Fetch Theme Cakes parent category & its subcategories
  useEffect(() => {
    let isMounted = true;
    const fetchThemes = async () => {
      setLoadingSubcategories(true);
      try {
        const res = await api.get('/categories/theme-cakes');
        if (isMounted && res.data?.data) {
          const cat = res.data.data;
          setThemeCategoryId(cat.id);
          setSubcategories(cat.subcategories || []);
        }
      } catch (err) {
        // Fallback: search all categories
        try {
          const res2 = await api.get('/categories');
          const catsList = Array.isArray(res2.data?.data) ? res2.data.data : [];
          if (isMounted && catsList.length > 0) {
            const match = catsList.find(
              (c) => c.slug === 'theme-cakes' || (c.name || '').toLowerCase().includes('theme')
            );
            if (match) {
              setThemeCategoryId(match.id);
              setSubcategories(match.subcategories || []);
            }
          }
        } catch (_) {}
      } finally {
        if (isMounted) setLoadingSubcategories(false);
      }
    };

    fetchThemes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products (all theme cakes or filtered by chosen subcategory)
  useEffect(() => {
    let isMounted = true;
    const fetchCakes = async () => {
      setLoadingProducts(true);
      try {
        let url = '/products?per_page=48';
        if (selectedSubcat?.id) {
          url += `&subcategory_id=${selectedSubcat.id}`;
        } else if (themeCategoryId) {
          url += `&category_id=${themeCategoryId}`;
        } else {
          url += '&category=theme-cakes';
        }

        const res = await api.get(url);
        if (isMounted) {
          setProducts(res.data?.data || []);
        }
      } catch (err) {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    fetchCakes();
    return () => {
      isMounted = false;
    };
  }, [selectedSubcat, themeCategoryId]);

  const handleSubcategorySelect = (subcat) => {
    setSelectedSubcat((prev) => (prev?.id === subcat.id ? null : subcat));
    setSearch('');
    setTimeout(() => {
      cakesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredProducts = products.filter(
    (p) => !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF7] via-white to-amber-50/20 pb-20">
      
      {/* 1. Hero Studio Banner */}
      <div className="relative bg-gradient-to-r from-chocolate via-[#3E1E0E] to-chocolate text-white py-12 sm:py-16 px-4 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-widest bg-amber-950/70 border border-amber-500/40 px-4 py-1.5 rounded-full shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Artisan Theme Cake Studio</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Theme Cakes
          </h1>

          <p className="text-amber-100/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Every celebration deserves a handcrafted centerpiece as unique as your story. Explore our exclusive themed collections below.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-xs text-amber-200/90 font-medium">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> 100% Handcrafted</span>
            <span className="w-1 h-1 rounded-full bg-amber-500/60 hidden sm:block" />
            <span className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-amber-400" /> Custom Flavors</span>
            <span className="w-1 h-1 rounded-full bg-amber-500/60 hidden sm:block" />
            <span className="flex items-center gap-1.5"><PartyPopper className="w-3.5 h-3.5 text-amber-400" /> Pure Eggless & With Egg</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">

        {/* 2. Subcategory Theme Cards Showcase */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate tracking-tight">
                Explore Themes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose a theme category to discover all matching artisan cakes
              </p>
            </div>

            {selectedSubcat && (
              <button
                type="button"
                onClick={() => setSelectedSubcat(null)}
                className="self-start sm:self-auto text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Viewing: <strong>{selectedSubcat.name}</strong></span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loadingSubcategories ? (
            <div className="flex items-center justify-center py-16 gap-3 text-amber-800">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Loading theme collections...</span>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-amber-100 p-8">
              <Crown className="w-10 h-10 text-amber-300 mx-auto mb-2" />
              <div className="font-serif font-bold text-lg text-chocolate">Themes Updating</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Our bakers are preparing exciting themes. Check back shortly!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {subcategories.map((subcat) => (
                <ThemeSubcategoryCard
                  key={subcat.id}
                  subcategory={subcat}
                  isSelected={selectedSubcat?.id === subcat.id}
                  onClick={() => handleSubcategorySelect(subcat)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 3. Cakes Display Section */}
        <section ref={cakesSectionRef} className="pt-4">
          
          {/* Section Bar: Theme Pills Switcher + Search Box */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-100/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            {/* Quick Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedSubcat(null)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubcat === null
                    ? 'bg-chocolate text-white shadow-xs'
                    : 'bg-amber-50 text-chocolate hover:bg-amber-100'
                }`}
              >
                All Theme Cakes ({products.length})
              </button>

              {subcategories.map((subcat) => (
                <button
                  key={subcat.id}
                  type="button"
                  onClick={() => setSelectedSubcat(subcat)}
                  className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSubcat?.id === subcat.id
                      ? 'bg-chocolate text-white shadow-xs'
                      : 'bg-amber-50 text-chocolate hover:bg-amber-100'
                  }`}
                >
                  {subcat.name}
                </button>
              ))}
            </div>

            {/* In-theme Search */}
            <div className="relative min-w-[220px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search within cakes..."
                className="w-full pl-9.5 pr-8 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-chocolate placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-chocolate"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div className="flex items-center justify-center py-24 gap-3 text-amber-800">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-sm font-medium">Loading fresh theme creations...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-amber-100 p-8 space-y-3">
              <Cake className="w-12 h-12 text-amber-300 mx-auto" />
              <div className="font-serif font-bold text-lg text-chocolate">No Cakes Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search
                  ? `No cakes matched "${search}". Try clearing your search.`
                  : 'No cakes are currently listed in this category.'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-bold text-amber-800 underline mt-2 inline-block cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredProducts.map((product) => (
                <ThemeCakeCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default ThemeCakePage;
