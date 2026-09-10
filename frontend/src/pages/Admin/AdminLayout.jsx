import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Cake,
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
  ChevronRight
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
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Outlets', path: '/admin/outlets', icon: Store },
    { label: 'Orders & Tracking', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Banners', path: '/admin/banners', icon: Image },
    { label: 'Gifting & Dream Cakes', path: '/admin/gifting', icon: Gift },
    { label: 'Customer Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Bulk Imports & Orders', path: '/admin/bulk-imports', icon: FileSpreadsheet },
    { label: 'Franchise Enquiries', path: '/admin/franchise-enquiries', icon: Handshake },
    { label: 'Contact Enquiries', path: '/admin/contact-enquiries', icon: MessageSquare },
    { label: 'Content & Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-chocolate text-cream-light border-b border-amber-900/50 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 text-amber-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-chocolate flex items-center justify-center font-serif font-bold text-sm">
              A
            </div>
            <span className="font-serif font-bold text-base tracking-wide text-white">
              AMMAS ADMIN PANEL
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
                <span className="font-serif font-bold text-chocolate text-sm">Ammas Admin Menu</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 p-1">
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
