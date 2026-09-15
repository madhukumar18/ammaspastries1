import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Package,
  Store,
  ChefHat
} from 'lucide-react';

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get('order') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please enter both Order Number and Mobile Number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/orders/track', {
        order_number: orderNumber.trim(),
        phone: phone.trim(),
      });

      if (res.data?.data) {
        setTrackingData(res.data.data);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Order not found. Please double-check your Order Number and Mobile Number.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          <Truck className="w-3.5 h-3.5" />
          <span>Real-Time Kitchen Updates</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
          Track Your Bakery Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your Ammas Pastries Order ID and phone number to follow your cake from the oven to your doorstep.
        </p>
      </div>

      {/* Tracking Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm max-w-2xl mx-auto">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Order Number *
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 62473"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 font-mono font-bold text-chocolate uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-medium border border-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Locating Your Order...' : 'Track Order Progress'}</span>
          </button>
        </form>
      </div>

      {/* 3-Stage Visual Progress Tracker Result */}
      {trackingData && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-warm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Order Tracking</div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-chocolate">
                #{trackingData.order.order_number}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Scheduled:</span>
              <span className="bg-amber-100/70 text-chocolate font-bold px-3 py-1 rounded-full">
                {trackingData.order.delivery_time_slot}
              </span>
            </div>
          </div>

          {/* 3 STAGE PROGRESS TRACKER */}
          <div className="max-w-md mx-auto py-4 space-y-8 relative">
            {trackingData.stages.map((stage, idx) => {
              const isLast = idx === trackingData.stages.length - 1;
              return (
                <div key={stage.id} className="relative flex items-start gap-4">
                  {/* Connecting Line */}
                  {!isLast && (
                    <div
                      className={`absolute left-5 top-10 bottom-0 w-0.5 -mb-6 ${
                        stage.completed ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Stage Icon Node */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 transition-all ${
                      stage.completed
                        ? 'bg-emerald-600 text-white shadow-md'
                        : stage.active
                        ? 'bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {stage.completed ? <CheckCircle2 className="w-5 h-5" /> : stage.id}
                  </div>

                  {/* Stage Content */}
                  <div className="pt-1 space-y-1">
                    <div
                      className={`font-serif font-bold text-sm sm:text-base ${
                        stage.completed
                          ? 'text-emerald-900'
                          : stage.active
                          ? 'text-amber-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.name}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Outlet & Address Info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <div className="font-bold text-chocolate mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>Baking Outlet</span>
              </div>
              <p>{trackingData.order.outlet.name}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">{trackingData.order.outlet.phone}</p>
            </div>

            <div>
              <div className="font-bold text-chocolate mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Destination</span>
              </div>
              <p>{trackingData.order.delivery_address}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {trackingData.order.delivery_area}, {trackingData.order.delivery_city} - {trackingData.order.delivery_pincode}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default TrackOrderPage;
