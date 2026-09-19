import React, { useState, useEffect } from 'react';
import {
  MonitorSmartphone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Store,
  Key,
  ShieldCheck,
  Search,
  ExternalLink,
  Filter,
  Eye,
  X,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
  Terminal,
  Building2,
  Edit3,
  Save,
  MapPin
} from 'lucide-react';
import api from '../../services/api';

const AdminRistaPosPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_orders: 0,
    synced_orders: 0,
    failed_orders: 0,
    pending_orders: 0,
    mapped_outlets: 0,
    total_outlets: 0,
  });
  const [config, setConfig] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filterOutlet, setFilterOutlet] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingOrderId, setSyncingOrderId] = useState(null);

  // Outlets State (for outlet scope filtering and statistics)
  const [outlets, setOutlets] = useState([]);

  // Payload & cURL Modal
  const [payloadModalOrder, setPayloadModalOrder] = useState(null);
  const [modalTab, setModalTab] = useState('curl'); // 'curl', 'payload', 'response'

  const generateCurlForOrder = (order) => {
    if (!order) return '';
    const url = `${config?.base_url || 'https://api-gateway.dotpe.in/api/v1'}/orders`;
    const key = '[CONFIGURED_IN_SERVER_ENV]';
    const secret = '[CONFIGURED_IN_SERVER_ENV]';
    
    const payload = order.pos_payload || {
      merchant_order_id: order.order_number,
      store_id: order.outlet?.rista_store_id || order.outlet?.code || 'AMP-MGR',
      outlet_name: order.outlet?.name,
      order_type: 'DELIVERY',
      order_source: 'AMMAS_ONLINE_STORE',
      created_at: order.created_at,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
      },
      bill_summary: {
        total_amount: Number(order.total),
      },
      payment: {
        mode: 'ONLINE',
        status: 'PAID',
        gateway: 'RAZORPAY',
      }
    };

    return `curl -X POST "${url}" \\
  -H "x-api-key: ${key}" \\
  -H "x-api-token: [DYNAMIC_HS256_JWT_TOKEN]" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2).replace(/'/g, "'\\''")}'`;
  };

  // Test Connection
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Tab Selection ('orders' or 'outlets')
  const [activeViewTab, setActiveViewTab] = useState('orders');
  const [editingOutletId, setEditingOutletId] = useState(null);
  const [editStoreIdValue, setEditStoreIdValue] = useState('');
  const [savingOutletId, setSavingOutletId] = useState(null);
  const [syncingOutlets, setSyncingOutlets] = useState(false);

  const handleSyncOutlets = async () => {
    setSyncingOutlets(true);
    try {
      const res = await api.post('/admin/rista-pos/outlets/sync');
      if (res.data?.success) {
        showToast(res.data.message || 'Outlets synced from Rista successfully!', 'success');
        await fetchOutlets();
        await fetchConfigAndStats();
      } else {
        showToast(res.data?.message || 'Could not sync outlets from Rista', 'info');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Sync failed. Please verify Rista credentials.', 'error');
    } finally {
      setSyncingOutlets(false);
    }
  };

  const handleStartEditOutlet = (outlet) => {
    setEditingOutletId(outlet.id);
    setEditStoreIdValue(outlet.rista_store_id || outlet.code || '');
  };

  const handleSaveOutletPos = async (outlet, newStoreId, newPosEnabled) => {
    setSavingOutletId(outlet.id);
    try {
      const payload = {};
      if (newStoreId !== undefined) payload.rista_store_id = newStoreId.trim();
      if (newPosEnabled !== undefined) payload.rista_pos_enabled = newPosEnabled;

      const res = await api.put(`/admin/rista-pos/outlets/${outlet.id}`, payload);
      if (res.data?.success) {
        showToast(res.data.message || 'Outlet POS configuration updated!', 'success');
        setEditingOutletId(null);
        await fetchOutlets();
        await fetchConfigAndStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update outlet POS settings', 'error');
    } finally {
      setSavingOutletId(null);
    }
  };

  // Notifications
  const [notification, setNotification] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Config & Stats
  const fetchConfigAndStats = async () => {
    try {
      const res = await api.get('/admin/rista-pos/config');
      if (res.data?.success) {
        setConfig(res.data.data.config);
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to load Rista config:', err);
    }
  };

  // Fetch Orders
  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        outlet_id: filterOutlet || undefined,
        pos_sync_status: filterStatus || undefined,
        search: searchQuery || undefined,
      };
      const res = await api.get('/admin/rista-pos/orders', { params });
      if (res.data?.success) {
        setOrders(res.data.data.data || []);
        setPagination({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          total: res.data.data.total,
        });
      }
    } catch (err) {
      console.error('Failed to load POS orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Outlets (for scope filtering and order attribution)
  const fetchOutlets = async () => {
    try {
      const res = await api.get('/admin/rista-pos/outlets');
      if (res.data?.success) {
        setOutlets(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load outlets:', err);
    }
  };

  useEffect(() => {
    fetchConfigAndStats();
    fetchOutlets();
    fetchOrders(1);
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [filterOutlet, filterStatus]);

  // Test Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.post('/admin/rista-pos/test-connection');
      setTestResult(res.data?.data);
      if (res.data?.success) {
        showToast('Connected to Rista POS Gateway successfully!', 'success');
      } else {
        showToast(res.data?.data?.message || 'Gateway connection check completed', 'info');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message,
      });
      showToast('Connection attempt encountered an error', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // Manual Push / Retry Order Sync
  const handleSyncOrder = async (orderId) => {
    setSyncingOrderId(orderId);
    try {
      const res = await api.post(`/admin/rista-pos/orders/${orderId}/sync`);
      if (res.data?.success) {
        showToast(res.data.message || 'Order pushed to Rista POS terminal!', 'success');
      } else {
        showToast(res.data.message || 'Rista POS reported an issue with the dispatch', 'error');
      }
      fetchOrders(pagination.current_page);
      fetchConfigAndStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Sync failed', 'error');
    } finally {
      setSyncingOrderId(null);
    }
  };

  const copyToClipboard = (text, keyName) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : notification.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-chocolate via-[#4E2F16] to-chocolate text-white p-6 sm:p-8 rounded-3xl shadow-warm border border-amber-900/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <MonitorSmartphone className="w-4 h-4 text-amber-400" />
            <span>Official POS Gateway Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-cream-light">
            Rista POS (DotPe) Terminal Sync
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Routes online customer orders and prepaid Razorpay payments directly to the selected outlet's Kitchen Order Ticket (KOT) printer and POS billing screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-chocolate font-bold text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>{testingConnection ? 'Pinging Gateway...' : 'Test Gateway Connection'}</span>
          </button>
        </div>
      </div>

      {/* Test Connection Diagnostics Box (if run) */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">Gateway Status: </span>
              <span>{testResult.message}</span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Target: <code className="bg-white/80 px-1 py-0.5 rounded">{testResult.gateway_url}</code> | Key: {testResult.api_key_masked}
              </div>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-slate-400 hover:text-slate-600 p-1 self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}



      {/* Navigation Tabs: Orders vs Outlets */}
      <div className="flex items-center gap-3 border-b border-cream-200 pb-1">
        <button
          onClick={() => setActiveViewTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeViewTab === 'orders'
              ? 'bg-chocolate text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-cream-100 border border-cream-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Live POS Orders & KOT</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeViewTab === 'orders' ? 'bg-white/20 text-white' : 'bg-cream-200 text-slate-700'
          }`}>
            {stats.total_orders}
          </span>
        </button>

        <button
          onClick={() => setActiveViewTab('outlets')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeViewTab === 'outlets'
              ? 'bg-chocolate text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-cream-100 border border-cream-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Outlets & Rista Store IDs</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeViewTab === 'outlets' ? 'bg-white/20 text-white' : 'bg-cream-200 text-slate-700'
          }`}>
            {outlets.length} Outlets
          </span>
        </button>
      </div>

      {/* VIEW 1: OUTLETS & RISTA STORE ID MAPPING */}
      {activeViewTab === 'outlets' && (
        <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-cream-100 bg-cream-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-chocolate flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>Bakery Outlets & Rista POS Terminal IDs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every physical bakery outlet maps to its dedicated DotPe / Rista Store ID for automated KOT printing.
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleSyncOutlets}
                disabled={syncingOutlets}
                className="text-xs font-bold text-white bg-chocolate hover:bg-amber-950 px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="Fetch and sync registered stores from Rista POS API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingOutlets ? 'animate-spin' : ''}`} />
                <span>{syncingOutlets ? 'Syncing...' : 'Sync Outlets from Rista'}</span>
              </button>

              <div className="text-xs font-semibold text-slate-700 bg-white border border-cream-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{outlets.filter((o) => o.rista_pos_enabled).length} of {outlets.length} Outlets POS Active</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-cream-100">
            {outlets.map((outlet) => {
              const isEditing = editingOutletId === outlet.id;
              const stat = stats.outlet_stats?.find((s) => String(s.id) === String(outlet.id));
              const effectiveStoreId = outlet.rista_store_id || outlet.code;

              return (
                <div
                  key={outlet.id}
                  className="p-5 sm:p-6 hover:bg-cream-50/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2 max-w-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">{outlet.name}</span>
                      <span className="px-2 py-0.5 bg-cream-100 text-slate-700 rounded-md font-mono text-xs font-bold">
                        Code: {outlet.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          outlet.rista_pos_enabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            outlet.rista_pos_enabled ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        ></span>
                        {outlet.rista_pos_enabled ? 'POS Terminal Active' : 'POS Dispatch Paused'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-bakery-600 shrink-0" />
                        {outlet.area || outlet.address || 'Bengaluru'}, {outlet.city}
                      </span>
                      {outlet.phone && <span>• 📞 {outlet.phone}</span>}
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 font-medium flex-wrap">
                      <span>Total Orders: <strong className="text-slate-900">{stat?.total_orders ?? 0}</strong></span>
                      <span>•</span>
                      <span>Revenue: <strong className="text-emerald-700 font-bold">₹{Number(stat?.total_revenue ?? 0).toLocaleString('en-IN')}</strong></span>
                      <span>•</span>
                      <span>Synced: <strong className="text-emerald-600 font-bold">{stat?.synced_orders ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Rista Store ID Configuration & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Rista Store ID:
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editStoreIdValue}
                            onChange={(e) => setEditStoreIdValue(e.target.value)}
                            placeholder={`e.g. ${outlet.code}`}
                            className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-amber-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-40 text-chocolate"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveOutletPos(outlet, editStoreIdValue, undefined)}
                            disabled={savingOutletId === outlet.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingOutletId === outlet.id ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={() => setEditingOutletId(null)}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-chocolate shadow-2xs">
                            {effectiveStoreId}
                          </code>
                          {!outlet.rista_store_id && (
                            <span className="text-[10px] text-slate-400 italic">
                              (Default Code)
                            </span>
                          )}
                          <button
                            onClick={() => handleStartEditOutlet(outlet)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-amber-800 hover:text-amber-950 font-bold bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit ID</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle POS Dispatch */}
                    <button
                      onClick={() => handleSaveOutletPos(outlet, undefined, !outlet.rista_pos_enabled)}
                      disabled={savingOutletId === outlet.id}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        outlet.rista_pos_enabled
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span>{outlet.rista_pos_enabled ? 'Pause POS' : 'Activate POS'}</span>
                    </button>

                    {/* View Filtered Orders */}
                    <button
                      onClick={() => {
                        setFilterOutlet(String(outlet.id));
                        setActiveViewTab('orders');
                      }}
                      className="px-4 py-2.5 bg-chocolate text-white hover:bg-chocolate/90 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <span>View Orders</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE POS ORDERS FEED */}
      {activeViewTab === 'orders' && (() => {
        const activeOutletObj = outlets.find((o) => String(o.id) === String(filterOutlet));
        const activeOutletStat = stats.outlet_stats?.find((s) => String(s.id) === String(filterOutlet));

        return (
          <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden space-y-4">
            {/* 1. OUTLET SCOPE SELECTOR (Total Store vs Particular Outlet) */}
            <div className="p-4 sm:p-5 border-b border-cream-100 bg-cream-50/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-bakery-700" />
                  <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                    Select View: Total Store Orders or Particular Outlet
                  </span>
                </div>
                {filterOutlet && (
                  <button
                    onClick={() => setFilterOutlet('')}
                    className="text-xs text-bakery-600 hover:text-bakery-800 font-semibold underline cursor-pointer self-start sm:self-auto"
                  >
                    Reset to All Outlets (Total Store Orders)
                  </button>
                )}
              </div>

              {/* Outlet Pill Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {/* All Outlets Button */}
                <button
                  onClick={() => setFilterOutlet('')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    !filterOutlet
                      ? 'bg-chocolate text-white shadow-sm ring-2 ring-chocolate/20'
                      : 'bg-white text-slate-700 border border-cream-200 hover:border-bakery-400 hover:bg-cream-50'
                  }`}
                >
                  <span>🏢 All Outlets (Total Store)</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    !filterOutlet ? 'bg-white/20 text-white' : 'bg-cream-100 text-slate-700'
                  }`}>
                    {stats.total_orders}
                  </span>
                </button>

                {/* Individual Outlets */}
                {outlets.map((outlet) => {
                  const isSelected = String(filterOutlet) === String(outlet.id);
                  const stat = stats.outlet_stats?.find((s) => String(s.id) === String(outlet.id));
                  const orderCount = stat ? stat.total_orders : 0;

                  return (
                    <button
                      key={outlet.id}
                      onClick={() => setFilterOutlet(isSelected ? '' : String(outlet.id))}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-bakery-600 text-white shadow-sm ring-2 ring-bakery-500/30'
                          : 'bg-white text-slate-700 border border-cream-200 hover:border-bakery-400 hover:bg-cream-50'
                      }`}
                    >
                      <span>📍 {outlet.name.replace('Ammas Pastries - ', '')}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-cream-100 text-slate-700'
                      }`}>
                        {orderCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. ACTIVE OUTLET FOCUS BANNER (When a particular outlet is selected) */}
            {activeOutletObj && (
              <div className="mx-4 sm:mx-5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                    🏪
                  </div>
                  <div>
                    <div className="font-bold text-chocolate text-sm">
                      Viewing Particular Outlet: {activeOutletObj.name}
                    </div>
                    <div className="text-slate-600 text-[11px] flex items-center gap-2 flex-wrap mt-0.5">
                      <span>Rista Store ID: <strong className="font-mono text-slate-800">{activeOutletObj.rista_store_id || activeOutletObj.code}</strong></span>
                      <span>•</span>
                      <span>Outlet Orders: <strong>{activeOutletStat?.total_orders ?? pagination.total}</strong></span>
                      <span>•</span>
                      <span>Revenue: <strong className="text-emerald-700 font-bold">₹{Number(activeOutletStat?.total_revenue ?? 0).toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Direct Terminal Dispatch
                  </span>
                  <button
                    onClick={() => setFilterOutlet('')}
                    className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-chocolate rounded-lg font-bold text-xs cursor-pointer transition-colors"
                  >
                    View All Outlets
                  </button>
                </div>
              </div>
            )}

            {/* 3. Filters & Search Bar */}
            <div className="px-4 sm:px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
                    placeholder="Search order #, customer phone, or Rista ID..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-500"
                  />
                </div>

                {/* Outlet Filter Dropdown */}
                <select
                  value={filterOutlet}
                  onChange={(e) => setFilterOutlet(e.target.value)}
                  className="text-xs sm:text-sm py-2 px-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-500 font-medium"
                >
                  <option value="">All Outlets (Total Store)</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs sm:text-sm py-2 px-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-500"
                >
                  <option value="">All POS Statuses</option>
                  <option value="synced">Synced (In Terminal)</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed / Retry</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              <button
                onClick={() => fetchOrders(pagination.current_page)}
                className="inline-flex items-center gap-1.5 text-xs text-bakery-700 bg-cream-100 hover:bg-cream-200 px-3 py-2 rounded-xl transition-colors font-medium self-end md:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Feed
              </button>
            </div>

            {/* 4. Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Selected Outlet (Attributed)</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">POS Sync Status</th>
                    <th className="py-3 px-4">Rista Order Ref</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-bakery-500" />
                        Loading live POS orders feed...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        No orders found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const isSynced = order.pos_synced;
                      const isFailed = order.pos_sync_status === 'failed';
                      const isPending = order.pos_sync_status === 'pending';

                      return (
                        <tr key={order.id} className="hover:bg-cream-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-chocolate">
                            <div>{order.order_number}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {new Date(order.created_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{order.customer_name}</div>
                            <div className="text-[11px] text-slate-500">{order.customer_phone}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{order.outlet?.name || 'Unassigned'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Store ID: <span className="font-mono">{order.outlet?.rista_store_id || order.outlet?.code}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            ₹{Number(order.total).toLocaleString('en-IN')}
                            <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                              {order.payment_status} ({order.payment_method})
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isSynced ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Synced to POS
                              </span>
                            ) : isFailed ? (
                              <span
                                title={order.pos_error || 'Failed'}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                              >
                                <AlertCircle className="w-3.5 h-3.5" /> Sync Failed
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" /> Direct Syncing...
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                Skipped
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                            {order.pos_order_id ? (
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                                {order.pos_order_id}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setPayloadModalOrder(order);
                                setModalTab('curl');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cream-300 bg-white hover:bg-cream-100 text-chocolate font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              title="Inspect POS Payload & cURL Command"
                            >
                              <Eye className="w-3.5 h-3.5 text-bakery-600" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="p-4 border-t border-cream-100 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500">
                  Page {pagination.current_page} of {pagination.last_page} ({pagination.total} orders)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => fetchOrders(pagination.current_page - 1)}
                    className="p-1.5 rounded-lg border border-cream-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => fetchOrders(pagination.current_page + 1)}
                    className="p-1.5 rounded-lg border border-cream-200 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* PAYLOAD & CURL INSPECTOR MODAL */}
      {payloadModalOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-chocolate text-white">
              <div className="flex items-center gap-2.5">
                <MonitorSmartphone className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Rista POS Order Details — {payloadModalOrder.order_number}
                  </h3>
                  <p className="text-xs text-amber-200">
                    Store ID: {payloadModalOrder.outlet?.rista_store_id || payloadModalOrder.outlet?.code} ({payloadModalOrder.outlet?.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayloadModalOrder(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
              <button
                onClick={() => setModalTab('curl')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'curl'
                    ? 'border-bakery-600 text-bakery-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>cURL Request</span>
              </button>
              <button
                onClick={() => setModalTab('payload')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'payload'
                    ? 'border-bakery-600 text-bakery-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📦 JSON Payload</span>
              </button>
              <button
                onClick={() => setModalTab('response')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  modalTab === 'response'
                    ? 'border-bakery-600 text-bakery-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🌐 Gateway Response</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono bg-slate-900 text-emerald-400">
              {/* Tab 1: cURL Command */}
              {modalTab === 'curl' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">
                      Equivalent Rista POS cURL Request
                    </span>
                    <button
                      onClick={() => copyToClipboard(generateCurlForOrder(payloadModalOrder), 'modal_curl')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedKey === 'modal_curl' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied cURL!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy cURL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto border border-slate-800 text-[11px] leading-relaxed text-amber-300 whitespace-pre-wrap select-all">
                    {generateCurlForOrder(payloadModalOrder)}
                  </pre>
                </div>
              )}

              {/* Tab 2: Raw JSON Payload */}
              {modalTab === 'payload' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">
                      Direct Outlet Payload Transmitted:
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(payloadModalOrder.pos_payload, null, 2), 'modal_json')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedKey === 'modal_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto border border-slate-800 text-[11px] leading-relaxed text-emerald-300">
                    {JSON.stringify(payloadModalOrder.pos_payload, null, 2) || '// Direct payload recorded on payment confirmation'}
                  </pre>
                </div>
              )}

              {/* Tab 3: Gateway Response */}
              {modalTab === 'response' && (
                <div>
                  <span className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider block mb-2">
                    Gateway Terminal Response:
                  </span>
                  <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto border border-slate-800 text-[11px] leading-relaxed text-cyan-300">
                    {JSON.stringify(payloadModalOrder.pos_response, null, 2) || '// Awaiting response confirmation'}
                  </pre>
                </div>
              )}

              {payloadModalOrder.pos_error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 font-sans text-xs">
                  <span className="font-bold">Sync Error Log:</span> {payloadModalOrder.pos_error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500 font-sans">
                Status:{' '}
                <strong className={payloadModalOrder.pos_synced ? 'text-emerald-600' : 'text-amber-600'}>
                  {payloadModalOrder.pos_sync_status?.toUpperCase()}
                </strong>
              </span>
              <button
                onClick={() => setPayloadModalOrder(null)}
                className="px-4 py-2 bg-chocolate text-white rounded-xl text-xs font-bold hover:bg-opacity-90 cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRistaPosPage;
