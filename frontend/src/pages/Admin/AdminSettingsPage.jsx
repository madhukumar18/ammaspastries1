import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Settings, FileText, Save, CheckCircle2, Shield, Bell, Truck, Phone } from 'lucide-react';

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
        <div className="flex items-center gap-1 bg-cream-100 p-1.5 rounded-2xl border border-cream-200 self-start">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'general' ? 'bg-white text-bakery-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> General Settings
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'policies' ? 'bg-white text-bakery-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Legal Policies
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
      ) : (
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
      )}
    </div>
  );
};

export default AdminSettingsPage;
