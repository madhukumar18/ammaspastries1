import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Trash2,
  Edit2,
  FolderTree,
  Check,
  X,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

const AdminCategoriesPage = () => {
  const { showToast } = useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatOrder, setNewCatOrder] = useState(0);
  const [submittingCat, setSubmittingCat] = useState(false);

  // New Subcategory form state
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);

  // Inline Quick Add Sub state (category-specific)
  const [quickAddCatId, setQuickAddCatId] = useState(null);
  const [quickSubName, setQuickSubName] = useState('');

  // Editing Category state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatOrder, setEditCatOrder] = useState(0);
  const [updatingCat, setUpdatingCat] = useState(false);

  // Editing Subcategory state
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCatId, setEditSubCatId] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [updatingSub, setUpdatingSub] = useState(false);

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
      console.warn('Error fetching categories:', e);
      showToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.subcategories?.some((sub) => sub.name.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Total subcategories count
  const totalSubcategories = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0);
  }, [categories]);

  // -------------------------------------------------------------
  // CATEGORY CRUD HANDLERS
  // -------------------------------------------------------------
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmittingCat(true);
    try {
      await api.post('/admin/categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        display_order: parseInt(newCatOrder, 10) || 0,
        is_active: true,
      });
      showToast('Category created successfully!', 'success');
      setNewCatName('');
      setNewCatDesc('');
      setNewCatOrder(0);
      fetchCats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create category.', 'error');
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || '');
    setEditCatDesc(cat.description || '');
    setEditCatOrder(cat.display_order || 0);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    setUpdatingCat(true);
    try {
      await api.put(`/admin/categories/${editingCategory.id}`, {
        name: editCatName.trim(),
        description: editCatDesc.trim(),
        display_order: parseInt(editCatOrder, 10) || 0,
      });
      showToast(`Category "${editCatName}" updated!`, 'success');
      setEditingCategory(null);
      fetchCats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update category.', 'error');
    } finally {
      setUpdatingCat(false);
    }
  };

  const handleDeleteCat = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? All associated subcategories will also be deleted.`)) {
      return;
    }
    try {
      await api.delete(`/admin/categories/${id}`);
      showToast(`Category "${name}" deleted.`, 'info');
      fetchCats();
    } catch (err) {
      showToast('Failed to delete category.', 'error');
    }
  };

  // -------------------------------------------------------------
  // SUBCATEGORY CRUD HANDLERS
  // -------------------------------------------------------------
  const handleCreateSub = async (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedCatId) return;
    setSubmittingSub(true);
    try {
      await api.post('/admin/subcategories', {
        category_id: selectedCatId,
        name: newSubName.trim(),
        description: newSubDesc.trim(),
      });
      showToast(`Subcategory "${newSubName}" added!`, 'success');
      setNewSubName('');
      setNewSubDesc('');
      fetchCats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add subcategory.', 'error');
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleQuickAddSub = async (catId) => {
    if (!quickSubName.trim()) return;
    try {
      await api.post('/admin/subcategories', {
        category_id: catId,
        name: quickSubName.trim(),
      });
      showToast(`Subcategory "${quickSubName}" added!`, 'success');
      setQuickSubName('');
      setQuickAddCatId(null);
      fetchCats();
    } catch (err) {
      showToast('Failed to add subcategory.', 'error');
    }
  };

  const handleOpenEditSub = (sub) => {
    setEditingSubcategory(sub);
    setEditSubName(sub.name || '');
    setEditSubCatId(sub.category_id || '');
    setEditSubDesc(sub.description || '');
  };

  const handleUpdateSubcategory = async (e) => {
    e.preventDefault();
    if (!editingSubcategory || !editSubName.trim()) return;
    setUpdatingSub(true);
    try {
      await api.put(`/admin/subcategories/${editingSubcategory.id}`, {
        name: editSubName.trim(),
        category_id: editSubCatId,
        description: editSubDesc.trim(),
      });
      showToast(`Subcategory "${editSubName}" updated!`, 'success');
      setEditingSubcategory(null);
      fetchCats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update subcategory.', 'error');
    } finally {
      setUpdatingSub(false);
    }
  };

  const handleDeleteSub = async (subId, subName) => {
    if (!window.confirm(`Delete subcategory "${subName}"?`)) return;
    try {
      await api.delete(`/admin/subcategories/${subId}`);
      showToast(`Subcategory "${subName}" deleted.`, 'info');
      fetchCats();
    } catch (err) {
      showToast('Failed to delete subcategory.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Categories & Subcategories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your pastry catalog classifications, Sweets subcategories, and menu groupings
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold text-chocolate">
              {categories.length} Categories
            </span>
          </div>
          <div className="bg-amber-100/60 border border-amber-300/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-800" />
            <span className="text-xs font-bold text-amber-900">
              {totalSubcategories} Subcategories
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter categories (e.g. Sweets, Cakes, Snacks)..."
          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Categories & Subcategories List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-2" />
              <div className="text-xs text-slate-500 font-medium">Loading categories and subcategories...</div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
              <div className="text-3xl">🔍</div>
              <div className="font-bold text-chocolate text-sm">No matching categories found</div>
              <p className="text-xs text-slate-500">Try searching for a different name or clear the search filter.</p>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-amber-200 transition-colors"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-base text-chocolate truncate">
                          {cat.name}
                        </h3>
                        {cat.slug === 'sweets' && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                            🍬 Sweets
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>slug: <strong className="text-slate-600">{cat.slug}</strong></span>
                        <span>•</span>
                        <span>Order: {cat.display_order ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete Category */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCat(cat.id, cat.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs text-slate-500 leading-relaxed -mt-1">
                    {cat.description}
                  </p>
                )}

                {/* Subcategories Area */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Subcategories</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.2 rounded-full font-bold">
                        {cat.subcategories?.length || 0}
                      </span>
                    </div>

                    {/* Quick Add Subcategory Trigger */}
                    {quickAddCatId === cat.id ? (
                      <button
                        onClick={() => setQuickAddCatId(null)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuickAddCatId(cat.id);
                          setSelectedCatId(cat.id);
                        }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Subcategory</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Quick Add Input */}
                  {quickAddCatId === cat.id && (
                    <div className="mb-3 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={quickSubName}
                        onChange={(e) => setQuickSubName(e.target.value)}
                        placeholder={`New subcategory name for ${cat.name}...`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddSub(cat.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAddSub(cat.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  {/* Subcategory Pills with Edit & Delete */}
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories?.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1.5 bg-amber-50/80 text-amber-950 border border-amber-200/80 hover:border-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs transition-all group"
                      >
                        <span>{sub.name}</span>
                        
                        {/* Edit Sub button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditSub(sub)}
                          className="text-slate-400 hover:text-amber-700 transition-colors p-0.5"
                          title="Edit subcategory name"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Delete Sub button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSub(sub.id, sub.name)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                          title="Remove subcategory"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {(!cat.subcategories || cat.subcategories.length === 0) && (
                      <span className="text-xs text-slate-400 italic py-1">
                        No subcategories defined yet. Click "+ Add Subcategory" to add items.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Forms (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Add Category Form */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif font-bold text-base text-chocolate">Create New Category</h3>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description for category..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingCat}
                className="w-full py-2.5 bg-chocolate hover:bg-chocolate-light text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-75"
              >
                {submittingCat ? 'Adding...' : '+ Add Category'}
              </button>
            </form>
          </div>

          {/* Add Subcategory Form */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif font-bold text-base text-chocolate">Add Subcategory</h3>
            </div>
            <form onSubmit={handleCreateSub} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subcategories?.length || 0} subcategories)
                    </option>
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
                  placeholder="e.g. Kaju Katli & Peda"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newSubDesc}
                  onChange={(e) => setNewSubDesc(e.target.value)}
                  placeholder="Subcategory highlights..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSub}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-75"
              >
                {submittingSub ? 'Adding...' : '+ Add Subcategory'}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------
          MODAL 1: EDIT CATEGORY
          ------------------------------------------------------------- */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-chocolate">
                  Edit Category: {editingCategory.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={editCatOrder}
                  onChange={(e) => setEditCatOrder(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCat}
                  className="px-5 py-2 bg-chocolate hover:bg-chocolate-light text-white font-bold rounded-xl shadow-xs disabled:opacity-75"
                >
                  {updatingCat ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 2: EDIT SUBCATEGORY
          ------------------------------------------------------------- */}
      {editingSubcategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chocolate/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-chocolate">
                  Edit Subcategory: {editingSubcategory.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingSubcategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubcategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={editSubCatId}
                  onChange={(e) => setEditSubCatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={editSubDesc}
                  onChange={(e) => setEditSubDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubcategory(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSub}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-75"
                >
                  {updatingSub ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategoriesPage;
