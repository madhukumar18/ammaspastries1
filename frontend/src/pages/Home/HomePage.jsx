import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/UI/ProductCard';
import CategoryImagesCarousel from '../../components/UI/CategoryImagesCarousel';
import FloatingCakePieces from '../../components/UI/FloatingCakePieces';
import { ProductCardSkeleton, BannerSkeleton } from '../../components/UI/SkeletonLoader';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Star,
  Award,
  ArrowRight,
  HeartHandshake,
  Cake,
  Globe2,
  CheckCircle2,
  Crown
} from 'lucide-react';

// Typewriter header component exclusively for the hero banner title
const BannerTypewriter = ({ text = '', isActive }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 65);

      return () => clearInterval(interval);
    }, 200);

    return () => clearTimeout(timeout);
  }, [text, isActive]);

  return (
    <div className="grid grid-cols-1">
      {/* Invisible anchor maintaining exact text wrapping and container height without layout shift */}
      <h1
        aria-hidden="true"
        className="font-banner text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-[46px] font-extrabold leading-[1.12] tracking-tight drop-shadow-md text-transparent select-none pointer-events-none invisible"
        style={{ gridArea: '1 / 1' }}
      >
        {text}
      </h1>
      {/* Live typewriter text */}
      <h1
        className="font-banner text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-[46px] font-extrabold leading-[1.12] tracking-tight drop-shadow-md text-white"
        style={{ gridArea: '1 / 1' }}
      >
        <span>{displayedText}</span>
        {isActive && (
          <span
            className={`inline-block w-[3px] sm:w-1 md:w-1.5 h-[0.82em] bg-amber-400 ml-1.5 align-middle rounded-full shadow-sm ${
              isTyping ? 'animate-pulse' : 'opacity-0 transition-opacity duration-500'
            }`}
          />
        )}
      </h1>
    </div>
  );
};

