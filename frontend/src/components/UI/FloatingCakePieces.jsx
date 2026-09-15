import React from 'react';

// Vector SVG Artwork for Miniature Bakery Cake Pieces
const CakePieceSVG = ({ type = 'strawberry', className = "w-full h-full" }) => {
  switch (type) {
    case 'chocolate':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Chocolate Ganache Cake Slice */}
          <path d="M12 44L48 52L54 28L18 20L12 44Z" fill="#3D2314" />
          <path d="M12 44L48 52V46L12 38V44Z" fill="#24140A" />
          <path d="M12 38L48 46V40L12 32V38Z" fill="#5C3826" />
          <path d="M12 32L48 40V34L12 26V32Z" fill="#24140A" />
          <path d="M12 26L48 34V31L12 23V26Z" fill="#7C4524" />
          <path d="M12 23L48 31L54 26L18 18L12 23Z" fill="#180C05" />
          <path d="M12 23C15 25 17 22 20 25C23 28 25 24 28 27C31 30 33 26 36 29C40 32 44 28 48 31" stroke="#3D2314" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="32" cy="23" rx="5" ry="3" fill="#3D2314" stroke="#D97706" strokeWidth="0.8" transform="rotate(-15 32 23)" />
          <circle cx="28" cy="20" r="1.2" fill="#FBBF24" />
          <circle cx="37" cy="24" r="1" fill="#FBBF24" />
        </svg>
      );

    case 'cupcake':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Cupcake Liner */}
          <path d="M18 36L22 56H42L46 36H18Z" fill="#F59E0B" />
          <path d="M22 36L25 56M28 36L30 56M34 36L34 56M40 36L38 56M46 36L42 56" stroke="#B45309" strokeWidth="1.2" />
          {/* Swirled Frosting */}
          <path d="M16 36C16 30 22 26 32 26C42 26 48 30 48 36C46 38 43 38 41 36C38 34 35 34 32 36C29 38 26 38 23 36C20 34 18 35 16 36Z" fill="#FFF1F2" />
          <path d="M20 28C20 22 25 18 32 18C39 18 44 22 44 28C41 30 38 29 35 28C32 27 29 27 26 28C23 29 21 29 20 28Z" fill="#FFE4E6" />
          <path d="M25 20C26 14 29 11 32 11C35 11 38 14 39 20C37 21 35 20 32 20C29 20 27 21 25 20Z" fill="#FDA4AF" />
          {/* Cherry */}
          <circle cx="32" cy="9" r="4" fill="#E11D48" />
          <path d="M32 6C34 2 39 2 41 4" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="30.5" cy="7.5" r="1" fill="#FFE4E6" />
          {/* Sprinkles */}
          <circle cx="24" cy="31" r="1" fill="#3B82F6" />
          <circle cx="39" cy="30" r="1" fill="#10B981" />
          <circle cx="31" cy="24" r="1" fill="#F59E0B" />
        </svg>
      );

    case 'redvelvet':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Red Velvet Slice */}
          <path d="M12 44L48 52L54 28L18 20L12 44Z" fill="#BE123C" />
          <path d="M12 44L48 52V47L12 39V44Z" fill="#881337" />
          <path d="M12 39L48 47V44L12 36V39Z" fill="#FFFDF9" />
          <path d="M12 36L48 44V39L12 31V36Z" fill="#9F1239" />
          <path d="M12 31L48 39V36L12 28V31Z" fill="#FFFDF9" />
          <path d="M12 28L48 36V31L12 23V28Z" fill="#BE123C" />
          <path d="M12 23L48 31L54 26L18 18L12 23Z" fill="#FFFDF9" />
          <circle cx="25" cy="22" r="1.3" fill="#9F1239" />
          <circle cx="33" cy="25" r="1.5" fill="#BE123C" />
          <circle cx="41" cy="27" r="1.2" fill="#881337" />
        </svg>
      );

    case 'cheesecake':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M12 44L48 52L54 48L18 40L12 44Z" fill="#B45309" />
          <path d="M12 40L48 48L54 26L18 18L12 40Z" fill="#FEF3C7" />
          <path d="M12 23L48 31L54 26L18 18L12 23Z" fill="#312E81" />
          <circle cx="26" cy="22" r="3" fill="#1E1B4B" />
          <circle cx="34" cy="25" r="2.8" fill="#1E1B4B" />
          <circle cx="42" cy="27" r="3" fill="#312E81" />
          <circle cx="25" cy="20.5" r="0.8" fill="#818CF8" />
        </svg>
      );

    case 'strawberry':
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M12 44L48 52L54 28L18 20L12 44Z" fill="#FDE68A" />
          <path d="M12 44L48 52V46L12 38V44Z" fill="#F59E0B" />
          <path d="M12 38L48 46V43L12 35V38Z" fill="#FFFBEB" />
          <path d="M12 35L48 43V41L12 33V35Z" fill="#FB7185" />
          <path d="M12 33L48 41V35L12 27V33Z" fill="#FDE68A" />
          <path d="M12 27L48 35V32L12 24V27Z" fill="#FFFBEB" />
          <path d="M12 24L48 32L54 27L18 19L12 24Z" fill="#FFFDF9" stroke="#FED7AA" strokeWidth="0.8" />
          <path d="M32 10C35 10 38 14 38 18C38 22 34 25 32 25C30 25 26 22 26 18C26 14 29 10 32 10Z" fill="#E11D48" />
          <path d="M32 9L29 7M32 9L35 7M32 9L32 6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="30" cy="15" r="0.8" fill="#FEF08A" />
          <circle cx="34" cy="15" r="0.8" fill="#FEF08A" />
        </svg>
      );
  }
};

