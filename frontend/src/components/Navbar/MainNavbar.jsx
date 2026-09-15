import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { calculateDistanceKm, getOutletCoordinates, OUTLET_COORDINATES } from '../../services/geocodingService.js';
import brandLogo from '../../assets/logo.png';
import { scrollToTop } from '../UI/ScrollToTop';
import {
  MapPin,
  Search,
  Heart,
  ShoppingBag,
  User,
  Truck,
  ChevronDown,
  X,
  Menu,
  Check,
  Store,
  Crosshair,
  Sparkles,
} from 'lucide-react';

const MainNavbar = ({ onMobileMenuToggle }) => {
  const {
    outlets,
    selectedOutlet,
    setSelectedOutlet,
    userLocation,
    userDistance,
    detectUserLocation,
    isLocatingUser,
    openLocationPrompt,
    cartItemCount,
    cartSubtotal,
    wishlist,
    user,
    logoutUser,
  } = useApp();

  const navigate = useNavigate();

  // Outlet dropdown state
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const outletRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // User dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (outletRef.current && !outletRef.current.contains(e.target)) {
        setOutletDropdownOpen(false);
      }
      const inDesktopSearch = searchRef.current && searchRef.current.contains(e.target);
      const inMobileSearch = mobileSearchRef.current && mobileSearchRef.current.contains(e.target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowSuggestions(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.data?.data) {
          setSuggestions(res.data.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Memoize outlets sorted by proximity if user location is known
  const outletsWithDistance = React.useMemo(() => {
    if (!userLocation?.lat || !userLocation?.lng) {
      return outlets.map((o) => ({ ...o, distanceKm: null }));
    }
    return outlets
      .map((o) => {
        const coords = getOutletCoordinates(o);
        const dist = coords
          ? calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
          : null;
        return { ...o, distanceKm: dist };
      })
      .sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [outlets, userLocation]);

  // Reusable search bar component for both desktop header and mobile row
  const renderSearchBar = (isMobile = false) => (
    <div
      className={isMobile ? 'w-full relative' : 'w-full relative'}
      ref={isMobile ? mobileSearchRef : searchRef}
    >
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder="Search cakes, pastries, snacks, sweets..."
          className={`w-full pl-9 pr-9 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-full border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all placeholder:text-slate-400 ${
            isMobile ? 'py-2 pl-9 pr-8 text-xs shadow-2xs' : 'py-2.5 pl-10 pr-10 text-sm'
          }`}
        />
        <Search className={`text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4 left-3.5'}`} />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Live Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-warm-lg border border-amber-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span>Product Suggestions</span>
            {isSearching && <span className="text-amber-600 font-medium">Searching...</span>}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {suggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setShowSuggestions(false);
                  navigate(`/cakes/${item.slug}`);
                }}
                className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120'}
                    alt={item.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-amber-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-chocolate truncate">{item.name}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400">{item.category?.name || 'Cake'}</div>
                    <div className="text-xs font-bold text-amber-600 mt-0.5">
                      ₹{item.discount_price || item.base_price || item.price}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-amber-700 bg-amber-100/60 font-medium px-2 py-0.5 rounded-full shrink-0 ml-2">
                  View
                </span>
              </div>
            ))}
          </div>
          <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
            <button
              onClick={handleSearchSubmit}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              View all results for "{searchQuery}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 sm:gap-4 lg:gap-6">
          
          {/* Left: Hamburger Menu (Mobile) & Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-6 shrink-0">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 text-chocolate hover:text-amber-700 transition-colors focus:outline-none rounded-lg active:bg-amber-50"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <Link
              to="/"
              onClick={() => scrollToTop('smooth')}
              className="flex items-center group shrink-0 py-1 cursor-pointer"
              title="Ammas Pastries"
            >
              <img
                src={brandLogo}
                alt="Ammas Pastries"
                className="h-8 sm:h-10 lg:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Outlet Selector */}
            <div className="relative hidden md:block" ref={outletRef}>
              <button
                onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                className="flex items-center gap-2 text-xs lg:text-sm font-medium text-slate-700 bg-amber-50/80 hover:bg-amber-100/70 border border-amber-200/80 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs"
              >
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <span>Serving From</span>
                    {userDistance != null && (
                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">Live GPS</span>
                    )}
                  </div>
                  <div className="font-semibold text-chocolate truncate max-w-[120px] lg:max-w-[180px] flex items-center gap-1.5">
                    <span className="truncate">{selectedOutlet ? selectedOutlet.name : 'Select Outlet'}</span>
                    {userDistance != null && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                        {userDistance} km
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
              </button>

              {/* Outlet Dropdown Menu */}
              {outletDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-warm-lg border border-amber-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      detectUserLocation();
                    }}
                    disabled={isLocatingUser}
                    className="w-full mb-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-75"
                  >
                    {isLocatingUser ? (
                      <>
                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Finding Closest Outlet...</span>
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Detect Live Location (Nearest Outlet)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {userLocation ? 'Outlets (Nearest First)' : 'Select Bakery Outlet'}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      {outlets.length} Outlets
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {outletsWithDistance.map((outlet) => {
                      const isSelected = selectedOutlet?.id === outlet.id;
                      return (
                        <button
                          key={outlet.id}
                          onClick={() => {
                            setSelectedOutlet(outlet);
                            setOutletDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                            isSelected
                              ? 'bg-amber-500/10 border border-amber-400/40 text-chocolate'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex-1 pr-2 min-w-0">
                            <div className="font-semibold text-xs flex items-center justify-between gap-1">
                              <span className="flex items-center gap-1.5 text-chocolate font-bold truncate">
                                <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                {outlet.name}
                              </span>
                              {outlet.distanceKm != null && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                                  {outlet.distanceKm} km
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {outlet.area}, {outlet.city}
                            </div>
                            <div className="text-[10px] text-amber-700 mt-0.5">
                              🕒 {outlet.opening_time} - {outlet.closing_time}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 mt-1 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Search Bar: Desktop Only */}
          <div className="hidden lg:block flex-1 max-w-md xl:max-w-lg mx-4">
            {renderSearchBar(false)}
          </div>

          {/* Right: Actions (Location Pin, Track Order, Wishlist, User, Cart) */}
          <div className="flex items-center gap-1 sm:gap-2.5 lg:gap-4 shrink-0">
            
            {/* Mobile Outlet Selector Trigger */}
            <button
              type="button"
              onClick={openLocationPrompt}
              className="md:hidden p-1.5 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors shrink-0"
              title="Change Delivery Outlet"
              aria-label="Select Outlet"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </button>

            {/* Desktop Track Order */}
            <Link
              to="/track-order"
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-amber-700 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-amber-50"
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Track Order</span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-1.5 sm:p-2 text-slate-700 hover:text-berry transition-colors rounded-xl hover:bg-rose-50 shrink-0"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-berry text-white text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Customer Account */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1 p-1 sm:p-1.5 text-slate-700 hover:text-amber-700 transition-colors rounded-xl hover:bg-amber-50 shrink-0"
                aria-label="Account"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs shrink-0">
                  {user ? (user.name ? user.name[0].toUpperCase() : 'U') : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
                <span className="hidden xl:inline text-xs font-semibold max-w-[90px] truncate">
                  {user ? user.name.split(' ')[0] : 'Login'}
                </span>
                <ChevronDown className="hidden sm:inline w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-warm-lg border border-amber-100 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-chocolate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email || user.phone}</div>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                      >
                        My Profile & Orders
                      </Link>
                      <Link
                        to="/track-order"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                      >
                        Track An Order
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                      >
                        My Wishlist ({wishlist.length})
                      </Link>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={() => {
                          logoutUser();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 text-center border-b border-slate-100">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Welcome to Ammas Pastries</div>
                        <Link
                          to="/user/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs hover:from-amber-700 hover:to-amber-800 transition-all"
                        >
                          Login / Register
                        </Link>
                      </div>
                      <Link
                        to="/track-order"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-amber-50"
                      >
                        Track Order (Guest)
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-1 sm:gap-2 bg-chocolate hover:bg-chocolate-light text-cream-light px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-xs transition-all hover:scale-102 group shrink-0"
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2 bg-amber-500 text-chocolate font-bold text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-chocolate">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold hidden sm:inline text-amber-100">
                ₹{cartSubtotal.toLocaleString('en-IN')}
              </span>
            </Link>

          </div>
        </div>

        {/* Mobile Search Row (< lg) */}
        <div className="lg:hidden pb-2.5 pt-0.5">
          {renderSearchBar(true)}
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;
