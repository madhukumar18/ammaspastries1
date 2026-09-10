import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import {
  ShieldCheck,
  Truck,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Store,
  Lock,
  UserCheck
} from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cart,
    clearCart,
    outlets,
    selectedOutlet,
    setSelectedOutlet,
    cartSubtotal,
    user,
    showToast,
  } = useApp();

  const couponData = location.state?.appliedCoupon || null;

  // Customer shipping information
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [area, setArea] = useState(selectedOutlet?.area || '');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState(selectedOutlet?.pincode || '560001');

  // Delivery options
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('45 Mins - 1 Hour (Instant)');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-chocolate">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add your favorite cakes or pastries before checking out.</p>
        <Link to="/category/cakes-pastries" className="inline-block text-xs font-bold text-white bg-amber-600 px-6 py-3 rounded-full">
          Browse Cakes
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!selectedOutlet) {
      showToast('Please select a bakery outlet.', 'error');
      return;
    }

    if (!customerPhone || customerPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number for delivery updates.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Format payload for Laravel backend
      const itemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        quantity: item.quantity,
        customization: item.customization || null,
      }));

      const orderPayload = {
        outlet_id: selectedOutlet.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        delivery_address: addressLine1,
        delivery_area: area,
        delivery_city: city,
        delivery_pincode: pincode,
        delivery_date: deliveryDate,
        delivery_time_slot: timeSlot,
        special_instructions: specialInstructions,
        coupon_code: couponData?.code || null,
        items: itemsPayload,
      };

      // 2. Create Order in Laravel (Strict backend price recalculation)
      const orderRes = await api.post('/orders/create', orderPayload);

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to create order.');
      }

      const createdOrder = orderRes.data.data;

      // 3. Initiate Razorpay order from backend
      const paymentRes = await api.post('/payments/razorpay/order', {
        order_id: createdOrder.order_id,
      });

      const paymentData = paymentRes.data?.data;

      // 4. Handle Razorpay Checkout
      if (window.Razorpay && !paymentData.is_test_mode) {
        const options = {
          key: paymentData.key_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Ammas Pastries',
          description: `Order #${createdOrder.order_number}`,
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100',
          order_id: paymentData.razorpay_order_id,
          handler: async (response) => {
            // Verify signature on backend
            try {
              const verifyRes = await api.post('/payments/razorpay/verify', {
                order_id: createdOrder.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data?.success) {
                clearCart();
                navigate(`/order-confirmation/${createdOrder.order_number}`);
              }
            } catch (vErr) {
              showToast('Payment verification error. Please contact bakery support.', 'error');
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: '#3D2314',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          showToast(`Payment failed: ${resp.error.description}`, 'error');
        });
        rzp.open();
      } else {
        // Safe local test / sandbox simulation
        showToast('Processing test order with Razorpay sandbox...', 'info');
        const verifyRes = await api.post('/payments/razorpay/verify', {
          order_id: createdOrder.order_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_signature: 'sig_test_sandbox_verified',
        });

        if (verifyRes.data?.success) {
          clearCart();
          navigate(`/order-confirmation/${createdOrder.order_number}`);
        }
      }
    } catch (err) {
      showToast(err.friendlyMessage || err.message || 'Unable to place order. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Express Checkout
          </h1>
          <p className="text-xs text-slate-500">
            {user ? `Logged in as ${user.name}` : 'Guest Checkout • No mandatory account required'}
          </p>
        </div>
        <Link to="/cart" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
          ← Back to Cart
        </Link>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Customer Contact Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>1. Customer Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (For Delivery OTP) *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (For Invoice receipt)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address & Outlet Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>2. Delivery Address & Bakery Outlet</span>
            </h2>

            {/* Serving Outlet dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Serving Outlet *</label>
              <select
                value={selectedOutlet?.id || ''}
                onChange={(e) => {
                  const out = outlets.find((o) => o.id === parseInt(e.target.value));
                  if (out) {
                    setSelectedOutlet(out);
                    setArea(out.area);
                    setPincode(out.pincode);
                  }
                }}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 font-semibold text-chocolate focus:outline-none focus:border-amber-500"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.address} ({o.opening_time} - {o.closing_time})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Complete Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Flat / House No., Apartment name, Street name, Landmark..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
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
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Schedule */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-4">
            <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>3. Delivery Schedule & Time Slot</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot *</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 font-semibold text-chocolate focus:outline-none focus:border-amber-500"
                >
                  <option value="45 Mins - 1 Hour (Instant)">45 Mins - 1 Hour (Instant Express Delivery)</option>
                  <option value="10:00 AM - 12:00 PM">Morning: 10:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 02:00 PM">Afternoon: 12:00 PM - 02:00 PM</option>
                  <option value="02:00 PM - 05:00 PM">Evening: 02:00 PM - 05:00 PM</option>
                  <option value="05:00 PM - 08:00 PM">Night: 05:00 PM - 08:00 PM</option>
                  <option value="08:00 PM - 10:00 PM">Late Evening: 08:00 PM - 10:00 PM</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Rider Delivery Instructions</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Ring bell twice, deliver to security guard, don't tilt box"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Summary & Payment CTA (5 cols) */}
        <div className="lg:col-span-5 space-y-5 sticky top-28">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-100 shadow-warm space-y-4">
            <h2 className="font-serif font-bold text-base text-chocolate pb-2 border-b border-slate-100">
              Review & Pay
            </h2>

            {/* Items review */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-chocolate truncate">{item.product.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Qty: {item.quantity} {item.variant ? `• ${item.variant.size_weight}` : ''}
                    </div>
                  </div>
                  <span className="font-bold text-chocolate">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              {couponData && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon ({couponData.code})</span>
                  <span>- ₹{couponData.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{cartSubtotal >= 1000 ? 'FREE' : '₹50'}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{Math.round((cartSubtotal - (couponData?.discount || 0)) * 0.05)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-chocolate">
                <span>Total Amount</span>
                <span className="text-xl text-amber-700">
                  ₹{Math.max(0, cartSubtotal - (couponData?.discount || 0) + (cartSubtotal >= 1000 ? 0 : 50) + Math.round((cartSubtotal - (couponData?.discount || 0)) * 0.05))}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold text-sm py-4 rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Secure Payment...' : 'Pay with Razorpay'}</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>HMAC SHA256 Verified Payment Gateway</span>
              </div>
              <div>Supports UPI, Cards, NetBanking, Razorpay Wallet</div>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};

export default CheckoutPage;
