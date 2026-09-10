import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Truck, Sparkles } from 'lucide-react';

const TopDeliveryBar = () => {
  const { deliveryInfo } = useApp();

  return (
    <div className="bg-gradient-to-r from-chocolate via-chocolate-light to-chocolate text-cream-light py-2 px-4 text-xs md:text-sm font-medium border-b border-amber-900/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide text-amber-200 font-semibold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            {deliveryInfo.message || 'Home Delivery Available'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-200">
          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-amber-100">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Delivery: <strong>{deliveryInfo.delivery_time || '45 Mins to 1 Hour'}</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-300 text-xs">
            <span>Hours:</span>
            <span className="text-cream-light font-medium">
              {deliveryInfo.opening_time || '10:00 AM'} - {deliveryInfo.closing_time || '10:00 PM'}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-amber-300 text-xs tracking-wider uppercase font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fresh From The Oven Every Morning</span>
        </div>
      </div>
    </div>
  );
};

export default TopDeliveryBar;
