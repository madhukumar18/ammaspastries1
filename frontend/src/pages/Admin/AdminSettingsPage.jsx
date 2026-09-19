import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Settings, FileText, Save, CheckCircle2, Shield, Bell, Truck, Phone, Zap, Database, Server, RefreshCw, Trash2, AlertCircle, Info, Cake, RotateCcw } from 'lucide-react';

const AdminSettingsPage = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'policies'

  // Key-value settings
  const [settings, setSettings] = useState({
    delivery_bar_message: '',
    delivery_start_time: '09:00 AM',
    delivery_end_time: '10:00 PM',
    free_delivery_threshold: '1000',
    support_phone: '+91 98450 12345',
    support_email: 'mkumar200418@gmail.com',
    gst_number: '29ABCDE1234F1Z5',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Policies
  const [policies, setPolicies] = useState([]);
  const [selectedPolicySlug, setSelectedPolicySlug] = useState('terms-conditions');
  const [policyForm, setPolicyForm] = useState({ title: '', content: '' });
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Cache & Redis State
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loadingCacheStatus, setLoadingCacheStatus] = useState(false);
  const [clearingCacheType, setClearingCacheType] = useState(null); // 'catalog' | 'all' | 'system'

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [setRes, polRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/policies'),
      ]);

      if (setRes.data?.data) {
        setSettings((prev) => ({ ...prev, ...setRes.data.data }));
      }
      if (polRes.data?.data && polRes.data.data.length > 0) {
        setPolicies(polRes.data.data);
        const first = polRes.data.data[0];
        setSelectedPolicySlug(first.slug);
        setPolicyForm({ title: first.title, content: first.content });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePolicySelect = (slug) => {
    setSelectedPolicySlug(slug);
    const pol = policies.find((p) => p.slug === slug);
    if (pol) {
      setPolicyForm({ title: pol.title, content: pol.content });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.post('/admin/settings', settings);
      showToast('Global settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      await api.put(`/admin/policies/${selectedPolicySlug}`, policyForm);
      showToast('Policy updated successfully!', 'success');
      setPolicies((prev) =>
        prev.map((p) =>
          p.slug === selectedPolicySlug ? { ...p, title: policyForm.title, content: policyForm.content } : p
        )
      );
    } catch (err) {
      showToast('Failed to update policy', 'error');
    } finally {
      setSavingPolicy(false);
    }
  };

  const fetchCacheStatus = async () => {
    setLoadingCacheStatus(true);
    try {
      const res = await api.get('/admin/cache/status');
      if (res.data?.data) {
        setCacheStatus(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not fetch cache status', 'error');
    } finally {
      setLoadingCacheStatus(false);
    }
  };

  const handleClearCache = async (scope) => {
    setClearingCacheType(scope);
    try {
      const res = await api.post('/admin/cache/clear', { scope });
      showToast(res.data?.message || 'Cache cleared successfully!', 'success');
      await fetchCacheStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to clear cache', 'error');
    } finally {
      setClearingCacheType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Store Settings & Legal Content</h1>
          <p className="text-sm text-gray-500">
            Configure delivery timings, top banner notices, contact information, and editable policies.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-cream-100 p-1.5 rounded-2xl border border-cream-200 self-start overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'general' ? 'bg-white text-bakery-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'policies' ? 'bg-white text-bakery-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Legal Policies
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('cache');
              fetchCacheStatus();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cache' ? 'bg-white text-bakery-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Performance & Cache
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading settings...</div>
      ) : activeTab === 'general' ? (
        /* GENERAL SETTINGS FORM */
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm space-y-6">
          <div className="border-b border-cream-100 pb-4">
            <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-bakery-600" /> Delivery Bar & Operational Timings
            </h2>
            <p className="text-xs text-gray-500">
              This message appears in the sticky top banner of the website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Top Delivery Announcement Message
              </label>
              <input
                type="text"
                value={settings.delivery_bar_message}
                onChange={(e) => setSettings({ ...settings, delivery_bar_message: e.target.value })}
                placeholder="Next Delivery Slot: Today by 2:00 PM | Same Day Express Delivery Across Bengaluru"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Start Time</label>
              <input
                type="text"
                value={settings.delivery_start_time}
                onChange={(e) => setSettings({ ...settings, delivery_start_time: e.target.value })}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Cutoff Time</label>
              <input
                type="text"
                value={settings.delivery_end_time}
                onChange={(e) => setSettings({ ...settings, delivery_end_time: e.target.value })}
                placeholder="10:00 PM"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>
          </div>

          <div className="border-t border-cream-100 pt-6">
            <h3 className="text-sm font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-bakery-600" /> Customer Support & Business Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support Hotline</label>
                <input
                  type="text"
                  value={settings.support_phone}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  placeholder="mkumar200418@gmail.com"
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={settings.gst_number}
                  onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                  placeholder="29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-cream-100">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save General Settings'}
            </button>
          </div>
        </form>
      ) : activeTab === 'policies' ? (
        /* POLICY EDITOR */
        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-bakery-600" /> Terms, Privacy & Shipping Policies
            </h2>
            <p className="text-xs text-gray-500">
              Select a policy below to edit its legal title and rich body content.
            </p>
          </div>

          {/* Policy Selector Pills */}
          <div className="flex flex-wrap gap-2 border-b border-cream-100 pb-4">
            {policies.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => handlePolicySelect(p.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedPolicySlug === p.slug
                    ? 'bg-bakery-600 text-white shadow-sm'
                    : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Policy Title</label>
              <input
                type="text"
                required
                value={policyForm.title}
                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Policy Content</label>
              <textarea
                rows={14}
                required
                value={policyForm.content}
                onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                className="w-full px-4 py-3 border border-cream-300 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-bakery-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPolicy}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {savingPolicy ? 'Saving...' : 'Save Policy Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* PERFORMANCE & CACHE MANAGEMENT */
        <div className="space-y-6">
          {/* Top Status Overview */}
          <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-100 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Cache & Redis Engine Status
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monitor in-memory query caching, response acceleration, and Redis connection health.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchCacheStatus}
                  disabled={loadingCacheStatus}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-bakery-900 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCacheStatus ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cache Driver */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cache Driver</span>
                  <Database className="w-4 h-4 text-chocolate" />
                </div>
                <div className="text-lg font-bold text-slate-800 capitalize font-mono">
                  {cacheStatus?.cache_driver || 'database'}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {cacheStatus?.is_redis_active_driver ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Redis In-Memory
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                      Standard Store ({cacheStatus?.cache_driver})
                    </span>
                  )}
                </div>
              </div>

              {/* Redis Connection */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Redis Daemon</span>
                  <Server className="w-4 h-4 text-chocolate" />
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {cacheStatus?.redis?.connected ? (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" /> Online
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1.5 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" /> Standby / Local
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  {cacheStatus?.redis?.host || '127.0.0.1'}:{cacheStatus?.redis?.port || '6379'} ({cacheStatus?.redis?.client || 'phpredis'})
                </div>
              </div>

              {/* Memory Used */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memory Used</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-lg font-bold text-slate-800 font-mono">
                  {cacheStatus?.redis?.info?.memory_used || (cacheStatus?.redis?.connected ? '0M' : 'N/A')}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Peak: {cacheStatus?.redis?.info?.memory_peak || 'N/A'}
                </div>
              </div>

              {/* Last Cleared */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Cache Clear</span>
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xs font-bold text-slate-800 truncate" title={cacheStatus?.last_cleared_at}>
                  {cacheStatus?.last_cleared_at || 'Never'}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Auto-invalidated on admin edits
                </div>
              </div>
            </div>

            {/* Cloudways / Local Connection Info Box */}
            {!cacheStatus?.redis?.connected && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <div className="font-bold text-amber-950">Local Environment Notice & Cloudways Activation Guide</div>
                  <p>
                    The server is currently utilizing the <strong>{cacheStatus?.cache_driver}</strong> cache driver. All caching and instant invalidation features are fully operational.
                  </p>
                  <p>
                    On Cloudways, enable Redis under <strong>Server Management &rarr; Settings & Packages &rarr; Packages &rarr; Redis Cache (Install)</strong>, then add <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono font-bold">CACHE_STORE=redis</code> to your production <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono font-bold">.env</code>.
                  </p>
                  {cacheStatus?.redis?.error && (
                    <div className="text-[11px] font-mono text-amber-800/80 mt-1 bg-amber-100/50 p-1.5 rounded">
                      Local status: {cacheStatus?.redis?.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Center */}
          <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" /> Cache Invalidation Controls
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Clearing the cache ensures customers immediately see the newest prices, stock, and product updates instead of outdated data stored in memory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action 1: Clear Catalog */}
              <div className="border border-cream-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400 transition-colors bg-cream-50/30">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 mb-1">
                    <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                      <Cake className="w-4 h-4" />
                    </span>
                    Clear Catalog Cache
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Flushes cached product listings, category trees, subcategories, and search index results. Recommended whenever you finish bulk updating cakes or changing prices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('catalog')}
                  disabled={clearingCacheType !== null}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-chocolate hover:bg-amber-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${clearingCacheType === 'catalog' ? 'animate-spin' : ''}`} />
                  <span>{clearingCacheType === 'catalog' ? 'Clearing Catalog...' : 'Clear Catalog Cache'}</span>
                </button>
              </div>

              {/* Action 2: Flush All Cache */}
              <div className="border border-cream-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400 transition-colors bg-cream-50/30">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 mb-1">
                    <span className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </span>
                    Flush All Memory Cache
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Completely flushes all memory keys, session tags, banners, dream cake data, and query caches stored in the cache engine.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('all')}
                  disabled={clearingCacheType !== null}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${clearingCacheType === 'all' ? 'animate-spin' : ''}`} />
                  <span>{clearingCacheType === 'all' ? 'Flushing Memory...' : 'Flush All Memory Cache'}</span>
                </button>
              </div>

              {/* Action 3: Clear System Cache */}
              <div className="border border-cream-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400 transition-colors bg-cream-50/30">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 mb-1">
                    <span className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                      <Server className="w-4 h-4" />
                    </span>
                    Optimize & System Clear
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Executes backend route, configuration, and compiled template cache resets (<code className="font-mono text-[11px]">optimize:clear</code>). Helpful after git updates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('system')}
                  disabled={clearingCacheType !== null}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${clearingCacheType === 'system' ? 'animate-spin' : ''}`} />
                  <span>{clearingCacheType === 'system' ? 'Clearing System...' : 'Clear System Cache'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
