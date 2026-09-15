import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: 'Cakes & Pastries',
    slug: 'cakes-pastries',
    subtitle: 'Fresh Cream & Fruit Delights',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
    target_url: '/category/cakes-pastries',
    badge_text: 'Bestseller',
  },
  {
    id: 2,
    name: 'Theme Cakes',
    slug: 'theme-cakes',
    subtitle: 'Handcrafted 3D Designer Cakes',
    image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
    target_url: '/category/theme-cakes',
    badge_text: 'Artisan 3D',
  },
  {
    id: 3,
    name: 'Photo Cake',
    slug: 'photo-cake',
    subtitle: 'Edible Custom Sugar Prints',
    image_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
    target_url: '/photo-cake',
    badge_text: 'Trending',
  },
  {
    id: 4,
    name: 'Snacks',
    slug: 'snacks',
    subtitle: 'Oven-Hot Puffs, Buns & Rolls',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700',
    target_url: '/category/snacks',
    badge_text: 'Hot & Crisp',
  },
  {
    id: 5,
    name: 'Dessert',
    slug: 'dessert',
    subtitle: 'Cheesecakes, Brownies & Treats',
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=700',
    target_url: '/category/dessert',
    badge_text: 'Indulgence',
  },
  {
    id: 6,
    name: 'Dry Fruits',
    slug: 'dry-fruits',
    subtitle: 'Roasted Cashews, Almonds & Nuts',
    image_url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=700',
    target_url: '/category/dry-fruits',
    badge_text: 'Healthy',
  },
  {
    id: 7,
    name: 'Chocolates',
    slug: 'chocolates',
    subtitle: 'Belgian Truffles & Pralines',
    image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700',
    target_url: '/category/chocolates',
    badge_text: 'Belgian',
  },
  {
    id: 8,
    name: 'Sweets',
    slug: 'sweets',
    subtitle: 'Pure Desi Ghee Indian Mithai',
    image_url: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=700',
    target_url: '/category/sweets',
    badge_text: 'Pure Ghee',
  },
  {
    id: 9,
    name: 'Pastries & Slices',
    slug: 'pastries-slices',
    subtitle: 'Single Servings & Mousse Cups',
    image_url: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=700',
    target_url: '/category/pastries-slices',
    badge_text: 'Single Serve',
  },
  {
    id: 10,
    name: 'Party Items',
    slug: 'party-items',
    subtitle: 'Candles, Sparklers & Cake Toppers',
    image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700',
    target_url: '/category/party-items',
    badge_text: 'Celebration',
  },
];

