import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Shield,
  KeyRound,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  RefreshCw,
  Crown,
  LayoutDashboard,
  Cake,
  FileSpreadsheet,
  Camera,
  FolderTree,
  Images,
  Store,
  ShoppingBag,
  MonitorSmartphone,
  Gift,
  Star,
  Handshake,
  Building2,
  MessageSquare,
  Settings,
  Check,
  X,
  AlertTriangle,
  Copy
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  Cake,
  FileSpreadsheet,
  Camera,
  Crown,
  FolderTree,
  Images,
  Store,
  ShoppingBag,
  MonitorSmartphone,
  ShieldAlert,
  Gift,
  Star,
  Handshake,
  Building2,
  MessageSquare,
  Settings,
};

const PRESET_TEMPLATES = [
  {
    name: 'Store & Orders Manager',
    desc: 'Full access to daily store operations, order fulfillment & POS sync.',
    modules: ['dashboard', 'orders', 'products', 'outlets', 'rista_pos'],
  },
  {
    name: 'Bakery Catalog Manager',
    desc: 'Manage all cakes, custom studios, categories, and banners.',
    modules: ['products', 'bulk_products', 'photo_cakes', 'theme_cakes', 'categories', 'banners'],
  },
  {
    name: 'Marketing & Reviews Lead',
    desc: 'Promotions, hero banners, gifting spotlights, and customer reviews.',
    modules: ['banners', 'gifting', 'reviews', 'contact_enquiries'],
  },
  {
    name: 'Corporate & Franchise Lead',
    desc: 'B2B spreadsheet bulk orders, franchise leads, and partnership inquiries.',
    modules: ['bulk_orders', 'franchise_enquiries', 'contact_enquiries'],
  },
];

