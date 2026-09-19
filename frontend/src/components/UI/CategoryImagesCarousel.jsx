import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: 'Snacks',
    slug: 'snacks',
    subtitle: 'Puffs, Rolls, Buns &...',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/snacks',
    badge_text: 'Hot & Crisp',
  },
  {
    id: 2,
    name: 'Dessert',
    slug: 'dessert',
    subtitle: 'Cheesecakes, Rich Brownies &..',
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/dessert',
    badge_text: 'Indulgence',
  },
  {
    id: 3,
    name: 'Dry Fruits',
    slug: 'dry-fruits',
    subtitle: 'Selected Cashews, Almonds &...',
    image_url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/dry-fruits',
    badge_text: 'Healthy',
  },
  {
    id: 4,
    name: 'Chocolates',
    slug: 'chocolates',
    subtitle: 'Velvety Handcrafted Belgian...',
    image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/chocolates',
    badge_text: 'Belgian',
  },
  {
    id: 5,
    name: 'Sweets',
    slug: 'sweets',
    subtitle: 'Pure Desi Ghee Mithai & Ladoos',
    image_url: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/sweets',
    badge_text: 'Pure Ghee',
  },
  {
    id: 6,
    name: 'Pastries & Slices',
    slug: 'pastries-slices',
    subtitle: 'Single-Portion Delights & Mous...',
    image_url: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/pastries-slices',
    badge_text: 'Single Serve',
  },
  {
    id: 7,
    name: 'Cakes & Pastries',
    slug: 'cakes-pastries',
    subtitle: 'Fresh Cream & Fruit Delights',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/cakes-pastries',
    badge_text: 'Bestseller',
  },
  {
    id: 8,
    name: 'Theme Cakes',
    slug: 'theme-cakes',
    subtitle: 'Handcrafted 3D Designer Cakes',
    image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/theme-cakes',
    badge_text: 'Artisan 3D',
  },
  {
    id: 9,
    name: 'Photo Cake',
    slug: 'photo-cake',
    subtitle: 'Edible Custom Sugar Prints',
    image_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=600&q=90',
    target_url: '/photo-cake',
    badge_text: 'Trending',
  },
  {
    id: 10,
    name: 'Party Items',
    slug: 'party-items',
    subtitle: 'Candles, Sparklers & Cake Toppers',
    image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=90',
    target_url: '/category/party-items',
    badge_text: 'Celebration',
  },
];

