import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Crosshair,
  Store,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  ShieldCheck,
  Truck,
  ArrowRight
} from 'lucide-react';

const LocationPromptModal = () => {
  const {
    outlets,
    selectedOutlet,
    setSelectedOutlet,
    userLocation,
    userDistance,
    locationPromptOpen,
    closeLocationPrompt,
    detectUserLocation,
    isLocatingUser,
  } = useApp();

  const [viewState, setViewState] = useState('prompt'); // 'prompt' | 'success' | 'manual'
  const [detectedResult, setDetectedResult] = useState(null);

  if (!locationPromptOpen) return null;

  // Handle customer clicking "Share Live Location"
  const handleAllowLocation = async () => {
    const res = await detectUserLocation({ silent: false, showToastOnSuccess: false });
    if (res?.success && res.nearestOutlet) {
      setDetectedResult(res);
      setViewState('success');
    } else {
      // If permission denied or error, offer manual selection
      setViewState('manual');
    }
  };

  const handleSelectManualOutlet = (outlet) => {
    setSelectedOutlet(outlet);
    closeLocationPrompt();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/60 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Decorative Top Gradient Header */}
        <div className="h-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 shrink-0" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeLocationPrompt}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-chocolate hover:bg-amber-50 transition-colors z-10"
          aria-label="Close location prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* -------------------------------------------------------------
            VIEW 1: PROMPT STATE
            ------------------------------------------------------------- */}
        {viewState === 'prompt' && (
          <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 text-center overflow-y-auto">
            
            {/* Pulsing Radar Animation */}
            <div className="mx-auto w-20 h-20 relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40"></span>
              <span className="relative inline-flex rounded-full w-16 h-16 bg-gradient-to-tr from-amber-600 to-amber-400 text-white items-center justify-center shadow-lg">
                <MapPin className="w-8 h-8 drop-shadow-sm" />
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-chocolate">
                Find Your Nearest Ammas Pastries 🎂
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Allow your live location so we can connect you to your closest bakery outlet for lightning-fast <strong>45-60 minute</strong> fresh delivery!
              </p>
            </div>

            {/* Benefit Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-2">
              <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-2xl">
                <Truck className="w-4 h-4 text-amber-600 mb-1" />
                <span className="block text-[11px] font-bold text-chocolate">Fast Delivery</span>
                <span className="text-[10px] text-slate-500">45 - 60 mins fresh</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-2xl">
                <Sparkles className="w-4 h-4 text-amber-600 mb-1" />
                <span className="block text-[11px] font-bold text-chocolate">Local Oven</span>
                <span className="text-[10px] text-slate-500">Freshly baked near you</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-2xl">
                <ShieldCheck className="w-4 h-4 text-amber-600 mb-1" />
                <span className="block text-[11px] font-bold text-chocolate">Doorstep Accuracy</span>
                <span className="text-[10px] text-slate-500">Google Maps GPS pin</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAllowLocation}
                disabled={isLocatingUser}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed group"
              >
                {isLocatingUser ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Detecting live location & nearest outlet...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Share My Live Location</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewState('manual')}
                disabled={isLocatingUser}
                className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Select Bakery Branch Manually
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Your location is only used to show the closest outlet and calculate delivery time.
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 2: SUCCESS STATE (NEAREST OUTLET FOUND)
            ------------------------------------------------------------- */}
        {viewState === 'success' && detectedResult?.nearestOutlet && (
          <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 text-center animate-in fade-in duration-300 overflow-y-auto">
            
            {/* Green Badge */}
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
                Nearest Outlet Detected! 📍
              </span>
              <h3 className="font-serif text-2xl font-bold text-chocolate pt-1">
                {detectedResult.nearestOutlet.name}
              </h3>
              <p className="text-xs text-slate-500">
                Serving your area from <strong>{detectedResult.location?.area || 'Bengaluru'}</strong>
              </p>
            </div>

            {/* Outlet Highlight Card */}
            <div className="bg-gradient-to-br from-amber-50/70 via-cream/40 to-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200 text-left space-y-3 shadow-xs">
              
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-chocolate">Serving Bakery Branch</span>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  Approx. {detectedResult.distanceKm} km away
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-700 font-semibold">
                  {detectedResult.nearestOutlet.address}
                </div>
                <div className="text-slate-500 flex items-center gap-1.5 pt-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Open: {detectedResult.nearestOutlet.opening_time} - {detectedResult.nearestOutlet.closing_time}
                  </span>
                </div>
                <div className="text-emerald-700 font-medium text-[11px]">
                  ⚡ Estimated delivery time: <strong>45 - 60 mins</strong>
                </div>
              </div>
            </div>

            {/* Confirm & Close */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={closeLocationPrompt}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Start Shopping Fresh Cakes</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewState('manual')}
                className="text-xs text-slate-500 hover:text-chocolate underline"
              >
                Want to choose a different branch?
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 3: MANUAL OUTLET SELECTION
            ------------------------------------------------------------- */}
        {viewState === 'manual' && (
          <div className="p-5 sm:p-8 space-y-4 sm:space-y-5 animate-in fade-in duration-300 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-chocolate">
                  Select Your Bakery Branch
                </h3>
                <p className="text-xs text-slate-500">
                  Choose the Ammas Pastries closest to your delivery address.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewState('prompt')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Try GPS</span>
              </button>
            </div>

            {/* Outlets List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {outlets.map((outlet) => {
                const isSelected = selectedOutlet?.id === outlet.id;
                return (
                  <button
                    key={outlet.id}
                    type="button"
                    onClick={() => handleSelectManualOutlet(outlet)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 text-chocolate shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs flex items-center gap-1.5 text-chocolate">
                        <Store className="w-4 h-4 text-amber-600" />
                        <span>{outlet.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {outlet.address} ({outlet.pincode})
                      </div>
                      <div className="text-[10px] text-amber-700">
                        🕒 {outlet.opening_time} - {outlet.closing_time}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={closeLocationPrompt}
                className="text-xs font-semibold text-slate-500 hover:text-chocolate"
              >
                Keep Default Outlet & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPromptModal;
