import React, { useState } from 'react';
import confetti from 'canvas-confetti';

// Vector SVG Artwork for Gourmet Bakery Pieces
const CakePieceSVG = ({ type = 'strawberry', className = "w-full h-full" }) => {
  switch (type) {
    case 'chocolate':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Chocolate Ganache Cake Slice */}
          <path d="M12 44L48 52L54 28L18 20L12 44Z" fill="#3D2314" />
          {/* Cake Layers */}
          <path d="M12 44L48 52V46L12 38V44Z" fill="#24140A" />
          <path d="M12 38L48 46V40L12 32V38Z" fill="#5C3826" />
          <path d="M12 32L48 40V34L12 26V32Z" fill="#24140A" />
          <path d="M12 26L48 34V31L12 23V26Z" fill="#7C4524" />
          {/* Top Glaze */}
          <path d="M12 23L48 31L54 26L18 18L12 23Z" fill="#180C05" />
          <path d="M12 23C15 25 17 22 20 25C23 28 25 24 28 27C31 30 33 26 36 29C40 32 44 28 48 31" stroke="#3D2314" strokeWidth="2.5" strokeLinecap="round" />
          {/* Chocolate Curls & Gold Leaf */}
          <ellipse cx="32" cy="23" rx="5" ry="3" fill="#3D2314" stroke="#D97706" strokeWidth="1" transform="rotate(-15 32 23)" />
          <circle cx="28" cy="20" r="1.5" fill="#FBBF24" />
          <circle cx="37" cy="24" r="1" fill="#FBBF24" />
          <circle cx="34" cy="18" r="1.2" fill="#FDE68A" />
        </svg>
      );

    case 'cupcake':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Cupcake Liner */}
          <path d="M18 36L22 56H42L46 36H18Z" fill="#F59E0B" />
          <path d="M22 36L25 56M28 36L30 56M34 36L34 56M40 36L38 56M46 36L42 56" stroke="#B45309" strokeWidth="1.5" />
          {/* Swirled Frosting */}
          <path d="M16 36C16 30 22 26 32 26C42 26 48 30 48 36C46 38 43 38 41 36C38 34 35 34 32 36C29 38 26 38 23 36C20 34 18 35 16 36Z" fill="#FFF1F2" />
          <path d="M20 28C20 22 25 18 32 18C39 18 44 22 44 28C41 30 38 29 35 28C32 27 29 27 26 28C23 29 21 29 20 28Z" fill="#FFE4E6" />
          <path d="M25 20C26 14 29 11 32 11C35 11 38 14 39 20C37 21 35 20 32 20C29 20 27 21 25 20Z" fill="#FDA4AF" />
          {/* Cherry on Top */}
          <circle cx="32" cy="9" r="4.5" fill="#E11D48" />
          <path d="M32 6C34 2 39 2 41 4" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="30.5" cy="7.5" r="1.2" fill="#FFE4E6" />
          {/* Rainbow Sprinkles */}
          <circle cx="24" cy="31" r="1.2" fill="#3B82F6" />
          <circle cx="39" cy="30" r="1.2" fill="#10B981" />
          <circle cx="31" cy="24" r="1.2" fill="#F59E0B" />
          <circle cx="26" cy="23" r="1.2" fill="#8B5CF6" />
        </svg>
      );

    case 'redvelvet':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Red Velvet Slice */}
          <path d="M12 44L48 52L54 28L18 20L12 44Z" fill="#BE123C" />
          {/* Red Sponge Layers & White Cream Cheese */}
          <path d="M12 44L48 52V47L12 39V44Z" fill="#881337" />
          <path d="M12 39L48 47V44L12 36V39Z" fill="#FFFDF9" stroke="#FDE68A" strokeWidth="0.5" />
          <path d="M12 36L48 44V39L12 31V36Z" fill="#9F1239" />
          <path d="M12 31L48 39V36L12 28V31Z" fill="#FFFDF9" stroke="#FDE68A" strokeWidth="0.5" />
          <path d="M12 28L48 36V31L12 23V28Z" fill="#BE123C" />
          {/* Top White Cream Frosting */}
          <path d="M12 23L48 31L54 26L18 18L12 23Z" fill="#FFFDF9" />
          {/* Red Velvet Crumbs */}
          <circle cx="25" cy="22" r="1.5" fill="#9F1239" />
          <circle cx="32" cy="25" r="1.8" fill="#BE123C" />
          <circle cx="40" cy="27" r="1.2" fill="#881337" />
          <circle cx="46" cy="28" r="1.5" fill="#E11D48" />
          <circle cx="36" cy="21" r="1" fill="#BE123C" />
        </svg>
      );

    case 'cheesecake':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Graham Crust */}
          <path d="M12 44L48 52L54 48L18 40L12 44Z" fill="#B45309" />
          {/* Smooth Cream Cheesecake */}
          <path d="M12 40L48 48L54 26L18 18L12 40Z" fill="#FEF3C7" />
          {/* Blueberry Jam Topping */}
          <path d="M12 23L48 31L54 26L18 18L12 23Z" fill="#312E81" />
          {/* Glossy Dripping Blueberries */}
          <circle cx="26" cy="22" r="3.5" fill="#1E1B4B" />
          <circle cx="34" cy="25" r="3.2" fill="#1E1B4B" />
          <circle cx="42" cy="27" r="3.5" fill="#312E81" />
          <circle cx="25" cy="20.5" r="1" fill="#818CF8" />
          <circle cx="33" cy="23.5" r="1" fill="#818CF8" />
          <circle cx="41" cy="25.5" r="1" fill="#818CF8" />
          {/* Drips */}
          <path d="M22 24C22 28 25 28 25 24" fill="#312E81" />
          <path d="M37 28C37 32 39 32 39 28" fill="#312E81" />
        </svg>
      );

    case 'strawberry':
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Golden Vanilla Sponge Slice */}
          <path d="M12 44L48 52L54 28L18 20L12 44Z" fill="#FDE68A" />
          {/* Cream & Jam Layers */}
          <path d="M12 44L48 52V46L12 38V44Z" fill="#F59E0B" />
          <path d="M12 38L48 46V43L12 35V38Z" fill="#FFFBEB" />
          <path d="M12 35L48 43V41L12 33V35Z" fill="#FB7185" />
          <path d="M12 33L48 41V35L12 27V33Z" fill="#FDE68A" />
          <path d="M12 27L48 35V32L12 24V27Z" fill="#FFFBEB" />
          {/* Top Whipped White Cream */}
          <path d="M12 24L48 32L54 27L18 19L12 24Z" fill="#FFFDF9" stroke="#FED7AA" strokeWidth="0.8" />
          {/* Ripe Strawberry on Top */}
          <path d="M32 10C35 10 38 14 38 18C38 22 34 25 32 25C30 25 26 22 26 18C26 14 29 10 32 10Z" fill="#E11D48" />
          {/* Strawberry Leaves */}
          <path d="M32 9L29 7M32 9L35 7M32 9L32 6" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
          {/* Strawberry Seeds */}
          <circle cx="30" cy="15" r="0.8" fill="#FEF08A" />
          <circle cx="34" cy="15" r="0.8" fill="#FEF08A" />
          <circle cx="32" cy="19" r="0.8" fill="#FEF08A" />
        </svg>
      );
  }
};

