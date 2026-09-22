import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductCarousel = ({
  products = [],
  title = 'You May Also Relish',
  subtitle = 'Artisan companions baked fresh daily • Same instant Add to Cart & Order Now',
  badgeText = 'Frequently Ordered Together',
  icon: Icon = Sparkles,
  className = '',
  onAddToCart,
  onOrderNow,
}) => {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    }
  };

  useEffect(() => {
    checkScroll();
    const node = carouselRef.current;
    if (node) {
      node.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (node) {
        node.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [products]);

  const handleScroll = (direction) => {
    if (!carouselRef.current) return;
    const cardWidth = window.innerWidth < 640 ? 175 : 280;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    carouselRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <section className={`relative bg-gradient-to-b from-amber-50/40 via-white to-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 border border-amber-100/90 shadow-warm ${className}`}>
      {/* Header with Title and Nav Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          {badgeText && (
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2 shadow-2xs">
              {Icon && <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />}
              <span>{badgeText}</span>
            </div>
          )}
          <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-bold text-chocolate tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5 sm:mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous products"
            className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              canScrollLeft
                ? 'bg-white hover:bg-amber-50 text-chocolate border-amber-200 shadow-xs hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next products"
            className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              canScrollRight
                ? 'bg-white hover:bg-amber-50 text-chocolate border-amber-200 shadow-xs hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={carouselRef}
        className="flex gap-2.5 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 sm:py-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((item) => (
          <div
            key={item.id}
            className="w-[160px] xs:w-[175px] sm:w-[240px] md:w-[270px] flex-shrink-0 snap-start"
          >
            <ProductCard
              product={item}
              onAddToCart={onAddToCart}
              onOrderNow={onOrderNow}
            />
          </div>
        ))}
      </div>

      {/* Subtle Progress Bar */}
      <div className="mt-3 sm:mt-4 w-full bg-amber-100/60 h-1 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(15, scrollProgress)}%` }}
        />
      </div>
    </section>
  );
};

export default ProductCarousel;
