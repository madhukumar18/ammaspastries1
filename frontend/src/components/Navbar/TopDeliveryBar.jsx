import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Truck, Sparkles, MapPin } from 'lucide-react';

const TopDeliveryBar = () => {
  const { deliveryInfo, selectedOutlet, userDistance, openLocationPrompt } = useApp();

  return (
    <div className="bg-[#ff6600] text-white py-2 px-3 sm:px-6 text-xs font-medium border-b border-white/15 w-full shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <button
            type="button"
            onClick={openLocationPrompt}
            className="tracking-wide text-white hover:text-white/80 font-semibold flex items-center gap-1 transition-colors text-left truncate min-w-0 cursor-pointer"
            title="Click to detect live location or change outlet"
          >
            <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              <span className="hidden sm:inline text-white/90">Serving from: </span>
              <strong className="underline decoration-white/60 underline-offset-2 font-bold text-white">
                {selectedOutlet ? selectedOutlet.name : 'Select Outlet'}
              </strong>
            </span>
            {userDistance != null && (
              <span className="ml-1 bg-black/25 text-white px-1.5 py-0.5 rounded-md font-bold text-[10px] border border-white/30 shrink-0 font-mono">
                {userDistance} km
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-white">
          <div className="flex items-center gap-1 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/25 text-white text-[10px] sm:text-xs font-medium">
            <Clock className="w-3 h-3 text-white shrink-0" />
            <span>Delivery: <strong>{deliveryInfo.delivery_time || '45 Mins to 1 Hour'}</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-white/90 text-xs">
            <span>Hours:</span>
            <span className="text-white font-bold">
              {deliveryInfo.opening_time || '10:00 AM'} - {deliveryInfo.closing_time || '10:00 PM'}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-white text-xs tracking-wider uppercase font-semibold shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Fresh From The Oven Every Morning</span>
        </div>
      </div>
    </div>
  );
};

export default TopDeliveryBar;
