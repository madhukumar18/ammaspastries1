import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles, Cake, Cookie, Coffee, Gift, PartyPopper, Crown, Candy } from 'lucide-react';
import api from '../../services/api';
import brandLogo from '../../assets/logo.png';
import { scrollToTop } from '../UI/ScrollToTop';

const SecondaryNavbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [openMobileCategories, setOpenMobileCategories] = useState([]);
  const navRef = useRef(null);

  const toggleMobileCategory = (idx) => {
    setOpenMobileCategories((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const initialCategories = [
    {
      name: 'Cakes & Pastries',
      icon: Cake,
      slug: 'cakes-pastries',
      subcategories: [
        { name: 'Exotic Fruitz', slug: 'exotic-fruitz' },
        { name: 'Mousse & Cheese', slug: 'mousse-cheese' },
        { name: 'Premium Cakes', slug: 'premium-cakes' },
        { name: 'Regular Cakes', slug: 'regular-cakes' },
        { name: 'Something Special', slug: 'something-special' },
      ],
    },
    {
      name: 'Theme Cakes',
      icon: Crown,
      href: '/category/theme-cakes',
    },
    {
      name: 'Photo Cake',
      icon: Sparkles,
      href: '/photo-cake',
    },
    {
      name: 'Snacks',
      icon: Cookie,
      slug: 'snacks',
      subcategories: [
        { name: 'Breads & Rusk', slug: 'breads-rusk' },
        { name: 'Bun', slug: 'bun' },
        { name: 'Burger', slug: 'burger' },
        { name: 'Cookies', slug: 'cookies' },
        { name: 'Croissant', slug: 'croissant' },
        { name: 'Croquettes', slug: 'croquettes' },
        { name: 'Cutlet', slug: 'cutlet' },
        { name: 'Pizza', slug: 'pizza' },
        { name: 'Puff', slug: 'puff' },
        { name: 'Samosas', slug: 'samosas' },
        { name: 'Sandwich', slug: 'sandwich' },
        { name: 'Savouries', slug: 'savouries' },
      ],
    },
    {
      name: 'Dessert',
      icon: Coffee,
      slug: 'dessert',
      subcategories: [
        { name: 'Apple Pie', slug: 'apple-pie' },
        { name: 'Brownie', slug: 'brownie' },
        { name: 'Cup Cakes', slug: 'cup-cakes' },
        { name: 'Doughnuts', slug: 'doughnuts' },
        { name: 'Dry Cakes', slug: 'dry-cakes' },
      ],
    },
    {
      name: 'Dry Fruits',
      href: '/category/dry-fruits',
    },
    {
      name: 'Chocolates',
      slug: 'chocolates',
      subcategories: [{ name: 'Bonbon', slug: 'bonbon' }],
    },
    {
      name: 'Sweets',
      icon: Candy,
      href: '/category/sweets',
      slug: 'sweets',
    },
    {
      name: 'Pastries & Slices',
      href: '/category/pastries-slices',
    },
    {
      name: 'Party Items',
      icon: PartyPopper,
      href: '/category/party-items',
    },
  ];

  const [categories, setCategories] = useState(initialCategories);

  // Sync subcategories with live backend API if available
  useEffect(() => {
    let isMounted = true;
    api.get('/categories')
      .then((res) => {
        if (!isMounted || !res.data?.data) return;
        const rawCats = res.data.data;
        const apiCats = Array.isArray(rawCats) ? rawCats : (typeof rawCats === 'object' && rawCats !== null ? Object.values(rawCats) : []);
        if (!Array.isArray(apiCats) || apiCats.length === 0) return;
        setCategories((prev) =>
          prev.map((cat) => {
            if (!cat.slug) return cat;
            // Theme Cakes must NEVER have dropdown/subcategories in navbar - stays a direct link
            if (cat.slug === 'theme-cakes' || cat.name === 'Theme Cakes') {
              return {
                ...cat,
                href: '/category/theme-cakes',
                subcategories: [],
              };
            }
            const match = apiCats.find((c) => c.slug === cat.slug);
            if (match && match.subcategories && match.subcategories.length > 0) {
              return {
                ...cat,
                name: match.name || cat.name,
                subcategories: match.subcategories.map((s) => ({
                  name: s.name,
                  slug: s.slug,
                })),
              };
            }
            return cat;
          })
        );
      })
      .catch((err) => {
        console.warn('Could not sync navbar categories:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close active dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <>
      {/* Desktop Secondary Category Bar */}
      <nav
        ref={navRef}
        className="hidden lg:block bg-amber-50/80 border-b border-amber-200/70 text-[10.5px] xl:text-[11px] 2xl:text-xs font-bold uppercase tracking-wider text-chocolate shadow-xs relative z-30"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <ul className="flex items-center justify-center gap-0.5 xl:gap-1.5 2xl:gap-2.5 py-1">
            {categories.map((cat, idx) => {
              const hasDropdown = Boolean(cat.subcategories && cat.subcategories.length > 0);
              const isHighlighted = cat.highlight;
              const isOpen = activeDropdown === idx;

              return (
                <li
                  key={idx}
                  className="relative group py-1.5"
                  onMouseEnter={() => setActiveDropdown(idx)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {cat.href ? (
                    <Link
                      to={cat.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs font-bold px-2.5 xl:px-3'
                          : 'hover:bg-amber-100/70 hover:text-amber-900'
                      }`}
                    >
                      {cat.icon && <cat.icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                      <span>{cat.name}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center shrink-0">
                      <Link
                        to={`/category/${cat.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-1 px-1.5 xl:px-2 py-1.5 rounded-lg hover:bg-amber-100/70 hover:text-amber-900 transition-all cursor-pointer whitespace-nowrap"
                      >
                        {cat.icon && <cat.icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                        <span>{cat.name}</span>
                      </Link>
                      {hasDropdown && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveDropdown(isOpen ? null : idx);
                          }}
                          className="p-1 -ml-1 text-slate-400 hover:text-amber-800 transition-colors cursor-pointer"
                          aria-label={`Toggle ${cat.name} menu`}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                              isOpen ? 'rotate-180 text-amber-700' : 'group-hover:rotate-180'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dropdown Menu */}
                  {hasDropdown && isOpen && (
                    <div
                      className={`absolute top-full pt-1.5 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150 normal-case ${
                        idx >= 4 ? 'right-0' : 'left-0'
                      }`}
                      onMouseEnter={() => setActiveDropdown(idx)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <div className="bg-white rounded-2xl shadow-warm-lg border border-amber-100 p-2.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase px-3 py-1 border-b border-slate-100 mb-1 flex items-center justify-between">
                          <span>{cat.name} Varieties</span>
                          <span className="text-[10px] text-amber-700 font-semibold lowercase">
                            ({cat.subcategories.length})
                          </span>
                        </div>
                        <div className="max-h-72 overflow-y-auto space-y-0.5">
                          {cat.subcategories.map((sub, sIdx) => (
                            <Link
                              key={sIdx}
                              to={`/category/${cat.slug}?sub=${sub.slug}`}
                              onClick={() => setActiveDropdown(null)}
                              className="block px-3 py-2 text-xs font-medium text-slate-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Navigation (Triggered by Header Hamburger Menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative max-w-xs w-full bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Link
                  to="/"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToTop('smooth');
                  }}
                  className="flex items-center cursor-pointer"
                  title="Ammas Pastries"
                >
                  <img
                    src={brandLogo}
                    alt="Ammas Pastries"
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  aria-label="Close navigation menu"
                >
                  ✕
                </button>
              </div>

              {/* Photo Cake highlight button */}
              <div className="my-4">
                <Link
                  to="/photo-cake"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-semibold text-xs shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Order Custom Photo Cake
                </Link>
              </div>

              {/* Category Links with Mobile Dropdown Accordion */}
              <div className="space-y-1">
                {categories.map((cat, idx) => {
                  const hasDropdown = Boolean(cat.subcategories && cat.subcategories.length > 0);
                  const isExpanded = openMobileCategories.includes(idx);

                  return (
                    <div key={idx} className="border-b border-slate-50 py-1">
                      {cat.href ? (
                        <Link
                          to={cat.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-chocolate hover:text-amber-700 rounded-xl hover:bg-amber-50/70 transition-colors"
                        >
                          {cat.icon && <cat.icon className="w-4 h-4 text-amber-600 shrink-0" />}
                          <span>{cat.name}</span>
                        </Link>
                      ) : (
                        <div>
                          {hasDropdown ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => toggleMobileCategory(idx)}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-chocolate hover:text-amber-700 rounded-xl hover:bg-amber-50/70 transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2.5">
                                  {cat.icon && <cat.icon className="w-4 h-4 text-amber-600 shrink-0" />}
                                  <span>{cat.name}</span>
                                </div>
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-200 text-slate-400 shrink-0 ${
                                    isExpanded ? 'rotate-180 text-amber-700' : ''
                                  }`}
                                />
                              </button>

                              {/* Accordion dropdown for subcategories */}
                              {isExpanded && (
                                <div className="ml-4 mr-1 my-1.5 p-2 space-y-1 bg-amber-50/80 border border-amber-200/70 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                                  <Link
                                    to={`/category/${cat.slug}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between px-3 py-2 text-xs font-bold text-amber-900 hover:text-amber-700 hover:bg-amber-100/70 rounded-xl transition-colors"
                                  >
                                    <span>All {cat.name}</span>
                                    <span>→</span>
                                  </Link>
                                  <div className="border-t border-amber-200/50 my-0.5" />
                                  {cat.subcategories.map((sub, sIdx) => (
                                    <Link
                                      key={sIdx}
                                      to={`/category/${cat.slug}?sub=${sub.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-amber-950 hover:bg-amber-100/70 rounded-xl transition-colors"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                      <span>{sub.name}</span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              to={`/category/${cat.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-chocolate hover:text-amber-700 rounded-xl hover:bg-amber-50/70 transition-colors"
                            >
                              {cat.icon && <cat.icon className="w-4 h-4 text-amber-600 shrink-0" />}
                              <span>{cat.name}</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick links in drawer bottom */}
            <div className="pt-6 pb-6 border-t border-slate-100 text-xs text-slate-500 space-y-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <Link to="/track-order" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-amber-700">
                🚚 Track My Order
              </Link>
              <Link to="/bulk-order" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-amber-700">
                📦 Corporate & Bulk Orders
              </Link>
              <Link to="/franchise-enquiry" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-amber-700">
                🤝 Franchise Enquiry
              </Link>
              <Link to="/contact-us" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-amber-700">
                📞 Contact Bakery Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecondaryNavbar;