const CategoryImagesCarousel = ({ isAboveTheFold = false, className = '' }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [carouselSettings, setCarouselSettings] = useState({
    badge_text: 'FRESHLY PREPARED',
    title: 'A Slice of Happiness !',
    subtitle: 'From dreamy designs to delicious flavours, Swipe through, pick your favourite, and let the celebrations begin! 🎂 ✨',
    auto_scroll: true,
    scroll_speed: 0.8,
    pause_on_hover: true,
    show_arrows: true,
    show_bottom_hint: true,
    bottom_hint: 'Find your perfect cake 🎂',
  });
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [clickedCardKey, setClickedCardKey] = useState(null);
  const scrollRef = useRef(null);
  const animFrameRef = useRef(null);

  // Fetch live category images & display settings from backend if available
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
      .catch(() => {
        // Fallback gracefully to default items
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Continuous smooth auto-moving carousel that pauses on hover or interaction
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || categories.length === 0 || !carouselSettings.auto_scroll) return;

    let lastTimestamp = null;
    const speed = carouselSettings.scroll_speed || 0.8;

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

  // Tactile click animation before navigating
  const handleCardClick = (e, targetUrl, cardKey) => {
    e.preventDefault();
    if (!targetUrl || clickedCardKey) return;

    setClickedCardKey(cardKey);

    setTimeout(() => {
      navigate(targetUrl);
    }, 350);
  };

  // Duplicate items array for infinite loop effect
  const displayItems = [...categories, ...categories];

  const content = (
    <div
      className={`relative bg-[#FFFDF7] rounded-2xl sm:rounded-3xl shadow-warm overflow-hidden flex flex-col justify-between transition-all duration-300 ${
        isAboveTheFold
          ? 'h-full p-2.5 sm:p-4 lg:p-3.5 xl:p-4'
          : 'p-4 sm:p-6 lg:p-6'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredCardId(null);
      }}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        setTimeout(() => setIsHovered(false), 2200);
      }}
    >
      {/* Soft Background Warmth */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Direction Arrows (Single compact row on desktop) */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-1 sm:mb-2 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {carouselSettings.badge_text && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100/95 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0 antialiased">
                <Sparkles className="w-3 h-3 text-amber-700 animate-spin-slow" />
                <span>{carouselSettings.badge_text}</span>
              </span>
            )}
            <h2 className="font-serif text-base sm:text-xl lg:text-lg xl:text-2xl font-bold text-[#2D1810] tracking-tight truncate antialiased">
              {carouselSettings.title || 'A Slice of Happiness !'}
            </h2>
          </div>
        </div>

        {/* Controls: Arrow buttons (No harsh borders, clean soft shadow) */}
        {carouselSettings.show_arrows && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleManualScroll('left')}
              aria-label="Scroll categories left"
              className="w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full bg-white hover:bg-amber-50 text-[#2D1810] shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-amber-900" />
            </button>
            <button
              type="button"
              onClick={() => handleManualScroll('right')}
              aria-label="Scroll categories right"
              className="w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full bg-white hover:bg-amber-50 text-[#2D1810] shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-amber-900" />
            </button>
          </div>
        )}
      </div>

      {/* Continuous Subpixel-Crisp Floating Carousel Track with Generous Headroom */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4.5 lg:gap-4 xl:gap-5 overflow-x-auto no-scrollbar pt-3.5 pb-2.5 sm:pt-4 sm:pb-3 px-2 scroll-smooth cursor-grab active:cursor-grabbing select-none flex-1 items-center min-h-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {displayItems.map((item, index) => {
          const cardKey = `${item.id}-${index}`;
          const isThisCardClicked = clickedCardKey === cardKey;
          const isAnyCardClicked = Boolean(clickedCardKey);
          const isOtherCardClicked = isAnyCardClicked && !isThisCardClicked;
          const staggerDelayClass = `card-float-delay-${index % 6}`;

          return (
            <div
              key={cardKey}
              onMouseEnter={() => !isAnyCardClicked && setHoveredCardId(cardKey)}
              className={`shrink-0 transition-all duration-300 floating-card-3d ${staggerDelayClass} ${
                isOtherCardClicked ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {/* Inner card container with tactile hover reaction */}
              <div
                className={`relative w-[110px] sm:w-[130px] lg:w-[clamp(95px,10vh,130px)] transition-transform duration-300 transform ${
                  isThisCardClicked
                    ? 'scale-105 -translate-y-1 z-30'
                    : 'hover:scale-105 hover:-translate-y-1.5 hover:z-20'
                }`}
              >
                <Link
                  to={item.target_url || '/category/cakes-pastries'}
                  onClick={(e) => handleCardClick(e, item.target_url, cardKey)}
                  className="group block text-center cursor-pointer focus:outline-none"
                >
                  {/* Clean Borderless Bakery Photo with Smooth Curved Corners & Razor-Sharp Clarity */}
                  <div
                    className={`relative mx-auto aspect-square w-[88px] h-[88px] sm:w-[110px] sm:h-[110px] lg:w-[clamp(78px,9vh,110px)] lg:h-[clamp(78px,9vh,110px)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-all duration-300 bg-amber-50/50 ${
                      isThisCardClicked
                        ? 'shadow-xl scale-102'
                        : 'group-hover:shadow-lg'
                    }`}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                        isThisCardClicked ? 'scale-110' : 'group-hover:scale-108'
                      }`}
                      style={{
                        imageRendering: 'auto',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                      }}
                    />

                    {/* Subtle warm shimmer sweep on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Hover Pill "Explore →" */}
                    {!isThisCardClicked && (
                      <div className="absolute inset-0 bg-black/25 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 bg-white text-[#2D1810] text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md transform translate-y-1.5 group-hover:translate-y-0 transition-transform duration-300">
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3 text-amber-600" />
                        </span>
                      </div>
                    )}

                    {/* Click Loading Animation */}
                    {isThisCardClicked && (
                      <div className="absolute inset-0 z-30 rounded-2xl sm:rounded-3xl bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white p-2 animate-in zoom-in-75 duration-200">
                        <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200 mt-1 text-center">
                          Opening...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Name Only - Razor Sharp, High Contrast, Crystal Clear */}
                  <h3
                    className={`font-serif font-bold text-xs sm:text-sm lg:text-xs xl:text-sm transition-colors line-clamp-1 leading-snug tracking-tight mt-2 px-0.5 ${
                      isThisCardClicked
                        ? 'text-amber-800'
                        : 'text-[#2D1810] group-hover:text-amber-700'
                    }`}
                    style={{
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                      textRendering: 'optimizeLegibility',
                    }}
                  >
                    {item.name}
                  </h3>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom micro-hint */}
      {carouselSettings.show_bottom_hint && (
        <div className="mt-0.5 sm:mt-1 text-center shrink-0">
          <span className="text-[10px] sm:text-[11px] text-amber-800/80 font-medium inline-flex items-center gap-1.5 antialiased">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{carouselSettings.bottom_hint || 'Find your perfect cake 🎂'}</span>
          </span>
        </div>
      )}
    </div>
  );

  if (isAboveTheFold) {
    return <div className={`w-full h-full ${className}`}>{content}</div>;
  }

  return (
    <section
      aria-label="Categories Showcase"
      className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 ${className}`}
    >
      {content}
    </section>
  );
};

export default CategoryImagesCarousel;
