import React, { useEffect } from 'react';

/**
 * BakeryCursorTrail
 * Adds a whimsical touch of pastry sprinkles and golden sugar sparkles
 * that gently burst on click and leave subtle confectioner trails on mouse move.
 */
const BakeryCursorTrail = () => {
  useEffect(() => {
    // Only enable on devices with fine pointer (mouse / trackpad)
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const colors = [
      '#F59E0B', // Honey Amber
      '#FB7185', // Strawberry Pink
      '#FBBF24', // Golden Sugar
      '#60A5FA', // Powder Blue
      '#34D399', // Mint Frosting
      '#A78BFA', // Blueberry Lilac
    ];

    const icons = ['✦', '•', '★', '🧁', '✨'];

    let lastTime = 0;

    const createParticle = (x, y, isClick = false) => {
      const particle = document.createElement('span');
      const isIcon = isClick ? Math.random() > 0.4 : Math.random() > 0.6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.className = 'pointer-events-none fixed z-[9999] select-none';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = color;

      if (isIcon) {
        const icon = icons[Math.floor(Math.random() * icons.length)];
        particle.textContent = icon;
        particle.style.fontSize = isClick ? `${Math.random() * 10 + 12}px` : `${Math.random() * 6 + 10}px`;
      } else {
        // Little rectangular sugar sprinkle
        particle.style.width = isClick ? '6px' : '4px';
        particle.style.height = isClick ? '12px' : '8px';
        particle.style.borderRadius = '3px';
        particle.style.backgroundColor = color;
        particle.style.display = 'inline-block';
      }

      // Physics / drift
      const angle = isClick ? Math.random() * Math.PI * 2 : (Math.random() * Math.PI) / 2 + Math.PI / 4;
      const velocity = isClick ? Math.random() * 45 + 20 : Math.random() * 15 + 8;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity + 15;
      const rot = Math.random() * 360;

      particle.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
      particle.style.opacity = '0.9';
      particle.style.transition = `transform ${isClick ? 750 : 550}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${isClick ? 750 : 550}ms ease-out`;

      document.body.appendChild(particle);

      requestAnimationFrame(() => {
        particle.style.transform = `translate(${vx - 8}px, ${vy}px) scale(0.3) rotate(${rot}deg)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, isClick ? 800 : 600);
    };

    // Throttle move particles for buttery smooth performance
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastTime < 55) return;
      lastTime = now;
      createParticle(e.clientX, e.clientY, false);
    };

    // Burst of sugar crystals on click
    const handleClick = (e) => {
      for (let i = 0; i < 6; i++) {
        createParticle(e.clientX, e.clientY, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
};

export default BakeryCursorTrail;
