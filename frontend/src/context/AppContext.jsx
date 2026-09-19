import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  reverseGeocode,
  findNearestOutlet,
  calculateDistanceKm,
  getOutletCoordinates,
  OUTLET_COORDINATES,
} from '../services/geocodingService.js';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Outlets
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(() => {
    const saved = localStorage.getItem('ammas_selected_outlet');
    return saved ? JSON.parse(saved) : null;
  });

  // User live location state
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('ammas_user_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [userDistance, setUserDistance] = useState(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  // Delivery Bar Info (from database settings)
  const [deliveryInfo, setDeliveryInfo] = useState({
    message: 'Home Delivery Available',
    delivery_time: '45 Mins to 1 Hour',
    opening_time: '10:00 AM',
    closing_time: '10:00 PM',
  });

  // Cart (persisted)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('ammas_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Wishlist (persisted)
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('ammas_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Customer Auth
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ammas_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userToken, setUserToken] = useState(() => localStorage.getItem('ammas_user_token') || null);

  // Admin Auth
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('ammas_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('ammas_admin_token') || null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Cart to localStorage
  useEffect(() => {
    localStorage.setItem('ammas_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('ammas_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync Selected Outlet
  useEffect(() => {
    if (selectedOutlet) {
      localStorage.setItem('ammas_selected_outlet', JSON.stringify(selectedOutlet));
    }
  }, [selectedOutlet]);

  // Sync User Location to localStorage
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('ammas_user_location', JSON.stringify(userLocation));
    }
  }, [userLocation]);

  // Recalculate distance whenever userLocation or selectedOutlet changes
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng && selectedOutlet) {
      const coords = getOutletCoordinates(selectedOutlet);
      if (coords) {
        const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
        setUserDistance(dist);
      }
    }
  }, [userLocation, selectedOutlet]);

  // Fetch Outlets & Delivery Bar Settings on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [outletsRes, settingsRes] = await Promise.allSettled([
          api.get('/outlets'),
          api.get('/settings/delivery-bar'),
        ]);

        if (outletsRes.status === 'fulfilled' && outletsRes.value.data?.data) {
          const list = outletsRes.value.data.data;
          setOutlets(list);
          if (!selectedOutlet && list.length > 0) {
            setSelectedOutlet(list[0]);
          }

          // Check if location prompt should show on first website visit
          const hasSeenPrompt = localStorage.getItem('ammas_location_prompt_seen');
          if (!hasSeenPrompt) {
            setTimeout(() => {
              setLocationPromptOpen(true);
            }, 600);
          }
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.data) {
          setDeliveryInfo(settingsRes.value.data.data);
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Detect User Live Location via GPS & Set Nearest Outlet
  const detectUserLocation = useCallback(
    async ({ silent = false, showToastOnSuccess = true } = {}) => {
      if (!navigator.geolocation) {
        if (!silent) showToast('Geolocation is not supported by your browser.', 'error');
        return { success: false, message: 'Geolocation not supported' };
      }

      setIsLocatingUser(true);

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const geoRes = await reverseGeocode(lat, lng);

              const locData = {
                lat,
                lng,
                area: geoRes.area || 'Detected Area',
                city: geoRes.city || 'Bengaluru',
                pincode: geoRes.pincode || '',
                formattedAddress: geoRes.formattedAddress || '',
              };
              setUserLocation(locData);
              localStorage.setItem('ammas_user_location', JSON.stringify(locData));
              localStorage.setItem('ammas_location_prompt_seen', 'true');

              // Find nearest outlet
              const nearest = findNearestOutlet(lat, lng, outlets);
              if (nearest?.outlet) {
                setSelectedOutlet(nearest.outlet);
                setUserDistance(nearest.distanceKm);
                localStorage.setItem('ammas_selected_outlet', JSON.stringify(nearest.outlet));

                if (showToastOnSuccess) {
                  showToast(
                    `Nearest Outlet: ${nearest.outlet.name} (${nearest.distanceKm} km away) 📍`,
                    'success'
                  );
                }

                setIsLocatingUser(false);
                resolve({
                  success: true,
                  location: locData,
                  nearestOutlet: nearest.outlet,
                  distanceKm: nearest.distanceKm,
                });
                return;
              }

              setIsLocatingUser(false);
              resolve({ success: true, location: locData });
            } catch (err) {
              console.error('Error resolving GPS location:', err);
              setIsLocatingUser(false);
              if (!silent) showToast('Could not resolve address details from GPS.', 'warning');
              resolve({ success: false, error: err });
            }
          },
          (err) => {
            console.warn('Geolocation error:', err);
            setIsLocatingUser(false);
            if (!silent) {
              showToast('Location permission not granted. You can select your outlet manually.', 'info');
            }
            resolve({ success: false, code: err.code, message: err.message });
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    },
    [outlets]
  );

  const openLocationPrompt = () => setLocationPromptOpen(true);
  const closeLocationPrompt = () => {
    setLocationPromptOpen(false);
    localStorage.setItem('ammas_location_prompt_seen', 'true');
  };

  // Cart operations
  const addToCart = (product, variant = null, quantity = 1, customization = null) => {
    setCart((prev) => {
      // Unique item key based on product id, variant id, and customization
      const variantId = variant?.id || null;
      const customKey = customization ? JSON.stringify(customization) : '';
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.variant?.id === variantId && (item.customKey || '') === customKey
      );

      const price = customization?.selected_price || variant?.discount_price || variant?.price || product.discount_price || product.base_price || product.price || 0;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            product,
            variant,
            price: Number(price),
            quantity,
            customization,
            customKey,
          },
        ];
      }
    });
    showToast(`Added "${product.name}" to cart! 🍰`, 'success');
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Wishlist operations
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`, 'info');
        return prev.filter((item) => item.id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to your wishlist! ❤️`, 'success');
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Customer Auth
  const loginUser = (userData, token) => {
    setUser(userData);
    setUserToken(token);
    localStorage.setItem('ammas_user', JSON.stringify(userData));
    localStorage.setItem('ammas_user_token', token);
    showToast(`Welcome back, ${userData.name || 'valued customer'}! 🎉`, 'success');
  };

  const logoutUser = async () => {
    try {
      if (userToken) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    setUserToken(null);
    localStorage.removeItem('ammas_user');
    localStorage.removeItem('ammas_user_token');
    showToast('You have been logged out successfully', 'info');
  };

  // Admin Auth
  const loginAdmin = (adminData, token) => {
    setAdmin(adminData);
    setAdminToken(token);
    localStorage.setItem('ammas_admin_user', JSON.stringify(adminData));
    localStorage.setItem('ammas_admin_token', token);
    showToast(`Welcome to Ammas Admin Dashboard, ${adminData.name}! 🔐`, 'success');
  };

  const logoutAdmin = async () => {
    try {
      if (adminToken) {
        await api.post('/admin/logout');
      }
    } catch (e) {
      // Ignore
    }
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem('ammas_admin_user');
    localStorage.removeItem('ammas_admin_token');
    showToast('Logged out from Admin Dashboard', 'info');
  };

  // Admin Permissions Helper
  const isSuperAdmin = admin?.role === 'super_admin' || admin?.email === 'mkumar200418@gmail.com' || admin?.is_super_admin === true;

  const hasPermission = (moduleKey) => {
    if (!admin) return false;
    if (isSuperAdmin) return true;
    const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
    if (permissions.includes('*')) return true;
    const keys = String(moduleKey).split(/[|,]/).map((k) => k.trim());
    return keys.some(
      (k) =>
        permissions.includes(k) ||
        (k === 'theme_cakes' && (permissions.includes('products') || permissions.includes('categories')))
    );
  };

  return (
    <AppContext.Provider
      value={{
        outlets,
        setOutlets,
        selectedOutlet,
        setSelectedOutlet,
        deliveryInfo,
        setDeliveryInfo,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        user,
        userToken,
        loginUser,
        logoutUser,
        admin,
        adminToken,
        loginAdmin,
        logoutAdmin,
        isSuperAdmin,
        hasPermission,
        userLocation,
        setUserLocation,
        userDistance,
        isLocatingUser,
        locationPromptOpen,
        setLocationPromptOpen,
        openLocationPrompt,
        closeLocationPrompt,
        detectUserLocation,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
