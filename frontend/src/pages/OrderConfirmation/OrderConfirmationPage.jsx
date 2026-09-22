import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ShoppingBag,
  Truck,
  ArrowRight,
  ShieldCheck,
  Store
} from 'lucide-react';

const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trigger festive celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D97706', '#E11D48', '#3D2314', '#10B981'],
      });
    } catch (e) {
      // Ignore if canvas-confetti is not loaded
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderNumber}`);
        if (res.data?.data) {
          setOrder(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching confirmed order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      
      {/* Confirmed Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-warm text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs animate-in zoom-in">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Order Placed & Confirmed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate pt-2">
            Thank you for ordering with Ammas Pastries!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Our master chefs are freshly preparing your cake. We will deliver it fresh and delicious to your doorstep.
          </p>
        </div>

        {/* Highlight Card */}
        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/70 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Order Number</div>
            <div className="font-bold text-chocolate text-base sm:text-lg font-mono">{orderNumber}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Payment Status</div>
            <div className="font-bold text-emerald-700 text-sm flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Successful</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Estimated Delivery</div>
            <div className="font-bold text-chocolate text-sm mt-0.5">45 Mins - 1 Hour</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Link
            to={`/track-order?order=${orderNumber}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-md transition-all hover:scale-105"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>

          <Link
            to="/account"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full transition-colors"
          >
            <span>View My Orders</span>
          </Link>
        </div>
      </div>

      {/* Order Details Details */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
          <h2 className="font-serif font-bold text-lg text-chocolate pb-3 border-b border-slate-100">
            Order Breakdown
          </h2>

          <div className="divide-y divide-slate-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-chocolate">{item.product_name}</div>
                  <div className="text-xs text-slate-400">
                    Quantity: {item.quantity} {item.variant_title ? `• ${item.variant_title}` : ''}
                  </div>
                  {item.customization?.name_on_cake && (
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      Name on cake: "{item.customization.name_on_cake}"
                    </div>
                  )}
                </div>
                <span className="font-bold text-chocolate">₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Cake price:</span>
              <span className="font-semibold text-chocolate">₹{order.subtotal}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span>- ₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Delivery / Pickup charge:</span>
              <span className="font-semibold">
                {order.delivery_method === 'pickup' || Number(order.delivery_fee) === 0 ? (
                  <span className="text-emerald-700 font-bold">₹0 (Free Outlet Pickup)</span>
                ) : (
                  <span className="text-chocolate">₹{order.delivery_fee} (Home Delivery)</span>
                )}
              </span>
            </div>
            {/* GST completely removed */}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-chocolate text-base">
              <span>Final Total:</span>
              <span className="text-amber-700">₹{order.total}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderConfirmationPage;