const PIECES_CONFIG = [
  {
    id: 'cake-1',
    name: 'Strawberry Delight',
    type: 'strawberry',
    size: 'w-11 h-11 sm:w-14 sm:h-14',
    position: 'top-10 left-3 sm:left-6 md:left-10',
    animationClass: 'animate-[floatCakeSlow_4.8s_ease-in-out_infinite]',
    delay: '0s',
    rotation: '-8deg',
  },
  {
    id: 'cake-2',
    name: 'Truffle Fudge Pastry',
    type: 'chocolate',
    size: 'w-10 h-10 sm:w-13 sm:h-13',
    position: 'top-20 right-3 sm:right-8 md:right-14',
    animationClass: 'animate-[floatCakeFast_4.2s_ease-in-out_infinite]',
    delay: '0.8s',
    rotation: '12deg',
  },
  {
    id: 'cake-3',
    name: 'Sweet Velvet Cupcake',
    type: 'cupcake',
    size: 'w-12 h-12 sm:w-15 sm:h-15',
    position: 'bottom-16 left-5 sm:left-12 md:left-18',
    animationClass: 'animate-[floatCakeMedium_5.2s_ease-in-out_infinite]',
    delay: '1.4s',
    rotation: '6deg',
  },
  {
    id: 'cake-4',
    name: 'Red Velvet Slice',
    type: 'redvelvet',
    size: 'w-11 h-11 sm:w-14 sm:h-14',
    position: 'bottom-20 right-4 sm:right-10 md:right-16',
    animationClass: 'animate-[floatCakeSlow_4.5s_ease-in-out_infinite]',
    delay: '2.1s',
    rotation: '-14deg',
  },
  {
    id: 'cake-5',
    name: 'Blueberry Cheesecake',
    type: 'cheesecake',
    size: 'w-9 h-9 sm:w-12 sm:h-12',
    position: 'top-1/2 left-2 sm:left-4 -translate-y-1/2',
    animationClass: 'animate-[floatCakeFast_4.6s_ease-in-out_infinite]',
    delay: '1.1s',
    rotation: '15deg',
  },
  {
    id: 'cake-6',
    name: 'Glazed Pastry Bite',
    type: 'strawberry',
    size: 'w-10 h-10 sm:w-13 sm:h-13',
    position: 'top-1/2 right-2 sm:right-4 -translate-y-1/2',
    animationClass: 'animate-[floatCakeMedium_5s_ease-in-out_infinite]',
    delay: '1.9s',
    rotation: '-10deg',
  },
];

