import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Store,
  Compass,
  Edit3,
  RotateCcw,
  Sparkles,
  Navigation
} from 'lucide-react';
import {
  geocodeAddress,
  reverseGeocode,
  getStaticMapUrl,
  findNearestOutlet,
} from '../../services/geocodingService';

const POPULAR_AREAS = [
  'Indiranagar',
  'Koramangala',
  'MG Road',
  'Whitefield',
  'Jayanagar',
  'HSR Layout',
];

const DeliveryAddressSelector = ({
  addressLine1,
  setAddressLine1,
  area,
  setArea,
  city,
  setCity,
  pincode,
  setPincode,
  selectedOutlet,
  setSelectedOutlet,
  outlets = [],
  showToast,
}) => {
  // Input mode: 'auto' (Google Maps Geocoding) | 'manual'
  const [mode, setMode] = useState('auto');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);

  // Resolved location details from Google Geocoding API
  const [resolvedLocation, setResolvedLocation] = useState(null);

  // Specific house / flat & landmark for the delivery address
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');

  // Manual address specific fields
  const [manualStreet, setManualStreet] = useState(addressLine1 || '');

  // Keep manual street in sync with addressLine1 if in manual mode
  useEffect(() => {
    if (mode === 'manual' && addressLine1 && !manualStreet) {
      setManualStreet(addressLine1);
    }
  }, [mode, addressLine1, manualStreet]);

  // Combine house number + resolved street or geocoded address into addressLine1
  const updateCombinedAddress = useCallback(
    (house, lm, loc) => {
      const parts = [];
      if (house && house.trim()) parts.push(house.trim());
      if (loc?.formattedAddress) {
        parts.push(loc.formattedAddress);
      } else if (addressLine1) {
        parts.push(addressLine1);
      }
      if (lm && lm.trim()) {
        parts.push(`(Landmark: ${lm.trim()})`);
      }
      const combined = parts.join(', ');
      setAddressLine1(combined);
    },
    [addressLine1, setAddressLine1]
  );

  // Handle Geocoding Result
  const handleLocationResolved = (result) => {
    setResolvedLocation(result);
    setGeocodingError(null);

    // Populate area, city, pincode
    if (result.area) setArea(result.area);
    if (result.city) setCity(result.city);
    if (result.pincode) setPincode(result.pincode);

    // Auto-recommend nearest outlet
    if (result.location && outlets.length > 0) {
      const nearest = findNearestOutlet(
        result.location.lat,
        result.location.lng,
        outlets
      );
      if (nearest?.outlet) {
        setSelectedOutlet(nearest.outlet);
      }
    }

    // Update full delivery address
    updateCombinedAddress(houseNumber, landmark, result);

    if (showToast) {
      showToast('Delivery location detected via Google Maps!', 'success');
    }
  };

  // Perform Forward Geocode via Google Geocoding API
  const handleSearchAddress = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      if (showToast) showToast('Please enter an address or area to search.', 'warning');
      return;
    }

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const res = await geocodeAddress(query);

      if (res.success) {
        handleLocationResolved(res);
      } else {
        // Location details not shown / not found
        setResolvedLocation(null);
        setGeocodingError(
          res.message || 'Could not pinpoint this location. You can enter your delivery address manually below.'
        );
        // Switch or present manual input downside
        setMode('manual');
        if (showToast) {
          showToast('Location not found automatically. Please enter manually below.', 'warning');
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setResolvedLocation(null);
      setGeocodingError(
        'Could not reach Google Geocoding service. Please enter your address manually below.'
      );
      setMode('manual');
      if (showToast) {
        showToast('Geocoding service unavailable. Switched to manual address entry.', 'warning');
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Perform GPS Reverse Geocoding via Browser + Google Geocoding API
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast('Geolocation is not supported by your browser.', 'error');
      setMode('manual');
      return;
    }

    setIsLocatingGPS(true);
    setGeocodingError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await reverseGeocode(lat, lng);

          if (res.success) {
            setSearchQuery(res.area || res.city || 'Current Location');
            handleLocationResolved(res);
          } else {
            setResolvedLocation(null);
            setGeocodingError(
              'Unable to resolve address from GPS coordinates. Please enter manually below.'
            );
            setMode('manual');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          setResolvedLocation(null);
          setGeocodingError('Error resolving GPS location. Please enter manually below.');
          setMode('manual');
        } finally {
          setIsLocatingGPS(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setIsLocatingGPS(false);
        setGeocodingError(
          'Location access was denied or unavailable. Please type your location or enter manually below.'
        );
        if (showToast) {
          showToast('Location permission denied. You can enter address manually.', 'info');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // When user updates house number or landmark in geocoded mode
  const handleHouseNumberChange = (val) => {
    setHouseNumber(val);
    updateCombinedAddress(val, landmark, resolvedLocation);
  };

  const handleLandmarkChange = (val) => {
    setLandmark(val);
    updateCombinedAddress(houseNumber, val, resolvedLocation);
  };

  // When in manual mode and user types street address
  const handleManualStreetChange = (val) => {
    setManualStreet(val);
    setAddressLine1(val);
  };

  // Find nearest outlet info if we have resolved location
  const nearestOutletInfo =
    resolvedLocation?.location && outlets.length > 0
      ? findNearestOutlet(
          resolvedLocation.location.lat,
          resolvedLocation.location.lng,
          outlets
        )
      : null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-6">
      
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100/70">
        <div>
          <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <span>2. Delivery Address & Bakery Outlet</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pinpoint on Google Maps for accurate 45-60 min delivery, or enter manually.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="inline-flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold self-start sm:self-auto border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('auto');
              setGeocodingError(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'auto'
                ? 'bg-white text-chocolate shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>Google Maps</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('manual');
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'manual'
                ? 'bg-white text-chocolate shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Enter Manually</span>
          </button>
        </div>
      </div>

      {/* Serving Outlet Selection Dropdown */}
      <div className="bg-gradient-to-r from-amber-50/50 via-cream/30 to-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Serving Bakery Outlet *</span>
          </span>
          {selectedOutlet && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
              Timings: {selectedOutlet.opening_time} - {selectedOutlet.closing_time}
            </span>
          )}
        </label>
        <select
          value={selectedOutlet?.id || ''}
          onChange={(e) => {
            const out = outlets.find((o) => o.id === parseInt(e.target.value));
            if (out) {
              setSelectedOutlet(out);
              if (mode === 'manual') {
                if (!area) setArea(out.area);
                if (!pincode) setPincode(out.pincode);
              }
            }
          }}
          className="w-full text-xs p-3 rounded-xl border border-amber-200 bg-white font-semibold text-chocolate focus:outline-none focus:border-amber-500 shadow-xs"
        >
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.address} ({o.pincode})
            </option>
          ))}
        </select>
      </div>

      {/* Mode A: Google Maps Address Search & GPS Detect */}
      {mode === 'auto' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Search Delivery Area, Apartment or Street *</span>
              <span className="text-[11px] font-normal text-slate-400">Powered by Google Geocoding API</span>
            </label>

            <form onSubmit={handleSearchAddress} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 100 Feet Road Indiranagar, Brigade Gateway, Koramangala 5th Block..."
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isGeocoding || !searchQuery.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
              >
                {isGeocoding ? (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>Locate</span>
              </button>

              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={isLocatingGPS}
                title="Detect My Location via GPS"
                className="px-3.5 py-3 rounded-xl bg-cream hover:bg-amber-100 text-chocolate border border-amber-200 font-bold text-xs shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
              >
                {isLocatingGPS ? (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-chocolate border-t-transparent rounded-full" />
                ) : (
                  <Crosshair className="w-4 h-4 text-amber-600" />
                )}
                <span className="hidden sm:inline">Use GPS</span>
              </button>
            </form>

            {/* Quick Bangalore Locality Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick select:
              </span>
              {POPULAR_AREAS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setSearchQuery(`${loc}, Bengaluru`);
                    // Trigger geocode
                    setIsGeocoding(true);
                    setGeocodingError(null);
                    geocodeAddress(`${loc}, Bengaluru`)
                      .then((res) => {
                        if (res.success) handleLocationResolved(res);
                        else {
                          setResolvedLocation(null);
                          setGeocodingError(res.message);
                          setMode('manual');
                        }
                      })
                      .catch(() => {
                        setResolvedLocation(null);
                        setMode('manual');
                      })
                      .finally(() => setIsGeocoding(false));
                  }}
                  className="text-[11px] font-semibold text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 
        -------------------------------------------------------------
        DOWNSIDE SECTION 1: Location details are shown (via Geocoding)
        -------------------------------------------------------------
      */}
      {mode === 'auto' && resolvedLocation && (
        <div className="pt-2 space-y-4 animate-fadeIn">
          
          {/* Confirmed Location Details Card */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-cream/40 to-amber-50/40 p-4 sm:p-5 space-y-4 shadow-xs">
            
            {/* Top Badge & Open in Google Maps */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Google Maps Verified Delivery Location</span>
              </div>

              {resolvedLocation.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${resolvedLocation.location.lat},${resolvedLocation.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs hover:underline"
                >
                  <span>View in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Static Map Visual Preview Thumbnail */}
            {resolvedLocation.location && (
              <div className="relative rounded-xl overflow-hidden border border-amber-200/70 shadow-inner bg-slate-100">
                <img
                  src={getStaticMapUrl(
                    resolvedLocation.location.lat,
                    resolvedLocation.location.lng,
                    15,
                    640,
                    220
                  )}
                  alt="Delivery Location Pin"
                  className="w-full h-40 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback hide map if staticmap quota or image fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>
                    {resolvedLocation.location.lat.toFixed(5)}, {resolvedLocation.location.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            )}

            {/* Formatted Full Address Text */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Resolved Street Address
              </span>
              <p className="text-xs font-semibold text-chocolate leading-relaxed">
                {resolvedLocation.formattedAddress}
              </p>
            </div>

            {/* Location Granular Details Breakdown (Downside Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100/80">
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Area / Locality</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {resolvedLocation.area || area || 'Bengaluru'}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">City</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {resolvedLocation.city || city || 'Bengaluru'}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">Pincode</span>
                <span className="text-xs font-bold text-amber-700 truncate block font-mono">
                  {resolvedLocation.pincode || pincode || '—'}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">State</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {resolvedLocation.state || 'Karnataka'}
                </span>
              </div>
            </div>

            {/* Nearest Serving Outlet Badge */}
            {nearestOutletInfo && (
              <div className="bg-amber-100/70 border border-amber-300/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold text-chocolate">
                      Nearest Bakery Outlet: {nearestOutletInfo.outlet.name}
                    </span>
                    <span className="text-slate-600 block text-[11px]">
                      Approx. <strong>{nearestOutletInfo.distanceKm} km</strong> from your delivery pin (Delivery in 45-60 mins)
                    </span>
                  </div>
                </div>

                {selectedOutlet?.id !== nearestOutletInfo.outlet.id && (
                  <button
                    type="button"
                    onClick={() => setSelectedOutlet(nearestOutletInfo.outlet)}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                  >
                    Select This Outlet
                  </button>
                )}
              </div>
            )}

            {/* Door / Flat & Landmark Refinements for Delivery Agent */}
            <div className="pt-2 border-t border-emerald-100/80 space-y-3">
              <span className="block text-xs font-bold text-slate-700">
                Complete Your Delivery Address Details *
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Flat / House / Floor No. & Building Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => handleHouseNumberChange(e.target.value)}
                    placeholder="e.g. Flat 304, Green Glen Heights"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nearby Landmark / Instructions
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => handleLandmarkChange(e.target.value)}
                    placeholder="e.g. Opposite Sony Center / Behind Metro Station"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Change Location or Switch to Manual */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setResolvedLocation(null);
                  setSearchQuery('');
                }}
                className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Search a different address</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className="text-slate-500 hover:text-chocolate font-medium underline"
              >
                Need to edit address manually?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        -------------------------------------------------------------
        DOWNSIDE SECTION 2: Location details are NOT shown
        (Either geocoding returned zero/error, or manual mode selected)
        "if its is doesnot shown then delivery adress can take manually"
        -------------------------------------------------------------
      */}
      {(mode === 'manual' || (mode === 'auto' && !resolvedLocation)) && (
        <div className="pt-1 space-y-4 animate-fadeIn">
          
          {/* Banner explaining fallback or manual entry */}
          {geocodingError ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-chocolate">Location details not found automatically</p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  {geocodingError} Please fill in your delivery address manually below.
                </p>
              </div>
            </div>
          ) : mode === 'manual' ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-2">
              <span className="font-semibold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Manual Address Entry Mode</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('auto');
                  setGeocodingError(null);
                }}
                className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Switch to Google Maps Search</span>
              </button>
            </div>
          ) : null}

          {/* Manual Delivery Address Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Complete Delivery Address (Door No, Building, Street) *
              </label>
              <textarea
                required
                rows={2}
                value={manualStreet}
                onChange={(e) => handleManualStreetChange(e.target.value)}
                placeholder="Flat / House No., Apartment name, Street name, Road name, Landmark..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Indiranagar"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560038"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 shadow-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAddressSelector;
