import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles, Cake, Cookie, Coffee, Gift, PartyPopper } from 'lucide-react';

const SecondaryNavbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const categories = [
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
      name: 'Photo Cake',
      icon: Sparkles,
      href: '/photo-cake',
      highlight: true,
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
      name: 'Pastries & Slices',
      href: '/category/pastries-slices',
    },
    {
      name: 'Party Items',
      icon: PartyPopper,
      href: '/category/party-items',
    },
  ];

  return (
    <>
      {/* Desktop Secondary Category Bar */}
      <nav className="hidden lg:block bg-amber-50/70 border-b border-amber-200/60 text-xs font-semibold uppercase tracking-wider text-chocolate shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-between gap-1 py-1">
            {categories.map((cat, idx) => {
              const hasDropdown = Boolean(cat.subcategories);
              const isHighlighted = cat.highlight;

              return (
                <li
                  key={idx}
                  className="relative group py-2.5"
                  onMouseEnter={() => setActiveDropdown(idx)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {cat.href ? (
                    <Link
                      to={cat.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs font-bold'
                          : 'hover:bg-amber-100/70 hover:text-amber-900'
                      }`}
                    >
                      {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                      <span>{cat.name}</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/category/${cat.slug}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-amber-100/70 hover:text-amber-900 transition-all cursor-pointer"
                    >
                      {cat.icon && <cat.icon className="w-3.5 h-3.5 text-amber-700" />}
                      <span>{cat.name}</span>
                      {hasDropdown && <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {hasDropdown && activeDropdown === idx && (
                    <div className="absolute left-0 top-full mt-0 w-60 bg-white rounded-2xl shadow-warm-lg border border-amber-100 p-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 normal-case">
                      <div className="text-[11px] font-bold text-slate-400 uppercase px-3 py-1 border-b border-slate-100 mb-1">
                        {cat.name} Varieties
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-0.5">
                        {cat.subcategories.map((sub, sIdx) => (
                          <Link
                            key={sIdx}
                            to={`/category/${cat.slug}?sub=${sub.slug}`}
                            className="block px-3 py-2 text-xs font-medium text-slate-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-serif font-bold text-base">
                    A
                  </div>
                  <span className="font-serif font-bold text-chocolate text-base">AMMAS PASTRIES</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
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

              {/* Category Links */}
              <div className="space-y-1">
                {categories.map((cat, idx) => (
                  <div key={idx} className="border-b border-slate-50 py-1">
                    {cat.href ? (
                      <Link
                        to={cat.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-chocolate hover:text-amber-700"
                      >
                        {cat.icon && <cat.icon className="w-4 h-4 text-amber-600" />}
                        {cat.name}
                      </Link>
                    ) : (
                      <div>
                        <Link
                          to={`/category/${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-chocolate hover:text-amber-700"
                        >
                          <span className="flex items-center gap-2">
                            {cat.icon && <cat.icon className="w-4 h-4 text-amber-600" />}
                            {cat.name}
                          </span>
                        </Link>
                        {cat.subcategories && (
                          <div className="pl-6 pr-2 py-1 space-y-1 bg-amber-50/50 rounded-lg">
                            {cat.subcategories.map((sub, sIdx) => (
                              <Link
                                key={sIdx}
                                to={`/category/${cat.slug}?sub=${sub.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-xs text-slate-600 hover:text-amber-800 py-1"
                              >
                                • {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links in drawer bottom */}
            <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <Link to="/track-order" onClick={() => setMobileMenuOpen(false)} className="block hover:text-amber-700">
                🚚 Track My Order
              </Link>
              <Link to="/bulk-order" onClick={() => setMobileMenuOpen(false)} className="block hover:text-amber-700">
                📦 Corporate & Bulk Orders
              </Link>
              <Link to="/franchise-enquiry" onClick={() => setMobileMenuOpen(false)} className="block hover:text-amber-700">
                🤝 Franchise Enquiry
              </Link>
              <Link to="/contact-us" onClick={() => setMobileMenuOpen(false)} className="block hover:text-amber-700">
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