const CategoryImagesCarousel = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [carouselSettings, setCarouselSettings] = useState({
    badge_text: 'Explore Bakery Specialties',
    title: 'Fresh Confectionery Categories',
    subtitle: 'Click any category to order fresh artisan creations',
    auto_scroll: true,
    scroll_speed: 0.85,
    pause_on_hover: true,
    show_arrows: true,
    show_bottom_hint: true,
    bottom_hint: 'Click any category circle to browse full catalog',
  });
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [clickedCardKey, setClickedCardKey] = useState(null);
  const scrollRef = useRef(null);
  const animFrameRef = useRef(null);

  // Fetch live category images & display settings from backend
  useEffect(() => {
    let isMounted = true;
    api.get('/content/category-images')
      .then((res) => {
        if (isMounted) {
          if (res.data?.data && res.data.data.length > 0) {
            setCategories(res.data.data);
          }
          if (res.data?.settings) {
            setCarouselSettings((prev) => ({
              ...prev,
              ...res.data.settings,
            }));
          }
        }
      })
      .catch((err) => {
        console.warn('Using default category images showcase:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Continuous smooth auto-moving carousel that pauses on cursor hover (if enabled) or when clicked
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || categories.length === 0 || !carouselSettings.auto_scroll) return;

    let lastTimestamp = null;
    const speed = carouselSettings.scroll_speed || 0.85;

    const step = (timestamp) => {
      const shouldPause = (carouselSettings.pause_on_hover && isHovered) || Boolean(clickedCardKey);
      if (!shouldPause && container) {
        if (lastTimestamp !== null) {
          container.scrollLeft += speed;
          // When we scrolled past half the duplicated track, reset seamlessly
          const halfScroll = container.scrollWidth / 2;
          if (container.scrollLeft >= halfScroll) {
            container.scrollLeft -= halfScroll;
          }
        }
        lastTimestamp = timestamp;
      } else {
        lastTimestamp = null;
      }
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isHovered, categories, carouselSettings.auto_scroll, carouselSettings.scroll_speed, carouselSettings.pause_on_hover, clickedCardKey]);

  // Manual scroll arrows
  const handleManualScroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -260 : 260;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Enhanced tactile click animation before navigating
  const handleCardClick = (e, targetUrl, cardKey) => {
    e.preventDefault();
    if (!targetUrl || clickedCardKey) return;

    setClickedCardKey(cardKey);

    // Smooth delay allows user to experience the lively click reaction before transition
    setTimeout(() => {
      navigate(targetUrl);
    }, 400);
  };

  // Duplicate items array for infinite loop effect
  const displayItems = [...categories, ...categories];

  return (
    <section
      aria-label="Categories Showcase"
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4"
    >
      {/* Decorative Container with confectioner glow */}
      <div
        className="relative bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 rounded-3xl p-5 sm:p-7 border border-amber-200/70 shadow-warm overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredCardId(null);
        }}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => {
          setTimeout(() => setIsHovered(false), 2000);
        }}
      >
        {/* Soft Background Sparkle Accents */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Title & Direction Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
          <div>
            {carouselSettings.badge_text && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/90 border border-amber-300/80 px-3 py-0.5 rounded-full mb-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                <span>{carouselSettings.badge_text}</span>
              </div>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate tracking-tight flex items-center gap-2">
              <span>{carouselSettings.title || 'Fresh Confectionery Categories'}</span>
            </h2>
            {carouselSettings.subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                {carouselSettings.subtitle}
              </p>
            )}
          </div>

          {/* Controls: Arrow buttons (if enabled in admin settings) */}
          {carouselSettings.show_arrows && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleManualScroll('left')}
                aria-label="Scroll categories left"
                className="w-9 h-9 rounded-full bg-white hover:bg-amber-100 text-chocolate border border-amber-200 shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-amber-800" />
              </button>
              <button
                type="button"
                onClick={() => handleManualScroll('right')}
                aria-label="Scroll categories right"
                className="w-9 h-9 rounded-full bg-white hover:bg-amber-100 text-chocolate border border-amber-200 shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-amber-800" />
              </button>
            </div>
          )}
        </div>

        {/* Continuous Auto-Moving Carousel Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar py-3 px-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayItems.map((item, index) => {
            const cardKey = `${item.id}-${index}`;
            const isThisCardClicked = clickedCardKey === cardKey;
            const isAnyCardClicked = Boolean(clickedCardKey);
            const isOtherCardClicked = isAnyCardClicked && !isThisCardClicked;
            const isThisCardHovered = hoveredCardId === cardKey && !isAnyCardClicked;
            const isSiblingDimmed = isHovered && hoveredCardId && !isThisCardHovered && !isAnyCardClicked;

            return (
              <div
                key={cardKey}
                onMouseEnter={() => !isAnyCardClicked && setHoveredCardId(cardKey)}
                className={`relative flex-shrink-0 transition-all duration-300 transform ${
                  isThisCardClicked
                    ? 'scale-112 -translate-y-3 z-30'
                    : isOtherCardClicked
                    ? 'opacity-40 scale-95 blur-[0.3px]'
                    : isThisCardHovered
                    ? 'scale-106 -translate-y-2 z-20'
                    : isSiblingDimmed
                    ? 'opacity-85 scale-98'
                    : 'scale-100 z-10'
                }`}
                style={{ width: '185px' }}
              >
                {/* Expanding click shockwave ring */}
                {isThisCardClicked && (
                  <span className="absolute inset-x-2 top-0 aspect-square rounded-2xl bg-amber-400/60 animate-ping pointer-events-none -z-10" />
                )}

                <Link
                  to={item.target_url || '/category/cakes-pastries'}
                  onClick={(e) => handleCardClick(e, item.target_url, cardKey)}
                  className="group block text-center cursor-pointer focus:outline-none"
                >
                  {/* Square Bakery Photo with Glowing Golden Ring & Shimmer (No orange badge) */}
                  <div className={`relative mx-auto aspect-square w-36 h-36 sm:w-40 sm:h-40 rounded-2xl p-1.5 bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 shadow-md transition-all duration-300 ${
                    isThisCardClicked
                      ? 'ring-4 ring-amber-500 ring-offset-2 ring-offset-white shadow-2xl shadow-amber-500/60 scale-102'
                      : 'group-hover:shadow-xl group-hover:shadow-amber-500/30 group-hover:scale-102'
                  }`}>
                    
                    {/* Inner image frame */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-cream border-2 border-white/90">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                          isThisCardClicked ? 'scale-115' : 'group-hover:scale-112'
                        }`}
                      />

                      {/* Glassmorphic Shimmer sweep overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Hover Pill "Explore →" */}
                      {!isThisCardClicked && (
                        <div className="absolute inset-0 bg-chocolate/35 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <span className="inline-flex items-center gap-1 bg-white/95 text-chocolate text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <span>Explore</span>
                            <ArrowRight className="w-3 h-3 text-amber-600" />
                          </span>
                        </div>
                      )}

                      {/* Click Celebration & Loading Animation Overlay */}
                      {isThisCardClicked && (
                        <div className="absolute inset-0 z-30 rounded-xl bg-gradient-to-br from-amber-600/90 via-chocolate/85 to-amber-700/90 backdrop-blur-2xs flex flex-col items-center justify-center text-white p-2 animate-in zoom-in-75 duration-200">
                          <div className="relative flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-amber-300 animate-spin" />
                            <span className="absolute w-12 h-12 rounded-full border-2 border-amber-300 animate-ping pointer-events-none" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 mt-2 text-center drop-shadow-sm animate-pulse">
                            Opening...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Name & Tagline */}
                  <div className="mt-3 space-y-0.5 px-1">
                    <h3 className={`font-serif font-bold text-sm sm:text-base transition-colors line-clamp-1 leading-tight ${
                      isThisCardClicked ? 'text-amber-800 scale-105' : 'text-chocolate group-hover:text-amber-700'
                    }`}>
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 font-medium group-hover:text-slate-700 transition-colors">
                      {item.subtitle || 'Oven-fresh delights'}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom micro-hint */}
        {carouselSettings.show_bottom_hint && (
          <div className="mt-2 text-center">
            <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{carouselSettings.bottom_hint || 'Click any category to browse full catalog'}</span>
            </span>
          </div>
        )}

      </div>
    </section>
  );
};

export default CategoryImagesCarousel;