// 16 Ambient Cake Pieces gracefully distributed across the entire homepage height
const HOMEPAGE_CAKE_PIECES = [
  // Top Hero & Categories Section (0% - 20%)
  { id: 1, type: 'strawberry', top: '3%', left: '2%', size: 'w-9 h-9 sm:w-11 sm:h-11', anim: 'animate-[floatCakeSlow_5s_ease-in-out_infinite]', delay: '0s', rot: '-12deg' },
  { id: 2, type: 'chocolate', top: '7%', right: '3%', size: 'w-8 h-8 sm:w-10 sm:h-10', anim: 'animate-[floatCakeFast_4.2s_ease-in-out_infinite]', delay: '0.6s', rot: '15deg' },
  { id: 3, type: 'cupcake', top: '14%', left: '4%', size: 'w-9 h-9 sm:w-12 sm:h-12', anim: 'animate-[floatCakeMedium_4.8s_ease-in-out_infinite]', delay: '1.2s', rot: '8deg' },
  { id: 4, type: 'redvelvet', top: '18%', right: '2%', size: 'w-8 h-8 sm:w-11 sm:h-11', anim: 'animate-[floatCakeSlow_5.4s_ease-in-out_infinite]', delay: '1.8s', rot: '-10deg' },

  // Gifting & Bestsellers Section (20% - 40%)
  { id: 5, type: 'cheesecake', top: '26%', left: '3%', size: 'w-8 h-8 sm:w-10 sm:h-10', anim: 'animate-[floatCakeFast_4.5s_ease-in-out_infinite]', delay: '0.4s', rot: '14deg' },
  { id: 6, type: 'strawberry', top: '31%', right: '3%', size: 'w-9 h-9 sm:w-12 sm:h-12', anim: 'animate-[floatCakeMedium_5.1s_ease-in-out_infinite]', delay: '1.5s', rot: '-8deg' },
  { id: 7, type: 'chocolate', top: '38%', left: '2%', size: 'w-8 h-8 sm:w-10 sm:h-10', anim: 'animate-[floatCakeSlow_4.9s_ease-in-out_infinite]', delay: '2.2s', rot: '12deg' },

  // Dream Cake & Signature Section (40% - 60%)
  { id: 8, type: 'cupcake', top: '46%', right: '4%', size: 'w-9 h-9 sm:w-11 sm:h-11', anim: 'animate-[floatCakeFast_4.3s_ease-in-out_infinite]', delay: '0.9s', rot: '-15deg' },
  { id: 9, type: 'redvelvet', top: '52%', left: '3%', size: 'w-8 h-8 sm:w-10 sm:h-10', anim: 'animate-[floatCakeSlow_5.2s_ease-in-out_infinite]', delay: '1.6s', rot: '6deg' },
  { id: 10, type: 'cheesecake', top: '58%', right: '2%', size: 'w-9 h-9 sm:w-11 sm:h-11', anim: 'animate-[floatCakeMedium_4.7s_ease-in-out_infinite]', delay: '2.5s', rot: '-12deg' },

  // Photo Cake & Features Section (60% - 80%)
  { id: 11, type: 'strawberry', top: '65%', left: '2%', size: 'w-9 h-9 sm:w-12 sm:h-12', anim: 'animate-[floatCakeSlow_4.8s_ease-in-out_infinite]', delay: '0.3s', rot: '10deg' },
  { id: 12, type: 'chocolate', top: '72%', right: '3%', size: 'w-8 h-8 sm:w-10 sm:h-10', anim: 'animate-[floatCakeFast_4.4s_ease-in-out_infinite]', delay: '1.1s', rot: '-9deg' },
  { id: 13, type: 'cupcake', top: '78%', left: '3%', size: 'w-9 h-9 sm:w-11 sm:h-11', anim: 'animate-[floatCakeMedium_5.3s_ease-in-out_infinite]', delay: '1.9s', rot: '14deg' },

  // Reviews & Bottom Section (80% - 98%)
  { id: 14, type: 'redvelvet', top: '85%', right: '2%', size: 'w-8 h-8 sm:w-11 sm:h-11', anim: 'animate-[floatCakeSlow_5s_ease-in-out_infinite]', delay: '0.7s', rot: '-14deg' },
  { id: 15, type: 'cheesecake', top: '91%', left: '2%', size: 'w-8 h-8 sm:w-10 sm:h-10', anim: 'animate-[floatCakeFast_4.6s_ease-in-out_infinite]', delay: '1.4s', rot: '8deg' },
  { id: 16, type: 'strawberry', top: '96%', right: '3%', size: 'w-9 h-9 sm:w-12 sm:h-12', anim: 'animate-[floatCakeMedium_4.9s_ease-in-out_infinite]', delay: '2.1s', rot: '-10deg' },
];

export const FloatingCakePieces = () => {
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none absolute inset-0 w-full h-full overflow-hidden z-10 select-none"
    >
      {HOMEPAGE_CAKE_PIECES.map((piece) => (
        <div
          key={piece.id}
          className="absolute transition-opacity duration-300 opacity-80 hover:opacity-100"
          style={{
            top: piece.top,
            left: piece.left,
            right: piece.right,
            animationDelay: piece.delay,
          }}
        >
          <div
            className={`${piece.size} ${piece.anim} drop-shadow-sm`}
            style={{ transform: `rotate(${piece.rot})` }}
          >
            {/* Soft Ambient Bakery Glow */}
            <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-sm" />
            
            {/* Pure SVG Cake Piece without text or labels */}
            <CakePieceSVG type={piece.type} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingCakePieces;