const HomePage = () => {
  // State for homepage sections
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [giftingProducts, setGiftingProducts] = useState([]);
  const [dreamCake, setDreamCake] = useState(null);
  const [latestActiveTab, setLatestActiveTab] = useState('new'); // 'new' or 'popular'
  const [newArrivals, setNewArrivals] = useState([]);
  const [mostPopular, setMostPopular] = useState([]);
  const [themeCakes, setThemeCakes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch homepage data
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [
          bannersRes,
          giftingRes,
          dreamRes,
          newRes,
          popRes,
          countriesRes,
          reviewsRes,
          themeCakesRes,
        ] = await Promise.allSettled([
          api.get('/content/banners'),
          api.get('/gifting'),
          api.get('/dream-cake'),
          api.get('/new-arrivals'),
          api.get('/most-popular'),
          api.get('/content/countries'),
          api.get('/reviews?featured=1'),
          api.get('/products?category=theme-cakes&limit=4'),
        ]);

        if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.data) {
          setBanners(bannersRes.value.data.data);
        }
        if (giftingRes.status === 'fulfilled' && giftingRes.value.data?.data) {
          setGiftingProducts(giftingRes.value.data.data);
        }
        if (dreamRes.status === 'fulfilled' && dreamRes.value.data?.data) {
          setDreamCake(dreamRes.value.data.data);
        }
        if (newRes.status === 'fulfilled' && newRes.value.data?.data) {
          setNewArrivals(newRes.value.data.data);
        }
        if (popRes.status === 'fulfilled' && popRes.value.data?.data) {
          setMostPopular(popRes.value.data.data);
        }
        if (themeCakesRes.status === 'fulfilled' && themeCakesRes.value.data?.data) {
          setThemeCakes(themeCakesRes.value.data.data);
        }
        if (countriesRes.status === 'fulfilled' && countriesRes.value.data?.data) {
          setCountries(countriesRes.value.data.data);
        }
        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data?.data) {
          setReviews(reviewsRes.value.data.data);
        }
      } catch (err) {
        console.warn('Error fetching homepage components:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Automatic banner rotation
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Ambient Floating Cakes across entire homepage without names */}
      <FloatingCakePieces />

      {/* 1 & 2: HERO BANNER & CATEGORY SHOWCASE (Single-Viewport Fit on Laptop/Desktop) */}
      <div className="above-the-fold-wrapper relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-1 sm:pt-2 lg:h-[calc(100dvh-140px)] lg:max-h-[calc(100dvh-140px)] flex flex-col justify-between gap-2.5 lg:gap-3">
        {/* 1. HERO BANNER CAROUSEL (~56% of viewport on desktop) */}
        <section className="relative w-full flex-shrink-0 lg:flex-[1.35] lg:min-h-0 flex flex-col justify-center">
          {loading && banners.length === 0 ? (
            <BannerSkeleton />
          ) : banners.length > 0 ? (
            <div className="relative w-full h-[280px] sm:h-[350px] md:h-[410px] lg:h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-warm-lg bg-chocolate">
              {banners.map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <picture className="w-full h-full block">
                    {banner.mobile_image_url && (
                      <source media="(max-width: 640px)" srcSet={banner.mobile_image_url} />
                    )}
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover object-[center_28%] sm:object-[center_22%]"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 sm:via-black/50 to-black/20 sm:to-transparent flex items-center">
                    <div
                      key={`${banner.id || idx}-${idx === currentBanner ? 'active' : 'inactive'}`}
                      className="max-w-xl p-4 sm:p-7 md:p-10 lg:p-6 xl:p-10 text-white space-y-2 sm:space-y-3 lg:space-y-2.5 xl:space-y-4 font-banner"
                    >
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full backdrop-blur-xs shadow-md animate-banner-badge font-banner">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-200" /> Handcrafted Daily
                      </span>
                      <BannerTypewriter text={banner.title} isActive={idx === currentBanner} />
                      <p className="text-xs sm:text-sm lg:text-xs xl:text-base text-slate-200 leading-relaxed max-w-md line-clamp-2 font-medium drop-shadow-sm animate-banner-subtitle font-banner">
                        {banner.subtitle}
                      </p>
                      <div className="pt-0.5 sm:pt-1">
                        <Link
                          to={banner.button_url || '/category/cakes-pastries'}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-[length:200%_auto] hover:bg-right hover:scale-105 text-chocolate font-extrabold text-xs sm:text-sm lg:text-xs xl:text-sm px-4 sm:px-6 lg:px-5 xl:px-6 py-2 sm:py-2.5 lg:py-2 xl:py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-banner-btn group font-banner"
                        >
                          <span>{banner.button_text || 'Order Now'}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Carousel navigation arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={prevBanner}
                    className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/30 hover:bg-white/80 text-white hover:text-chocolate backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Previous banner"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={nextBanner}
                    className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/30 hover:bg-white/80 text-white hover:text-chocolate backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Next banner"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentBanner(i)}
                        className={`h-2 sm:h-2.5 rounded-full transition-all ${
                          i === currentBanner ? 'w-6 sm:w-8 bg-amber-400' : 'w-2 sm:w-2.5 bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </section>

        {/* 2. CATEGORY IMAGES MOVING CAROUSEL (~40% of available height on desktop) */}
        <section className="relative w-full flex-shrink-0 lg:flex-1 lg:min-h-0 flex flex-col justify-center">
          <CategoryImagesCarousel isAboveTheFold={true} />
        </section>
      </div>

      <div className="space-y-12 sm:space-y-20 mt-8 sm:mt-14">

      {/* 3. ATTRACTIVE CAKE INTRODUCTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-cream via-amber-50/50 to-cream rounded-3xl p-8 sm:p-12 md:p-16 border border-amber-200/60 shadow-warm relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-100/70 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Cake className="w-4 h-4" /> Artisanal Bakery Craftsmanship
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-chocolate leading-tight">
              Freshly Baked. Beautifully Crafted. Made With Love.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              From everyday celebrations to unforgettable moments, Ammas Pastries brings freshly crafted cakes,
              European-style pastries and oven-warm treats directly to your doorstep in 45 minutes to 1 hour.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left">
              <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
                  🥛
                </div>
                <h3 className="font-bold text-sm text-chocolate mb-1">100% Pure Dairy Cream</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Zero artificial palm fats or vegetable shortening. Only authentic fresh dairy cream.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                  🌱
                </div>
                <h3 className="font-bold text-sm text-chocolate mb-1">100% Eggless Choices</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Fluffy, light and moist vegetarian sponges baked in certified separate bakery kitchens.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
                  ⚡
                </div>
                <h3 className="font-bold text-sm text-chocolate mb-1">45-Min Express Delivery</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Chilled cake carriers and dedicated riders ensure your cakes arrive intact and ready to cut.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR IN GIFTING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Celebration Favs
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate mt-0.5">
              Popular in Gifting
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Top picks loved by our customers for birthdays, anniversaries & surprise treats
            </p>
          </div>
          <Link
            to="/category/cakes-pastries"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>View All Cakes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {giftingProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. DREAM CAKE / TAILORED FOR YOUR OCCASIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-chocolate via-chocolate-light to-amber-950 text-white shadow-warm-lg p-8 sm:p-12 md:p-16 border-2 border-amber-600/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-chocolate px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                {dreamCake?.badge || 'Viral Signature Bestseller'}
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-amber-100">
                {dreamCake?.title || 'Ammas Signature 5-in-1 Belgian Dream Cake'}
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {dreamCake?.description ||
                  'The sensation that took Bengaluru by storm! Packaged in an exquisite reusable golden tin box, crack through the dark chocolate shell to indulge in five divine textures of sponge, ganache, and Belgian mousse.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/category/cakes-pastries?sub=something-special"
                  className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-chocolate font-bold text-sm sm:text-base px-7 py-3.5 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                  Order Dream Cake Now
                </Link>
                <Link
                  to="/category/theme-cakes"
                  className="inline-flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-semibold text-sm px-6 py-3.5 rounded-full transition-colors"
                >
                  <span>Artisan Theme Cakes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/photo-cake"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-cream-light border border-amber-400/40 font-semibold text-sm px-6 py-3.5 rounded-full transition-colors"
                >
                  <span>Custom Photo Cake</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-500" />
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700"
                  alt="Ammas Signature Dream Cake"
                  className="relative rounded-2xl w-full max-w-sm aspect-square object-cover shadow-2xl border-2 border-amber-300/40"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. ARTISAN HANDCRAFTED THEME CAKES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full mb-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Handcrafted 3D Designer Cakes</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
              Artisan Theme Cakes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sculpted celebration showstoppers for birthdays, anniversaries, and milestone occasions
            </p>
          </div>
          <Link
            to="/category/theme-cakes"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-4 py-2 rounded-xl transition-all shadow-2xs self-start sm:self-auto"
          >
            <span>Explore All Theme Cakes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : themeCakes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {themeCakes.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-amber-50/40 rounded-3xl border border-amber-100">
            <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-chocolate">Artisan Theme Cakes in the Oven</p>
            <Link to="/category/theme-cakes" className="text-xs text-amber-700 font-semibold underline mt-1 inline-block">
              View Theme Cakes Catalog →
            </Link>
          </div>
        )}
      </section>

      {/* 6. EXPLORE OUR LATEST & GREATEST (New Arrivals & Most Popular) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Fresh From Oven
          </span>
          <h2 className="font-serif text-3xl font-bold text-chocolate">
            Explore Our Latest & Greatest
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Fresh arrivals crafted to impress every sweet tooth
          </p>

          {/* Switcher Buttons */}
          <div className="inline-flex p-1.5 bg-amber-100/60 rounded-full mt-4 border border-amber-200/80">
            <button
              onClick={() => setLatestActiveTab('new')}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                latestActiveTab === 'new'
                  ? 'bg-chocolate text-white shadow-md'
                  : 'text-chocolate hover:text-amber-800'
              }`}
            >
              New Arrivals ✨
            </button>
            <button
              onClick={() => setLatestActiveTab('popular')}
              className={`px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                latestActiveTab === 'popular'
                  ? 'bg-chocolate text-white shadow-md'
                  : 'text-chocolate hover:text-amber-800'
              }`}
            >
              Most Popular 🔥
            </button>
          </div>
        </div>

        {/* Dynamic Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(latestActiveTab === 'new' ? newArrivals : mostPopular).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to={latestActiveTab === 'new' ? '/new-arrivals' : '/most-popular'}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-6 py-2.5 rounded-full transition-colors"
          >
            <span>Explore All {latestActiveTab === 'new' ? 'New Arrivals' : 'Popular Treats'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. GIFT CAKE FROM ABROAD TO INDIA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-900 via-chocolate to-amber-950 text-white rounded-3xl p-8 sm:p-12 shadow-warm border border-amber-700/40 relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-xs">
              <Globe2 className="w-4 h-4 text-amber-400" /> Global Delivery Support
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-amber-100">
              Gift Cake From Abroad to any of our Location in India
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
              Living in USA, UK, Canada, Australia, UAE or anywhere in the world? Send fresh celebratory cakes and treats to your loved ones in Bengaluru with seamless international Razorpay checkout.
            </p>
          </div>

          {/* Country Cards Carousel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
            {(countries.length > 0 ? countries : [
              { name: 'USA', flag_image: '🇺🇸', currency_label: 'USD ($)' },
              { name: 'UK', flag_image: '🇬🇧', currency_label: 'GBP (£)' },
              { name: 'Canada', flag_image: '🇨🇦', currency_label: 'CAD ($)' },
              { name: 'Australia', flag_image: '🇦🇺', currency_label: 'AUD ($)' },
              { name: 'UAE', flag_image: '🇦🇪', currency_label: 'AED (د.إ)' },
              { name: 'Singapore', flag_image: '🇸🇬', currency_label: 'SGD ($)' },
              { name: 'Germany', flag_image: '🇩🇪', currency_label: 'EUR (€)' },
            ]).map((country, idx) => (
              <div
                key={idx}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center transition-all hover:scale-105"
              >
                <div className="text-3xl mb-1">{country.flag_image}</div>
                <div className="text-xs font-bold text-white">{country.name}</div>
                <div className="text-[10px] text-amber-300 mt-0.5">{country.currency_label || 'Accepted'}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/category/cakes-pastries"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-chocolate font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-md"
            >
              <span>Send A Cake To India Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE AMMAS PASTRIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="font-serif text-3xl font-bold text-chocolate">
            Why Choose Ammas Pastries?
          </h2>
          <p className="text-sm font-semibold text-amber-800">
            Reasons our treats stand above others
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Customer Reviews & Ratings */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm flex flex-col justify-between hover:shadow-warm-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <h3 className="font-serif font-bold text-lg text-chocolate mb-2">
                Customer Reviews & Ratings
              </h3>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">4.9 / 5.0 (15,000+ Happy Customers)</span>
              </div>
              {reviews.length > 0 && (
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 text-xs text-slate-600 italic">
                  "{reviews[0].comment}"
                  <div className="font-bold text-chocolate not-italic text-[11px] mt-1.5">
                    — {reviews[0].customer_name}, {reviews[0].customer_location}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link to="/about-us" className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                Read Verified Stories →
              </Link>
            </div>
          </div>

          {/* Card 2: 100% Safe & Secure Payments */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm flex flex-col justify-between hover:shadow-warm-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-chocolate mb-2">
                100% Safe & Secure Payments
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Pay using secure payment methods powered by Razorpay. We support UPI, Google Pay, PhonePe, all major Debit/Credit Cards, Net Banking, and international payment gateways.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">UPI / QR</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">Visa / Mastercard</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">RuPay</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-md">256-Bit SSL</span>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Verified Checkout
              </span>
            </div>
          </div>

          {/* Card 3: Timely Delivery */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm flex flex-col justify-between hover:shadow-warm-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-chocolate mb-2">
                Timely Delivery
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Freshness guaranteed with reliable and fast delivery to your doorstep in 45 Mins to 1 Hour. We transport our cakes in shock-absorbing thermal boxes to keep them pristine.
              </p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>45 - 60 Min Instant Express Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Custom Scheduled Time Slots (10AM - 10PM)</span>
                </div>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link to="/track-order" className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                Live Order Tracker →
              </Link>
            </div>
          </div>

        </div>
      </section>

      </div>
    </div>
  );
};

export default HomePage;
