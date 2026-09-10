import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import {
  Package,
  Clock,
  MapPin,
  User,
  Heart,
  LogOut,
  ChevronRight,
  Truck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, logoutUser, wishlist } = useApp();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/user/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data?.data) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching previous orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Account Header */}
      <div className="bg-gradient-to-r from-cream via-amber-50 to-cream rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-md">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-chocolate">{user.name}</h1>
            <p className="text-xs text-slate-500">{user.email || user.phone || 'Ammas Pastries Customer'}</p>
          </div>
        </div>

        <button
          onClick={() => {
            logoutUser();
            navigate('/');
          }}
          className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2-Column Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Nav Menu (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-3 border border-amber-100 shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500/10 text-chocolate border border-amber-300/60'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-amber-600" />
              <span>My Orders ({orders.length})</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <Link
            to="/track-order"
            className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Track An Order</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/wishlist"
            className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>My Wishlist ({wishlist.length})</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-amber-500/10 text-chocolate border border-amber-300/60'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-amber-600" />
              <span>Profile Settings</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Right Content View (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-chocolate">Previous Orders</h2>

              {loadingOrders ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading your orders...</div>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const isDelivered = order.order_status === 'delivered';
                  const isPreparing = order.order_status === 'preparing';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-bold font-mono text-chocolate">#{order.order_number}</span>
                          <div className="text-[11px] text-slate-400">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPreparing
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {order.order_status.replace('_', ' ')}
                          </span>

                          <Link
                            to={`/track-order?order=${order.order_number}`}
                            className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1 rounded-full"
                          >
                            Track →
                          </Link>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-chocolate">{item.product_name}</span>
                              <span className="text-slate-400 text-[11px] ml-2">
                                (Qty: {item.quantity} {item.variant_title ? `• ${item.variant_title}` : ''})
                              </span>
                              {item.customization?.name_on_cake && (
                                <div className="text-[11px] text-amber-800">
                                  Message: "{item.customization.name_on_cake}"
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-chocolate">₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div>
                          Outlet: <strong>{order.outlet?.name}</strong>
                        </div>
                        <div className="text-sm font-bold text-chocolate">
                          Total: ₹{order.total}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
                  <div className="text-4xl">📦</div>
                  <h3 className="font-serif font-bold text-base text-chocolate">No orders yet</h3>
                  <p className="text-xs text-slate-500">You haven't placed any orders with this account yet.</p>
                  <Link
                    to="/category/cakes-pastries"
                    className="inline-block text-xs font-bold text-white bg-amber-600 px-5 py-2.5 rounded-full"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
              <h2 className="font-serif font-bold text-xl text-chocolate">Personal Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <div className="text-slate-400 font-semibold mb-1">Name</div>
                  <div className="font-bold text-chocolate text-sm">{user.name}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <div className="text-slate-400 font-semibold mb-1">Email Address</div>
                  <div className="font-bold text-chocolate text-sm">{user.email || 'Not configured'}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <div className="text-slate-400 font-semibold mb-1">Mobile Phone</div>
                  <div className="font-bold text-chocolate text-sm">{user.phone || 'Not configured'}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl">
                  <div className="text-slate-400 font-semibold mb-1">Account Role</div>
                  <div className="font-bold text-emerald-700 text-sm capitalize">{user.role}</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AccountPage;