export const FloatingCakePieces = ({ inHero = true }) => {
  const [activePop, setActivePop] = useState(null);

  const handleCakeClick = (piece, e) => {
    e.stopPropagation();

    // Trigger playful mini sprinkle blast
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 24,
      spread: 60,
      origin: { x, y },
      colors: ['#FF6600', '#F59E0B', '#F43F5E', '#10B981', '#FBBF24'],
      ticks: 120,
      gravity: 1.2,
      scalar: 0.75,
      disableForReducedMotion: true,
    });

    setActivePop(piece.id);
    setTimeout(() => setActivePop(null), 1800);
  };

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${inHero ? 'z-20' : 'z-0'}`}>
      {PIECES_CONFIG.map((piece) => {
        const isPopped = activePop === piece.id;

        return (
          <div
            key={piece.id}
            className={`absolute pointer-events-auto transition-transform duration-300 group cursor-pointer ${piece.position}`}
            style={{
              animationDelay: piece.delay,
            }}
            onClick={(e) => handleCakeClick(piece, e)}
            title={`Click to taste ${piece.name}! 🍰`}
          >
            {/* Animated Floating Container */}
            <div
              className={`relative ${piece.size} ${piece.animationClass} transition-transform duration-200 group-hover:scale-125 ${
                isPopped ? 'rotate-[360deg] scale-135' : ''
              }`}
              style={{ transform: `rotate(${piece.rotation})` }}
            >
              {/* Soft Ambient Bakery Glow */}
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md group-hover:bg-amber-400/45 transition-all" />
              
              {/* SVG Cake Piece Illustration */}
              <div className="relative w-full h-full drop-shadow-md group-hover:drop-shadow-xl transition-all">
                <CakePieceSVG type={piece.type} />
              </div>

              {/* Playful Floating Hearts & Sparkles on Click */}
              {isPopped && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-chocolate text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce border border-amber-400/40">
                  Sweet! +1 💖
                </div>
              )}

              {/* Subtle Hover Tooltip */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                {piece.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FloatingCakePieces;
