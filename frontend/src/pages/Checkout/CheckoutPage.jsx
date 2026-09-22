import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import ProductCarousel from '../../components/UI/ProductCarousel';
import DeliveryAddressSelector from '../../components/Address/DeliveryAddressSelector';
import ScheduleDeliveryPicker from '../../components/Checkout/ScheduleDeliveryPicker';
import {
  getEarliestValidTime,
  formatTimeString,
  getTodayDateString,
  isDateInPast,
  validateDeliveryDate,
} from '../../utils/timeValidation';
import {
  ShieldCheck,
  Truck,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Store,
  Lock,
  UserCheck,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Dynamic loader to guarantee Razorpay script is present
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.onload = () => resolve(true);
      existing.onerror = () => resolve(false);
      if (window.Razorpay) resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  // Delivery option: 'home_delivery' (+₹100) or 'pickup' (₹0) - required selection
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const deliveryCharge = deliveryMethod === 'home_delivery' ? 100 : 0;
  const finalTotal = Math.max(0, cartSubtotal - (couponData?.discount || 0) + (deliveryMethod ? deliveryCharge : 0));

  // Delivery options
  const [deliveryDate, setDeliveryDate] = useState(getTodayDateString);
  const [timeSlot, setTimeSlot] = useState(() => {
    const earliest = getEarliestValidTime(getTodayDateString());
    return formatTimeString(earliest.hour, earliest.minute, earliest.second, earliest.period);
  });
  const [isTimeSlotValid, setIsTimeSlotValid] = useState(true);
  const [timeSlotError, setTimeSlotError] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment option
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const [isProcessing, setIsProcessing] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const catSlug = cart[0]?.product?.category?.slug || 'cakes-pastries';
        const res = await api.get(`/products?category=${catSlug}&per_page=10`);
        if (res.data?.data) {
          const cartProductIds = cart.map((item) => item.product?.id);
          const filtered = res.data.data.filter((p) => !cartProductIds.includes(p.id));
          setRelatedProducts(filtered.length > 0 ? filtered : res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load related products for checkout:', err);
      }
    };

    fetchRelated();
  }, [cart[0]?.product?.category?.slug]);

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

    if (!deliveryMethod) {
      showToast('Please select a Delivery Option: Home Delivery or Pickup from Outlet.', 'error');
      return;
    }

    if (deliveryMethod === 'home_delivery' && (!addressLine1 || addressLine1.trim().length < 5)) {
      showToast('Please enter your complete address for Home Delivery.', 'error');
      return;
    }

    if (!selectedOutlet) {
      showToast('Please select a bakery outlet.', 'error');
      return;
    }

    if (!customerPhone || customerPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number for delivery updates.', 'error');
      return;
    }

    const dateValidation = validateDeliveryDate(deliveryDate);
    if (!dateValidation.isValid) {
      showToast(dateValidation.error, 'error');
      return;
    }

    if (!isTimeSlotValid) {
      showToast(timeSlotError || 'Please select a valid delivery time slot.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Format payload for Laravel backend
      const itemsPayload = cart.map((item) => {
        const rawVariantId = item.variant?.id;
        const isDbVariantId = rawVariantId && !isNaN(Number(rawVariantId)) && Number(rawVariantId) > 0 && !String(rawVariantId).includes('-');

        return {
          product_id: item.product?.id || item.productId || item.id,
          variant_id: isDbVariantId ? Number(rawVariantId) : null,
          quantity: parseInt(item.quantity, 10) || 1,
          customization: {
            ...(item.customization || {}),
            selected_weight_portion: item.customization?.selected_weight_portion || item.variant?.size_weight || item.product?.weight || null,
            unit_price: item.price || item.customization?.selected_price || item.variant?.price || item.product?.discount_price || item.product?.base_price || 0,
          },
        };
      });

      const orderPayload = {
        outlet_id: selectedOutlet.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'pickup'
          ? `Outlet Pickup at ${selectedOutlet.name} (${selectedOutlet.address || selectedOutlet.area || 'Bengaluru'})`
          : addressLine1,
        delivery_area: deliveryMethod === 'pickup'
          ? (selectedOutlet.area || 'Bengaluru')
          : (area || 'Bengaluru'),
        delivery_city: city || 'Bengaluru',
        delivery_pincode: deliveryMethod === 'pickup'
          ? (selectedOutlet.pincode || '560001')
          : (pincode || '560001'),
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
      const isMockSimulation = Boolean(
        paymentData?.is_mock_simulation ||
        (!paymentData?.razorpay_order_id?.startsWith('order_') && paymentData?.is_test_mode)
      );

      // 4. Handle Razorpay Checkout Modal
      const rzpLoaded = await loadRazorpayScript();

      if (rzpLoaded && window.Razorpay && !isMockSimulation) {
        const options = {
          key: paymentData.key_id,
          amount: paymentData.amount,
          currency: paymentData.currency || 'INR',
          name: 'Ammas Pastries',
          description: `Order #${createdOrder.order_number}`,
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100',
          order_id: paymentData.razorpay_order_id,
          handler: async (response) => {
            // Verify signature on backend
            try {
              showToast('Verifying payment with bank...', 'info');
              const verifyRes = await api.post('/payments/razorpay/verify', {
                order_id: createdOrder.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data?.success) {
                clearCart();
                navigate(`/order-confirmation/${createdOrder.order_number}`);
              } else {
                showToast(verifyRes.data?.message || 'Payment verification failed.', 'error');
              }
            } catch (vErr) {
              showToast('Payment verification error. Please contact bakery support.', 'error');
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail || 'mkumar200418@gmail.com',
            contact: customerPhone,
          },
          notes: {
            order_number: createdOrder.order_number,
            outlet: selectedOutlet?.name,
          },
          theme: {
            color: '#3D2314',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              showToast('Payment window closed. You can retry paying whenever you are ready.', 'info');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setIsProcessing(false);
          showToast(`Payment failed: ${resp.error?.description || 'Transaction declined'}`, 'error');
        });
        rzp.open();
      } else {
        // Safe local test / sandbox simulation fallback
        showToast('Processing test order with Razorpay sandbox simulation...', 'info');
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
        setIsProcessing(false);
      }
    } catch (err) {
      showToast(err.friendlyMessage || err.message || 'Unable to place order. Please try again.', 'error');
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

          {/* Section 2: Delivery Option Selection (Required) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>2. Delivery Option *</span>
              </h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                deliveryMethod ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
              }`}>
                {deliveryMethod ? 'Option Selected' : 'Required Selection'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Home Delivery */}
              <div
                onClick={() => setDeliveryMethod('home_delivery')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  deliveryMethod === 'home_delivery'
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="delivery_option"
                  id="opt_home_delivery"
                  checked={deliveryMethod === 'home_delivery'}
                  onChange={() => setDeliveryMethod('home_delivery')}
                  className="mt-1 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label htmlFor="opt_home_delivery" className="font-bold text-sm text-chocolate cursor-pointer flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-600" />
                      Home Delivery
                    </label>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      + ₹100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Fresh doorstep delivery anywhere across Bengaluru with real-time updates.
                  </p>
                </div>
              </div>

              {/* Option B: Pickup from Outlet */}
              <div
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  deliveryMethod === 'pickup'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="delivery_option"
                  id="opt_pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => setDeliveryMethod('pickup')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label htmlFor="opt_pickup" className="font-bold text-sm text-chocolate cursor-pointer flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-700" />
                      Pickup from Outlet
                    </label>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      FREE (₹0)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Collect directly from the nearest Ammas Pastries bakery outlet counter.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Address / Pickup Outlet Location */}
          {deliveryMethod === 'pickup' ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>3. Pickup Outlet Location *</span>
                </h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Zero Delivery Charge (₹0)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Ammas Pastries Outlet for Order Pickup:
                </label>
                <select
                  value={selectedOutlet?.id || ''}
                  onChange={(e) => {
                    const found = outlets.find((o) => String(o.id) === String(e.target.value));
                    if (found) setSelectedOutlet(found);
                  }}
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-500 text-slate-800 shadow-2xs"
                >
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name} — {outlet.area || outlet.address}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOutlet && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-xs space-y-1.5">
                  <div className="font-bold text-chocolate flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{selectedOutlet.name}</span>
                  </div>
                  <p className="text-slate-600 pl-5 leading-relaxed">
                    {selectedOutlet.address}
                  </p>
                  {selectedOutlet.phone && (
                    <p className="text-slate-500 pl-5 text-[11px]">
                      Store Contact: <strong className="text-slate-700">{selectedOutlet.phone}</strong>
                    </p>
                  )}
                  <div className="pl-5 pt-1 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Ready for collection at your scheduled pickup time slot.</span>
                  </div>
                </div>
              )}
            </div>
          ) : deliveryMethod === 'home_delivery' ? (
            <DeliveryAddressSelector
              addressLine1={addressLine1}
              setAddressLine1={setAddressLine1}
              area={area}
              setArea={setArea}
              city={city}
              setCity={setCity}
              pincode={pincode}
              setPincode={setPincode}
              selectedOutlet={selectedOutlet}
              setSelectedOutlet={setSelectedOutlet}
              outlets={outlets}
              showToast={showToast}
            />
          ) : (
            <div className="p-6 text-center bg-slate-50 border-2 border-dashed border-amber-200 rounded-3xl space-y-2">
              <Truck className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="font-bold text-chocolate text-sm">Please Select a Delivery Option Above</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose <strong>Home Delivery (+₹100)</strong> or <strong>Pickup from Outlet (Free)</strong> in Section 2 to enter your address or select your pickup outlet.
              </p>
            </div>
          )}

          {/* Section 4: Delivery Schedule & Time Slot */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>4. Schedule & Time Slot</span>
              </h2>
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                Operating Window: 9:00 AM – 10:30 PM
              </span>
            </div>

            <div className="space-y-4">
              {/* Delivery Schedule Picker matching requested modern card design */}
              <ScheduleDeliveryPicker
                deliveryDate={deliveryDate}
                onDateChange={(newDate) => setDeliveryDate(newDate)}
                timeSlot={timeSlot}
                onTimeChange={(newTime, isValid, error) => {
                  setTimeSlot(newTime);
                  setIsTimeSlotValid(isValid);
                  setTimeSlotError(error);
                }}
                isTimeSlotValid={isTimeSlotValid}
                timeSlotError={timeSlotError}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={deliveryMethod === 'pickup' ? "e.g. Will pick up by 4 PM, keep candles packed" : "e.g. Ring bell twice, deliver to security guard, don't tilt box"}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Payment Method Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>5. Payment Method</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Encrypted
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Razorpay (Active) */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-emerald-600 bg-emerald-50/30'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    id="method_razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label htmlFor="method_razorpay" className="font-bold text-xs sm:text-sm text-chocolate cursor-pointer">
                        Online Payment via Razorpay (UPI, Cards, NetBanking, Wallets)
                      </label>
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Instant Confirmation
                      </span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-500">
                      When you click <strong>Pay Securely</strong>, the Razorpay window will open where you can select your preferred payment mode (Google Pay, PhonePe, Paytm, Credit/Debit Card, or NetBanking).
                    </p>

                    {/* Visual Badges for Supported Instruments */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        UPI (GPay / PhonePe / Paytm / QR)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        Cards (Visa / MasterCard / RuPay)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                        🏛️ NetBanking (50+ Banks)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                        👛 Wallets
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Cash on Delivery (Disabled for perishable cakes) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 opacity-70">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    id="method_cod"
                    disabled
                    checked={false}
                    className="mt-1 text-slate-400"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label htmlFor="method_cod" className="font-semibold text-xs sm:text-sm text-slate-500 cursor-not-allowed">
                        Cash on Delivery (Unavailable)
                      </label>
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                        Online Prepaid Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ammas Pastries bakes fresh cakes strictly to order. 100% online prepayment is required to prevent cake spoilage and confirm delivery slot.
                    </p>
                  </div>
                </div>
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
                      {item.customization?.shape ? ` • Shape: ${item.customization.shape}` : ''}
                    </div>
                  </div>
                  <span className="font-bold text-chocolate">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Cake price</span>
                <span className="font-semibold text-chocolate">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {couponData && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon ({couponData.code})</span>
                  <span>- ₹{couponData.discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Delivery / Pickup charge</span>
                <span className="font-bold">
                  {!deliveryMethod ? (
                    <span className="text-rose-600 font-bold bg-rose-50 text-[10px] px-2 py-0.5 rounded border border-rose-200">
                      Selection Required
                    </span>
                  ) : deliveryMethod === 'home_delivery' ? (
                    <span className="text-chocolate">₹100 (Home Delivery)</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">₹0 (Free Outlet Pickup)</span>
                  )}
                </span>
              </div>

              {/* GST completely removed: no tax line item, no tax addition */}

              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-chocolate">
                <span>Final Total</span>
                <span className="text-xl text-amber-700">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Mode Indicator */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Selected Mode:</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Razorpay (UPI / Cards)
              </span>
            </div>

            {/* Delivery Slot Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Scheduled Slot:
                </span>
                <span className="font-bold text-chocolate">
                  {timeSlot}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                Delivery Date: <span className="font-semibold text-slate-600">{deliveryDate}</span>
              </div>
            </div>

            {/* Validation warning if date or time slot is invalid */}
            {(isDateInPast(deliveryDate) || !isTimeSlotValid) && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {isDateInPast(deliveryDate)
                    ? "Please select today's date or a future date."
                    : (timeSlotError || 'Please choose a valid time slot.')}
                </span>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isProcessing || !isTimeSlotValid || isDateInPast(deliveryDate)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold text-sm py-4 rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Opening Payment Gateway...'
                  : !deliveryMethod
                    ? 'Select Delivery Option to Continue'
                    : `Pay ₹${finalTotal.toLocaleString('en-IN')} Securely`}
              </span>
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>HMAC SHA256 Verified Payment Gateway</span>
              </div>
              <div>Choose UPI (GPay/PhonePe), Card, or NetBanking in the next step</div>
            </div>
          </div>
        </div>

      </form>

      {/* Related Products Carousel for Celebration Add-ons */}
      {relatedProducts.length > 0 && (
        <div className="pt-6">
          <ProductCarousel
            products={relatedProducts}
            title="Complete Your Celebration: Related Treats"
            subtitle="Frequently ordered together • Same instant Add to Cart & Order actions"
            badgeText="Add More To Your Celebration"
            onAddToCart={(product, variant) => {
              addToCart(product, variant, 1);
            }}
            onOrderNow={(product, variant) => {
              addToCart(product, variant, 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
