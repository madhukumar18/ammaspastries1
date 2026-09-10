import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Edit2, FolderTree } from 'lucide-react';

const AdminCategoriesPage = () => {
  const { showToast } = useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [submittingCat, setSubmittingCat] = useState(false);

  // Subcategory form
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newSubName, setNewSubName] = useState('');

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data?.data) {
        setCategories(res.data.data);
        if (res.data.data.length > 0 && !selectedCatId) {
          setSelectedCatId(res.data.data[0].id);
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmittingCat(true);
    try {
      await api.post('/admin/categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      showToast('Category created!', 'success');
      setNewCatName('');
      setNewCatDesc('');
      fetchCats();
    } catch (err) {
      showToast('Failed to create category.', 'error');
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleCreateSub = async (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedCatId) return;
    try {
      await api.post('/admin/subcategories', {
        category_id: selectedCatId,
        name: newSubName.trim(),
      });
      showToast('Subcategory added!', 'success');
      setNewSubName('');
      fetchCats();
    } catch (err) {
      showToast('Failed to add subcategory.', 'error');
    }
  };

  const handleDeleteCat = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? All associated subcategories will also be deleted.`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      showToast('Category deleted.', 'info');
      fetchCats();
    } catch (err) {
      showToast('Failed to delete category.', 'error');
    }
  };

  const handleDeleteSub = async (subId) => {
    if (!window.confirm('Delete this subcategory?')) return;
    try {
      await api.delete(`/admin/subcategories/${subId}`);
      showToast('Subcategory deleted.', 'info');
      fetchCats();
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="font-serif text-2xl font-bold text-chocolate">Categories & Subcategories</h1>
        <p className="text-xs text-slate-500">Manage your product classifications and menu groupings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Categories & Subcategories List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <FolderTree className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-chocolate">{cat.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">slug: {cat.slug}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCat(cat.id, cat.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subcategory Pills */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Subcategories ({cat.subcategories?.length || 0}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.subcategories?.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      <span>{sub.name}</span>
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="text-amber-500 hover:text-rose-600 ml-1"
                        title="Remove subcategory"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {(!cat.subcategories || cat.subcategories.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No subcategories defined</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Forms (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Add Category Form */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-chocolate">Create New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Artisanal Breads"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingCat}
                className="w-full py-2.5 bg-chocolate hover:bg-chocolate-light text-white font-bold rounded-xl shadow-xs"
              >
                {submittingCat ? 'Adding...' : '+ Add Category'}
              </button>
            </form>
          </div>

          {/* Add Subcategory Form */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-chocolate">Add Subcategory</h3>
            <form onSubmit={handleCreateSub} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Sourdough"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
              >
                + Add Subcategory
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminCategoriesPage;
