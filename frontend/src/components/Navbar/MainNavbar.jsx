import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
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
  Store
} from 'lucide-react';

const MainNavbar = ({ onMobileMenuToggle }) => {
  const {
    outlets,
    selectedOutlet,
    setSelectedOutlet,
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

  // User dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (outletRef.current && !outletRef.current.contains(e.target)) {
        setOutletDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 md:gap-6">
          
          {/* Mobile menu trigger */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-chocolate hover:text-gold transition-colors focus:outline-none"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Left: Brand Logo & Outlet Selector */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-xl md:text-2xl font-serif font-bold">A</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-2xl font-serif font-bold text-chocolate tracking-tight group-hover:text-amber-700 transition-colors">
                  AMMAS PASTRIES
                </span>
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest text-amber-600 -mt-1">
                  Freshness in Every Bite
                </span>
              </div>
            </Link>

            {/* Outlet Selector */}
            <div className="relative hidden md:block" ref={outletRef}>
              <button
                onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                className="flex items-center gap-2 text-xs lg:text-sm font-medium text-slate-700 bg-amber-50/80 hover:bg-amber-100/70 border border-amber-200/80 px-3 py-2 rounded-xl transition-all shadow-xs"
              >
                <MapPin className="w-4 h-4 text-amber-600" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Serving From</div>
                  <div className="font-semibold text-chocolate truncate max-w-[140px] lg:max-w-[180px]">
                    {selectedOutlet ? selectedOutlet.name : 'Select Outlet'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Outlet Dropdown Menu */}
              {outletDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-warm-lg border border-amber-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Select Bakery Outlet
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      {outlets.length} Outlets
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {outlets.map((outlet) => {
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
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-amber-600" />
                              {outlet.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {outlet.area}, {outlet.city} ({outlet.pincode})
                            </div>
                            <div className="text-[11px] text-amber-700 mt-1">
                              🕒 {outlet.opening_time} - {outlet.closing_time}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Global Live Search Bar */}
          <div className="flex-1 max-w-md lg:max-w-lg relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search cakes, pastries, snacks, desserts..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 rounded-full border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Live Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-warm-lg border border-amber-100 overflow-hidden z-50">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 px-3">
                  <span>Product Suggestions</span>
                  {isSearching && <span className="text-amber-600">Searching...</span>}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/cakes/${item.slug}`);
                      }}
                      className="p-3 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-amber-100 flex-shrink-0"
                        />
                        <div>
                          <div className="text-sm font-semibold text-chocolate">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.category?.name || 'Cake'}</div>
                          <div className="text-xs font-bold text-amber-600 mt-0.5">
                            ₹{item.discount_price || item.base_price || item.price}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-amber-700 bg-amber-100/60 font-medium px-2.5 py-1 rounded-full">
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

          {/* Right: Actions (Track Order, Wishlist, Account, Cart) */}
          <div className="flex items-center gap-3 lg:gap-5">
            
            {/* Track Order */}
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
              className="relative p-2 text-slate-700 hover:text-berry transition-colors rounded-xl hover:bg-rose-50"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-berry text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Customer Account */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-2 text-slate-700 hover:text-amber-700 transition-colors rounded-xl hover:bg-amber-50"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs">
                  {user ? (user.name ? user.name[0].toUpperCase() : 'U') : <User className="w-4 h-4" />}
                </div>
                <span className="hidden xl:inline text-xs font-semibold max-w-[90px] truncate">
                  {user ? user.name.split(' ')[0] : 'Login'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
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
              className="flex items-center gap-2.5 bg-chocolate hover:bg-chocolate-light text-cream-light px-3.5 py-2.5 rounded-full shadow-md transition-all hover:scale-102 group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-chocolate font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-chocolate">
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
      </div>
    </header>
  );
};

export default MainNavbar;
