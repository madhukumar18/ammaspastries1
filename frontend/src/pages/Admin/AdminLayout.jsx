import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import brandLogo from '../../assets/logo.png';
import {
  LayoutDashboard,
  Cake,
  Camera,
  FolderTree,
  Store,
  ShoppingBag,
  Image,
  Gift,
  Star,
  FileSpreadsheet,
  Handshake,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  Images,
  MonitorSmartphone,
  ShieldAlert
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, adminToken, logoutAdmin } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Protected route check
  if (!adminToken) {
    navigate('/admin/login');
    return null;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Cake },
    { label: 'Bulk Products (CSV/Excel)', path: '/admin/bulk-products', icon: FileSpreadsheet },
    { label: 'Photo Cake Studio', path: '/admin/photo-cakes', icon: Camera },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Category Images', path: '/admin/category-images', icon: Images },
    { label: 'Outlets', path: '/admin/outlets', icon: Store },
    { label: 'Orders & Tracking', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Rista POS Integration', path: '/admin/rista-pos', icon: MonitorSmartphone },
    { label: 'Security & Threat Logs', path: '/admin/security-logs', icon: ShieldAlert },
    { label: 'Banners', path: '/admin/banners', icon: Image },
    { label: 'Gifting & Dream Cakes', path: '/admin/gifting', icon: Gift },
    { label: 'Customer Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Corporate B2B Orders', path: '/admin/bulk-imports', icon: Handshake },
    { label: 'Franchise Enquiries', path: '/admin/franchise-enquiries', icon: Handshake },
    { label: 'Contact Enquiries', path: '/admin/contact-enquiries', icon: MessageSquare },
    { label: 'Content & Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-chocolate text-cream-light border-b border-amber-900/50 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 text-amber-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
            <img
              src={brandLogo}
              alt="Ammas Pastries"
              className="h-8 sm:h-9 w-auto object-contain bg-white px-2 py-0.5 rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-serif font-bold text-xs sm:text-sm tracking-wider uppercase text-amber-200 border-l border-amber-800/80 pl-2.5 hidden sm:inline">
              Admin Panel
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-amber-200 hover:text-white bg-amber-950/70 border border-amber-800/60 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-amber-800/60">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-white leading-tight">{admin?.name || 'Administrator'}</div>
              <div className="text-[10px] text-amber-300 capitalize">{admin?.role || 'Super Admin'}</div>
            </div>
            <button
              onClick={() => {
                logoutAdmin();
                navigate('/admin/login');
              }}
              className="p-1.5 text-amber-300 hover:text-rose-400 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex">
        
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-200/80 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-2">
            Management Navigation
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-chocolate text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-amber-50 hover:text-chocolate'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <div className="relative w-64 bg-white h-full shadow-2xl p-4 overflow-y-auto z-10 space-y-2 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <img src={brandLogo} alt="Ammas Pastries" className="h-7 w-auto object-contain" />
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  ✕
                </button>
              </div>

              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                      isActive
                        ? 'bg-chocolate text-white font-bold'
                        : 'text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
