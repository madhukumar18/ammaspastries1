import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Sparkles,
  MapPin,
  Cake,
  Heart,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import founderImg from '../../assets/founder.jpg';

// ── Animated Counter Hook ─────────────────────────────────────────────────────
const useCounter = (end, duration = 2000, startTrigger = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startTrigger) return;
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [end, duration, startTrigger]);

  return count;
};

const AboutPage = () => {
  const [inView, setInView] = useState(false);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);
  const heroRef = useRef(null);

  // Trigger animations when stats section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
        }
      },
      { threshold: 0.25 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Set hero section visible immediately on mount
  useEffect(() => {
    setInView(true);
  }, []);

  // Animated counters
  const outletCount = useCounter(50, 2200, statsInView);
  const yearsCount = useCounter(21, 2000, statsInView);
  const celebrationsCount = useCounter(100, 2400, statsInView);

  return (
    <div className="relative min-h-screen bg-[#0c0806] text-amber-50 overflow-hidden selection:bg-amber-500 selection:text-black font-sans">
      
      {/* ── AMBIENT BACKGROUND GLOW & ANIMATED PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top warm radial highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-600/15 via-amber-900/10 to-transparent blur-3xl opacity-60 pointer-events-none" />

        {/* Ambient floating blur lights */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-700/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-2/3 right-10 w-[450px] h-[450px] bg-rose-950/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />

        {/* Subtle grid texture */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#F59E0B 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-20 sm:space-y-32">
        
        {/* ── HEADER HERO BADGE ── */}
        <div 
          ref={heroRef}
          className={`text-center space-y-5 max-w-3xl mx-auto transition-all duration-1000 transform ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-300 bg-amber-950/70 border border-amber-800/60 px-4 py-1.5 rounded-full shadow-lg shadow-black/40 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Since 2003 • 20+ Years of Mastery</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500/80 leading-[1.15]">
            Slice of our Story
          </h1>

          <p className="text-sm sm:text-base text-amber-200/70 max-w-xl mx-auto font-light leading-relaxed">
            Crafting pure happiness and sweet smiles — born from a master chef’s passion and nurtured by a family dedicated to good taste.
          </p>
        </div>

        {/* ── SIDE-BY-SIDE FOUNDER ARCHIVE SHOWCASE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT: FOUNDER IMAGE SHOWCASE (Strictly Object-Contain, Uncropped, Responsive) */}
          <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
            <div className="relative w-full max-w-lg group">
              
              {/* Outer decorative ambient glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-700/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition duration-700 pointer-events-none" />

              {/* The Image Container with Background Fill for Aspect Contain */}
              <div className="relative rounded-3xl bg-[#140e0a] border border-amber-800/40 p-3 sm:p-4 shadow-2xl shadow-black/90 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-[1.01]">
                
                {/* Archival corner ornaments */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400/60 pointer-events-none" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400/60 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400/60 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400/60 pointer-events-none" />

                {/* IMAGE (object-fit: contain, full visibility guaranteed on all devices) */}
                <div className="w-full flex items-center justify-center bg-gradient-to-b from-[#1c130d] via-[#120b08] to-[#0a0705] rounded-2xl overflow-hidden py-2">
                  <img
                    src={founderImg}
                    alt="Master Chef Mr. Anthony, Founder of Ammas Pastries, at the original outlet established in 2003"
                    className="w-full h-auto max-h-[520px] object-contain rounded-xl select-none transition-transform duration-700 group-hover:scale-[1.02]"
                    loading="eager"
                  />
                </div>

                {/* Photo Caption Badge */}
                <div className="w-full pt-3.5 pb-1 px-3 text-center border-t border-amber-900/40 mt-3 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-amber-200/80">
                  <div className="flex items-center gap-1.5 font-medium text-amber-300">
                    <Cake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Mr. Anthony, Founder & Master Chef</span>
                  </div>
                  <span className="font-mono text-amber-400/70 text-[10px] bg-amber-950/90 border border-amber-800/50 px-2 py-0.5 rounded-full">
                    Est. 2003
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: THE PARAGRAPH CONTENT (Used verbatim as provided) */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 lg:pl-4">
            
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <span className="w-8 h-[2px] bg-amber-500" />
              <span>Our Origins & Heritage</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-100 leading-tight">
              A Thought to be the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Best Tasting, Best Feeling</span> Pastry Shop
            </h2>

            {/* Paragraph 1 */}
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-light">
              The journey began like many others, but with experience on hand, many ideas, much inspiration and above all to see that smile after tasting our products... created his own line with one outlet established in 2003..by Our Master Chef, Mr. Anthony, the Founder experienced over many years came up with a thought to be the best tasting, best feeling pastry shop that all will come asking for more...
            </p>

            {/* Paragraph 2 */}
            <p className="text-sm sm:text-base text-amber-100/85 leading-relaxed font-light p-4 rounded-2xl bg-amber-950/30 border border-amber-800/30 backdrop-blur-xs italic text-amber-200/90">
              He envisioned it, he created it and all our Customers who tasted it said &ldquo;why don&apos;t you set up an outlet close to my house&rdquo; the demand grew to cater for more and the Family joined the business as this being their delicious destiny to enhance, strengthen the Operations and to say &ldquo;we care for your good taste&rdquo; always...
            </p>

            {/* Paragraph 3 */}
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-medium">
              We continue to delight our Customers with the essence of our pastry master piece...
            </p>

            {/* Paragraph 4 */}
            <p className="text-sm sm:text-base text-amber-200/95 leading-relaxed font-semibold">
              We are creative, Passionate.. we listen.. and enhancing our experience we build it with progressive changes... we are here to stay.
            </p>

            {/* CTA Button */}
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/outlets"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs sm:text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-amber-950/50 hover:shadow-amber-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Store className="w-4 h-4 text-stone-950" />
                <span>Find Our 50+ Outlets</span>
                <ChevronRight className="w-4 h-4 text-stone-950" />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 hover:text-white border border-amber-700/50 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all duration-300"
              >
                <Cake className="w-4 h-4 text-amber-400" />
                <span>Explore Pastries</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── BOLD STAT / COUNTER SECTION: 50+ OUTLETS PROMINENT FEATURE ── */}
        <div
          ref={statsRef}
          className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-[#18100a] via-[#120b07] to-[#0d0805] border border-amber-600/30 shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Subtle decorative glowing badge */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-700/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 text-center space-y-10 max-w-4xl mx-auto">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400 bg-amber-950/80 border border-amber-700/50 px-4 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Neighborhood Bakery Network</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-amber-100">
                Growing With The Love of Our Customers
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/70 max-w-xl mx-auto">
                What began with one store in 2003 has blossomed into a trusted household name across Karnataka.
              </p>
            </div>

            {/* ── THE HERO STAT: 50+ OUTLETS ── */}
            <div className="py-6 px-6 sm:px-12 rounded-3xl bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-amber-950/60 border border-amber-500/30 backdrop-blur-md max-w-2xl mx-auto shadow-inner space-y-2 transform transition-all duration-700 hover:border-amber-400/50">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-serif text-6xl sm:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 drop-shadow-[0_4px_24px_rgba(245,158,11,0.35)]">
                  {outletCount}
                </span>
                <span className="font-serif text-4xl sm:text-6xl font-bold text-amber-400">+</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-100">
                Outlets Across Bengaluru & Karnataka
              </h3>
              <p className="text-xs text-amber-300/80 max-w-md mx-auto pt-1 font-light">
                Delivering freshly baked treats in 45 minutes to 1 hour to your home, office, and celebration venue.
              </p>
            </div>

            {/* Secondary Milestone Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4">
              
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 hover:border-amber-700/50 transition-colors duration-300 space-y-1">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-200">
                  2003
                </div>
                <div className="text-[11px] sm:text-xs text-amber-300/70 uppercase tracking-wider font-medium">
                  Year Established
                </div>
                <div className="text-[10px] text-amber-200/50">One outlet by Mr. Anthony</div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 hover:border-amber-700/50 transition-colors duration-300 space-y-1">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-200">
                  {yearsCount}+ Years
                </div>
                <div className="text-[11px] sm:text-xs text-amber-300/70 uppercase tracking-wider font-medium">
                  Artisan Heritage
                </div>
                <div className="text-[10px] text-amber-200/50">Master Chef Craftsmanship</div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 hover:border-amber-700/50 transition-colors duration-300 space-y-1">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-200">
                  100%
                </div>
                <div className="text-[11px] sm:text-xs text-amber-300/70 uppercase tracking-wider font-medium">
                  Pure Quality
                </div>
                <div className="text-[10px] text-amber-200/50">Fresh Daily Batches</div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 hover:border-amber-700/50 transition-colors duration-300 space-y-1">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-200">
                  {celebrationsCount}k+
                </div>
                <div className="text-[11px] sm:text-xs text-amber-300/70 uppercase tracking-wider font-medium">
                  Smiles Sweetened
                </div>
                <div className="text-[10px] text-amber-200/50">Celebrations Each Year</div>
              </div>

            </div>

            <div className="pt-2">
              <Link
                to="/outlets"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300 hover:text-amber-100 bg-amber-900/40 hover:bg-amber-900/70 border border-amber-700/60 px-6 py-3 rounded-full transition-all duration-300"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>View All 50+ Store Addresses & Timings</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            </div>

          </div>
        </div>

        {/* ── CORE PILLARS / BRAND VALUES ── */}
        <div className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              The Essence of Ammas Pastries
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
              Why We Are Here to Stay
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="group p-6 rounded-3xl bg-[#140e0a]/80 border border-amber-800/30 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-amber-100">Creative & Passionate</h3>
              <p className="text-xs text-amber-200/70 leading-relaxed font-light">
                Every pastry is an edible masterpiece. From traditional fruit cakes to modern designer photo cakes, we pour pure passion into every bake.
              </p>
            </div>

            <div className="group p-6 rounded-3xl bg-[#140e0a]/80 border border-amber-800/30 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-amber-100">We Care For Good Taste</h3>
              <p className="text-xs text-amber-200/70 leading-relaxed font-light">
                Our customers guided our expansion: &ldquo;Why don&apos;t you set up an outlet close to my house?&rdquo; Our family joined to deliver that exact good taste everywhere.
              </p>
            </div>

            <div className="group p-6 rounded-3xl bg-[#140e0a]/80 border border-amber-800/30 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-amber-100">We Listen & Evolve</h3>
              <p className="text-xs text-amber-200/70 leading-relaxed font-light">
                We listen carefully to customer feedback, enhancing our customer experience and building our platform with progressive changes.
              </p>
            </div>

            <div className="group p-6 rounded-3xl bg-[#140e0a]/80 border border-amber-800/30 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-amber-100">Wholesome Freshness</h3>
              <p className="text-xs text-amber-200/70 leading-relaxed font-light">
                Pure dairy cream, premium ingredients, and 100% vegetarian / eggless dedicated ovens for guaranteed peace of mind.
              </p>
            </div>

          </div>
        </div>

        {/* ── FOOTER CALL TO ACTION ── */}
        <div className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border border-amber-800/40 max-w-3xl mx-auto space-y-5">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
            Taste The Ammas Pastries Difference Today
          </h3>
          <p className="text-xs sm:text-sm text-amber-200/70 max-w-md mx-auto">
            Order online for swift doorstep delivery in 45–60 minutes, or drop by any of our 50+ stores across the city.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-lg transition-transform duration-200 hover:scale-105"
            >
              Order Cakes Online
            </Link>
            <Link
              to="/outlets"
              className="bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-700/60 font-semibold text-xs sm:text-sm px-8 py-3.5 rounded-full transition-colors"
            >
              Locate 50+ Stores
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;

