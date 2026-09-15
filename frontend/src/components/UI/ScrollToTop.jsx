import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Utility to scroll smoothly (or instantly) to the top of the page.
 */
export const scrollToTop = (behavior = 'smooth') => {
  try {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior,
    });
  } catch (e) {
    window.scrollTo(0, 0);
  }
};

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Instant scroll to top on route change
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
