import React from 'react';
import { Link } from 'react-router-dom';
import { Cake, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import brandLogo from '../../assets/logo.png';
import { scrollToTop } from '../UI/ScrollToTop';

const Footer = () => {
  return (
    <footer className="bg-[#ff6600] text-white pt-16 pb-8 border-t-4 border-[#e65c00]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/20">
          
          {/* Col 1: Brand & About */}
          <div className="space-y-4">
            <Link
              to="/"
              onClick={() => scrollToTop('smooth')}
              className="inline-flex bg-white rounded-2xl px-4 py-2 shadow-sm transition-all group cursor-pointer"
              title="Ammas Pastries - Back to Top"
            >
              <img
                src={brandLogo}
                alt="Ammas Pastries"
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-xs text-white/90 leading-relaxed">
              Bengaluru’s favorite artisan bakery since 2005. Freshly crafted cakes, gourmet pastries,
              and oven-fresh snacks delivered with love to your doorstep in 45 to 60 minutes.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-[#ff6600] hover:bg-black/20 hover:text-white transition-all shadow-xs flex items-center justify-center" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-[#ff6600] hover:bg-black/20 hover:text-white transition-all shadow-xs flex items-center justify-center" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.833C10.5 0 9 1.5 9 4.667V8z"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white text-[#ff6600] hover:bg-black/20 hover:text-white transition-all shadow-xs flex items-center justify-center" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Policy Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-1 border-b border-white/40 inline-block">
              Policy Info
            </h3>
            <ul className="space-y-2.5 text-xs text-white/90">
              <li>
                <Link to="/terms-and-conditions" className="hover:text-white hover:underline transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white hover:underline transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white hover:underline transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-use" className="hover:text-white hover:underline transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/franchise-enquiry" className="text-white font-bold underline decoration-white/60 hover:text-white/80 transition-colors">
                  Franchise Enquiry →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: About The Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-1 border-b border-white/40 inline-block">
              About The Company
            </h3>
            <ul className="space-y-2.5 text-xs text-white/90">
              <li>
                <Link to="/about-us" className="hover:text-white hover:underline transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-white hover:underline transition-colors">
                  Customer Reviews
                </Link>
              </li>
              <li>
                <Link to="/bulk-order" className="hover:text-white hover:underline transition-colors">
                  Corporate & Bulk Order
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="hover:text-white hover:underline transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-white hover:underline transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/photo-cake" className="hover:text-white hover:underline transition-colors">
                  Photo Cake Studio
                </Link>
              </li>
              <li>
                <Link to="/category/theme-cakes" className="hover:text-white hover:underline transition-colors">
                  Artisan Theme Cakes
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="hover:text-white hover:underline transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Kitchen Info */}
          <div className="space-y-3.5 text-xs text-white/90">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-1 border-b border-white/40 inline-block">
              Bakery Care
            </h3>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-bold">+91 80 4567 8900</div>
                <div className="text-[11px] text-white/80">10:00 AM - 10:00 PM (All Days)</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
              <div>
                <a href="mailto:mkumar200418@gmail.com" className="text-white hover:underline font-medium">
                  mkumar200418@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
              <span className="text-white/95">Central Kitchen, Brigade Plaza, MG Road, Bengaluru, Karnataka 560001</span>
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2 text-white text-xs font-semibold bg-black/15 border border-white/20 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-white flex-shrink-0" />
                <span>100% Pure Vegetarian & Eggless Options Available</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/90 gap-4">
          <div>
            © {new Date().getFullYear()}{' '}
            <Link
              to="/"
              onClick={() => scrollToTop('smooth')}
              className="text-white hover:underline font-bold transition-colors"
              title="Ammas Pastries - Back to Top"
            >
              Ammas Pastries
            </Link>
            . All Rights Reserved. Crafted with <Heart className="w-3 h-3 inline text-rose-300 fill-rose-300" /> for pastry lovers.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-white/90">
            <Link to="/terms-and-conditions" className="hover:text-white hover:underline transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-white hover:underline transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-white hover:underline transition-colors">
              Refunds
            </Link>
            <span>•</span>
            <span className="text-white font-medium">100% Safe Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