const AdminSubAdminsPage = () => {
  const { admin: currentAdmin, isSuperAdmin, showToast } = useApp();

  const [admins, setAdmins] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, super_admins: 0, sub_admins: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    permissions: [],
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Sub-Admins and Modules List
  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sub-admins');
      if (res.data?.data) {
        setAdmins(res.data.data.admins || []);
        setStats(res.data.data.stats || { total: 0, active: 0, inactive: 0, super_admins: 0, sub_admins: 0 });
        if (res.data.data.available_modules) {
          setAvailableModules(res.data.data.available_modules);
        }
      }
    } catch (err) {
      console.error('Failed to load sub-admins:', err);
      showToast(err.response?.data?.message || 'Failed to fetch sub-admins list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  // Filtered sub-admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && a.is_active) ||
        (statusFilter === 'inactive' && !a.is_active);

      const matchesModule =
        moduleFilter === 'all' ||
        a.is_super_admin ||
        (Array.isArray(a.permissions) && a.permissions.includes(moduleFilter));

      return matchesSearch && matchesStatus && matchesModule;
    });
  }, [admins, searchQuery, statusFilter, moduleFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'admin',
      permissions: ['orders', 'products', 'dashboard'],
      is_active: true,
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (adm) => {
    setEditingAdmin(adm);
    setFormData({
      name: adm.name || '',
      email: adm.email || '',
      phone: adm.phone || '',
      password: '',
      role: adm.role || 'admin',
      permissions: adm.is_super_admin ? availableModules.map((m) => m.key) : (adm.permissions || []),
      is_active: adm.is_active ?? true,
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
    showToast('Generated secure random password! 🔑', 'info');
  };

  // Toggle single module permission checkbox
  const handleToggleModule = (moduleKey) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      if (current.includes(moduleKey)) {
        return { ...prev, permissions: current.filter((k) => k !== moduleKey) };
      } else {
        return { ...prev, permissions: [...current, moduleKey] };
      }
    });
  };

  // Apply preset template
  const handleApplyPreset = (modules) => {
    setFormData((prev) => ({
      ...prev,
      permissions: [...modules],
    }));
    showToast('Preset permissions applied!', 'info');
  };

  // Select all modules
  const handleSelectAllModules = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: availableModules.map((m) => m.key),
    }));
  };

  // Deselect all modules
  const handleDeselectAllModules = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter the sub-admin name', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!editingAdmin && !formData.password) {
      showToast('Please enter a password for the new sub-admin', 'error');
      return;
    }
    if (!editingAdmin && formData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (formData.permissions.length === 0 && !editingAdmin?.is_super_admin) {
      showToast('Please grant at least one module permission', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingAdmin) {
        // Update
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          permissions: formData.permissions,
          is_active: formData.is_active,
        };
        if (formData.password) {
          payload.password = formData.password;
        }

        const res = await api.put(`/admin/sub-admins/${editingAdmin.id}`, payload);
        showToast(res.data?.message || 'Sub-Admin updated successfully! ✨', 'success');
      } else {
        // Create
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          password: formData.password,
          role: formData.role || 'admin',
          permissions: formData.permissions,
          is_active: formData.is_active,
        };

        const res = await api.post('/admin/sub-admins', payload);
        showToast(res.data?.message || 'Sub-Admin created successfully! 🎉', 'success');
      }

      setModalOpen(false);
      fetchSubAdmins();
    } catch (err) {
      console.error('Save sub-admin error:', err);
      const msg = err.response?.data?.message || 'Failed to save sub-admin. Please check inputs.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (adm) => {
    try {
      const res = await api.post(`/admin/sub-admins/${adm.id}/toggle-status`);
      showToast(res.data?.message || 'Status updated', 'success');
      fetchSubAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Open delete confirmation
  const handleConfirmDelete = (adm) => {
    setAdminToDelete(adm);
    setDeleteModalOpen(true);
  };

  // Execute delete
  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/sub-admins/${adminToDelete.id}`);
      showToast(res.data?.message || 'Sub-Admin account deleted', 'success');
      setDeleteModalOpen(false);
      setAdminToDelete(null);
      fetchSubAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete account', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-amber-200/80 shadow-lg p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-chocolate flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8 text-chocolate" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
          Super Administrator Privileges Required
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Sub-Admin account creation and role permissions management are strictly restricted to the Super Administrator (<span className="font-semibold text-chocolate">mkumar200418@gmail.com</span>).
        </p>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            Current account: <strong className="text-slate-900">{currentAdmin?.email || 'Sub-Admin'}</strong> ({currentAdmin?.role || 'Admin'})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-chocolate via-amber-950 to-chocolate text-cream-light p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              Sub-Admin & Permissions Management
            </h1>
            <p className="text-amber-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Create sub-administrator accounts, provide dedicated login credentials, and selectively designate which modules (Orders, Products, Franchise Enquiries, etc.) each sub-admin is authorized to view.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-chocolate-dark font-bold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 shrink-0 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Create New Sub-Admin</span>
          </button>
        </div>
      </div>

      {/* Metrics Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Admins</p>
            <h3 className="text-2xl font-bold font-serif text-slate-800 mt-1">{stats.total}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-chocolate flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Accounts</p>
            <h3 className="text-2xl font-bold font-serif text-emerald-600 mt-1">{stats.active}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sub-Admins</p>
            <h3 className="text-2xl font-bold font-serif text-indigo-600 mt-1">{stats.sub_admins}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Administrator</p>
            <h3 className="text-2xl font-bold font-serif text-amber-600 mt-1">{stats.super_admins}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated</option>
          </select>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 max-w-[200px]"
          >
            <option value="all">All Modules</option>
            {availableModules.map((mod) => (
              <option key={mod.key} value={mod.key}>
                {mod.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchSubAdmins}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Admins Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-chocolate border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading Sub-Administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-serif font-bold text-slate-800 text-lg">No Sub-Administrators Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || moduleFilter !== 'all'
                ? 'No admin accounts matched your search filters. Try clearing them.'
                : 'You have not added any sub-administrators yet. Click "+ Create New Sub-Admin" to grant team members access to specific modules.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-chocolate text-white text-xs font-bold rounded-xl shadow-xs hover:bg-chocolate-light transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create First Sub-Admin</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Admin Identity</th>
                  <th className="py-3.5 px-4">Role & Status</th>
                  <th className="py-3.5 px-4">Accessible Modules</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredAdmins.map((adm) => {
                  const isSuper = adm.is_super_admin;
                  const permissionsCount = isSuper ? availableModules.length : (adm.permissions?.length || 0);

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Identity */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full ring-2 ring-amber-300/80 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                            {adm.profile_photo_url ? (
                              <img src={adm.profile_photo_url} alt={adm.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-chocolate font-serif text-sm">
                                {adm.name ? adm.name.substring(0, 2).toUpperCase() : 'AD'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{adm.name}</span>
                              {isSuper && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-chocolate border border-amber-300">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {adm.email}
                              </span>
                              {adm.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {adm.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="inline-block">
                            <span className="capitalize px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {adm.role?.replace('_', ' ') || 'Admin'}
                            </span>
                          </div>
                          <div>
                            {adm.is_active ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-500 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                Deactivated
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Accessible Modules */}
                      <td className="py-4 px-4 max-w-xs">
                        {isSuper ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Full Unrestricted Access ({availableModules.length} Modules)</span>
                          </div>
                        ) : permissionsCount === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No module access assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {adm.permissions?.slice(0, 3).map((modKey) => {
                              const modDef = availableModules.find((m) => m.key === modKey);
                              return (
                                <span
                                  key={modKey}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[130px]"
                                  title={modDef?.name || modKey}
                                >
                                  {modDef?.name || modKey}
                                </span>
                              );
                            })}
                            {permissionsCount > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-chocolate border border-amber-200">
                                +{permissionsCount - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {adm.created_at ? new Date(adm.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'System'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(adm)}
                            className="p-1.5 text-slate-500 hover:text-chocolate hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Sub-Admin & Permissions"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {!isSuper && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(adm)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  adm.is_active
                                    ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                                    : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                                title={adm.is_active ? 'Deactivate Account' : 'Activate Account'}
                              >
                                {adm.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleConfirmDelete(adm)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Sub-Admin Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Sub-Admin */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-chocolate to-amber-950 text-white p-5 sm:p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{editingAdmin ? 'Modify Sub-Admin Account' : 'New Sub-Admin Registration'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  {editingAdmin ? `Edit "${editingAdmin.name}"` : 'Create Sub-Admin & Configure Access'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Account Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Bakery Manager"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address (Login ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@ammaspastries.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={editingAdmin?.is_super_admin}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Contact Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {editingAdmin ? 'Reset Password (Leave blank to keep current)' : 'Account Password *'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingAdmin ? 'Enter new password or leave empty' : 'Min. 6 characters'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingAdmin}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role & Account Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Designated Administrative Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editingAdmin?.is_super_admin}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 font-medium disabled:opacity-60"
                  >
                    <option value="admin">Administrator</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="operations">Operations Lead</option>
                    <option value="editor">Catalog Editor</option>
                    {editingAdmin?.is_super_admin && <option value="super_admin">Super Administrator</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Status
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="account_status"
                        checked={formData.is_active === true}
                        onChange={() => setFormData({ ...formData, is_active: true })}
                        className="text-chocolate focus:ring-amber-500"
                      />
                      <span className="text-emerald-600 font-bold">Active (Can Sign In)</span>
                    </label>

                    {!editingAdmin?.is_super_admin && (
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="account_status"
                          checked={formData.is_active === false}
                          onChange={() => setFormData({ ...formData, is_active: false })}
                          className="text-chocolate focus:ring-amber-500"
                        />
                        <span className="text-rose-600 font-bold">Suspended / Inactive</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Module Permissions Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-chocolate" />
                      <span>Granular Module Access Permissions</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Select which admin dashboard modules this user is authorized to view and manage.
                    </p>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2.5 py-1 text-[11px] font-bold text-chocolate bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Select All ({availableModules.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllModules}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Preset Role Shortcut Buttons */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    ⚡ Quick Preset Templates:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {PRESET_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => handleApplyPreset(tpl.modules)}
                        className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 transition-all cursor-pointer group"
                      >
                        <div className="font-bold text-xs text-slate-800 group-hover:text-chocolate">
                          {tpl.name}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                          {tpl.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Module Checkboxes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {availableModules.map((mod) => {
                    const isChecked = formData.permissions.includes(mod.key);
                    const IconComponent = ICON_MAP[mod.icon] || Shield;

                    return (
                      <label
                        key={mod.key}
                        onClick={() => handleToggleModule(mod.key)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? 'border-chocolate bg-amber-50/60 shadow-xs ring-1 ring-chocolate/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border mt-0.5 shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-chocolate border-chocolate text-white'
                              : 'border-slate-300 bg-slate-50 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <IconComponent className={`w-3.5 h-3.5 ${isChecked ? 'text-chocolate' : 'text-slate-400'}`} />
                            <span className="font-bold text-xs text-slate-900 truncate">{mod.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                            {mod.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-chocolate hover:bg-chocolate-light text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Account...</span>
                    </>
                  ) : (
                    <span>{editingAdmin ? 'Save Sub-Admin Changes' : 'Create Sub-Admin Account'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Sub-Admin */}
      {deleteModalOpen && adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Delete Sub-Admin Account?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800 font-semibold">{adminToDelete.name}</strong> (
                {adminToDelete.email})? This user will immediately lose access to the administrative dashboard.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubAdminsPage;
