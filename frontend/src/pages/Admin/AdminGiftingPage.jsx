import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Gift, Sparkles, Plus, Trash2, CheckCircle2, Save, Search } from 'lucide-react';

const AdminGiftingPage = () => {
  const { showToast } = useApp();
  const [giftingItems, setGiftingItems] = useState([]);
  const [dreamCake, setDreamCake] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New gifting product selector
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addingGifting, setAddingGifting] = useState(false);

  // Dream cake form
  const [dreamForm, setDreamForm] = useState({
    product_id: '',
    title: '',
    description: '',
    badge: '5-in-1 Luxury Torte',
    is_active: true,
  });
  const [savingDream, setSavingDream] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [giftingRes, dreamRes, prodsRes] = await Promise.all([
        api.get('/admin/gifting'),
        api.get('/admin/dream-cake'),
        api.get('/admin/products?limit=100'),
      ]);

      if (giftingRes.data?.data) {
        setGiftingItems(giftingRes.data.data);
      }
      if (dreamRes.data?.data) {
        const dc = dreamRes.data.data;
        setDreamCake(dc);
        setDreamForm({
          product_id: dc.product_id || '',
          title: dc.title || '',
          description: dc.description || '',
          badge: dc.badge || '5-in-1 Luxury Torte',
          is_active: !!dc.is_active,
        });
      }
      if (prodsRes.data?.data) {
        setProducts(prodsRes.data.data);
        if (prodsRes.data.data.length > 0 && !selectedProductId) {
          setSelectedProductId(prodsRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load gifting configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddGifting = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setAddingGifting(true);
    try {
      await api.post('/admin/gifting', {
        product_id: selectedProductId,
        display_order: giftingItems.length + 1,
      });
      showToast('Product added to Popular in Gifting!', 'success');
      const res = await api.get('/admin/gifting');
      if (res.data?.data) setGiftingItems(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add gifting item (may already exist)';
      showToast(msg, 'error');
    } finally {
      setAddingGifting(false);
    }
  };

  const handleRemoveGifting = async (id) => {
    try {
      await api.delete(`/admin/gifting/${id}`);
      showToast('Removed from gifting.', 'success');
      setGiftingItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      showToast('Failed to remove item.', 'error');
    }
  };

  const handleSaveDreamCake = async (e) => {
    e.preventDefault();
    if (!dreamForm.product_id) {
      showToast('Please select a product for Dream Cake', 'error');
      return;
    }
    setSavingDream(true);
    try {
      const res = await api.post('/admin/dream-cake', dreamForm);
      showToast('Dream Cake updated successfully!', 'success');
      if (res.data?.data) setDreamCake(res.data.data);
    } catch (err) {
      showToast('Failed to save Dream Cake', 'error');
    } finally {
      setSavingDream(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Gifting & Dream Cake Showcases</h1>
        <p className="text-sm text-gray-500">
          Configure highlighted gift sets and the signature Dream Cake section featured on the homepage.
        </p>
      </div>

      {/* SECTION 1: POPULAR IN GIFTING */}
      <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-berry-50 text-berry-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-900">Popular in Gifting Items</h2>
              <p className="text-xs text-gray-500">Products showcased in the homepage gifting carousel</p>
            </div>
          </div>

          <form onSubmit={handleAddGifting} className="flex items-center gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500 max-w-[220px]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addingGifting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading gifting items...</div>
        ) : giftingItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No items in Gifting yet. Add your luxury hampers or chocolate boxes above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {giftingItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-cream-50/60 rounded-2xl p-3 border border-cream-200 flex items-center gap-3"
              >
                <img
                  src={
                    item.product?.primary_image?.image_url ||
                    'https://images.unsplash.com/photo-1549575810-b9b775466479?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={item.product?.name}
                  className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{item.product?.name}</h4>
                  <p className="text-[11px] text-bakery-700 font-semibold mt-0.5">
                    ₹{item.product?.variants?.[0]?.price || '---'}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveGifting(item.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove from Gifting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: DREAM CAKE */}
      <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-cream-100 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-gray-900">The Signature "Dream Cake" Showcase</h2>
            <p className="text-xs text-gray-500">Configure the hero sensory callout section for your viral cake</p>
          </div>
        </div>

        <form onSubmit={handleSaveDreamCake} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Dream Cake Product</label>
              <select
                value={dreamForm.product_id}
                onChange={(e) => setDreamForm({ ...dreamForm, product_id: e.target.value })}
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              >
                <option value="">Select a cake...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={dreamForm.badge}
                onChange={(e) => setDreamForm({ ...dreamForm, badge: e.target.value })}
                placeholder="5-in-1 Luxury Torte"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Showcase Title</label>
              <input
                type="text"
                required
                value={dreamForm.title}
                onChange={(e) => setDreamForm({ ...dreamForm, title: e.target.value })}
                placeholder="The Original Ammas Pastries Dream Cake"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sensory Description</label>
              <textarea
                rows={3}
                required
                value={dreamForm.description}
                onChange={(e) => setDreamForm({ ...dreamForm, description: e.target.value })}
                placeholder="5 exquisite layers: Moist Belgian chocolate sponge, silky mousse, crunchy chocolate disk..."
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="dream_is_active"
                checked={dreamForm.is_active}
                onChange={(e) => setDreamForm({ ...dreamForm, is_active: e.target.checked })}
                className="rounded text-bakery-600 focus:ring-bakery-500"
              />
              <label htmlFor="dream_is_active" className="text-xs font-semibold text-gray-700">
                Display Dream Cake spotlight section on homepage
              </label>
            </div>

            <button
              type="submit"
              disabled={savingDream}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-bakery-600 hover:bg-bakery-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {savingDream ? 'Saving...' : 'Save Dream Cake Settings'}
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="bg-cream-50 rounded-2xl p-5 border border-cream-200 flex flex-col justify-center">
            <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-3">Live Preview Preview</h4>
            <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm space-y-3">
              <span className="inline-block px-3 py-1 bg-gold-100 text-gold-800 rounded-full text-xs font-bold">
                {dreamForm.badge || 'Signature Delight'}
              </span>
              <h3 className="font-serif font-bold text-xl text-gray-900 leading-tight">
                {dreamForm.title || 'Dream Cake Title'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {dreamForm.description || 'Layers of sensory indulgence...'}
              </p>
              <div className="pt-2">
                <span className="text-xs text-bakery-600 font-semibold underline">
                  Experience The Layers &rarr;
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminGiftingPage;
