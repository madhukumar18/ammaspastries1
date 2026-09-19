import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
  ShieldAlert,
  Users,
  ShieldCheck,
  Crown,
  Lock,
  ChevronDown,
  Plus,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, adminToken, logoutAdmin, isSuperAdmin, hasPermission, showToast } = useApp();
  const [clearingCache, setClearingCache] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const desktopProductsRef = React.useRef(null);
  const mobileProductsRef = React.useRef(null);

  React.useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/admin/categories');
        if (res.data?.data && Array.isArray(res.data.data)) {
          setCategoriesList(res.data.data);
        }
      } catch (err) {
        // use fallback categories
      }
    };
    if (adminToken) fetchCats();
  }, [adminToken]);

  const fallbackCategories = [
    { id: 8, name: 'Theme Cakes', slug: 'theme-cakes' },
    { id: 10, name: 'Photo Cakes', slug: 'photo-cake' },
    { id: 1, name: 'Cakes & Pastries', slug: 'cakes-pastries' },
    { id: 3, name: 'Desserts', slug: 'dessert' },
    { id: 2, name: 'Snacks & Savouries', slug: 'snacks' },
    { id: 5, name: 'Chocolates', slug: 'chocolates' },
    { id: 9, name: 'Sweets', slug: 'sweets' },
  ];

  const activeCategories = categoriesList.length > 0 ? categoriesList : fallbackCategories;

  // Sub-links specifically organized for Products section (stays on /admin/products and shows products of that section)
  const productSubLinks = [
    { label: 'All Products', path: '/admin/products', icon: Cake, description: 'View all products' },
    ...activeCategories.map((cat) => ({
      label: cat.name,
      path: `/admin/products?category_id=${cat.id}&section=${cat.slug}`,
      icon: cat.slug?.includes('theme') ? Crown : (cat.slug?.includes('photo') ? Camera : Cake),
      description: `Only ${cat.name} products`,
    })),
    { label: 'Out of Stock', path: '/admin/products?filter=out_of_stock', icon: AlertCircle, description: 'Unavailable items' },
    { label: 'Add New Product', path: '/admin/products?action=new', icon: Plus, description: 'Open Add Cake modal' },
  ];

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const inDesktop = desktopProductsRef.current && desktopProductsRef.current.contains(event.target);
      const inMobile = mobileProductsRef.current && mobileProductsRef.current.contains(event.target);
      if (!inDesktop && !inMobile) {
        setProductsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleQuickClearCache = async () => {
    if (clearingCache) return;
    setClearingCache(true);
    try {
      const res = await api.post('/admin/cache/clear', { scope: 'catalog' });
      showToast(res.data?.message || 'Cache refreshed! Customers will see latest data.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to clear cache', 'error');
    } finally {
      setClearingCache(false);
    }
  };

  // Protected route check
  if (!adminToken) {
    navigate('/admin/login');
    return null;
  }

  const allNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { label: 'Products', path: '/admin/products', icon: Cake, module: 'products' },
    { label: 'Bulk Products (CSV/Excel)', path: '/admin/bulk-products', icon: FileSpreadsheet, module: 'bulk_products' },
    { label: 'Photo Cake Studio', path: '/admin/photo-cakes', icon: Camera, module: 'photo_cakes' },
    { label: 'Theme Cakes Studio', path: '/admin/theme-cakes', icon: Crown, module: 'theme_cakes' },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree, module: 'categories' },
    { label: 'Category Images', path: '/admin/category-images', icon: Images, module: 'categories' },
    { label: 'Outlets', path: '/admin/outlets', icon: Store, module: 'outlets' },
    { label: 'Orders & Tracking', path: '/admin/orders', icon: ShoppingBag, module: 'orders' },
    { label: 'Rista POS Integration', path: '/admin/rista-pos', icon: MonitorSmartphone, module: 'rista_pos' },
    { label: 'Security & Threat Logs', path: '/admin/security-logs', icon: ShieldAlert, module: 'security_logs', superOnly: true },
    { label: 'Banners', path: '/admin/banners', icon: Image, module: 'banners' },
    { label: 'Gifting & Dream Cakes', path: '/admin/gifting', icon: Gift, module: 'gifting' },
    { label: 'Customer Reviews', path: '/admin/reviews', icon: Star, module: 'reviews' },
    { label: 'Corporate B2B Orders', path: '/admin/bulk-imports', icon: Handshake, module: 'bulk_orders' },
    { label: 'Franchise Enquiries', path: '/admin/franchise-enquiries', icon: Handshake, module: 'franchise_enquiries' },
    { label: 'Contact Enquiries', path: '/admin/contact-enquiries', icon: MessageSquare, module: 'contact_enquiries' },
    { label: 'Sub-Admins & Permissions', path: '/admin/sub-admins', icon: Users, module: 'sub_admins', superOnly: true },
    { label: 'Content & Settings', path: '/admin/settings', icon: Settings, module: 'settings', superOnly: true },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.superOnly && !isSuperAdmin) return false;
    return hasPermission(item.module);
  });

  // Smart landing redirect: if sub-admin lands on /admin or an unauthorized route, navigate to their first allowed page
  React.useEffect(() => {
    if (!adminToken) return;
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      const target = navItems[0]?.path || '/admin/login';
      navigate(target, { replace: true });
    }
  }, [location.pathname, navItems, adminToken, navigate]);

  const renderProductsItem = (isMobile = false) => {
    const ref = isMobile ? mobileProductsRef : desktopProductsRef;
    const isProductsPath = location.pathname === '/admin/products';

    return (
      <div
        key="/admin/products-dropdown"
        ref={ref}
        className="relative"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setProductsDropdownOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setProductsDropdownOpen((prev) => !prev)}
          aria-expanded={productsDropdownOpen}
          aria-haspopup="true"
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isProductsPath || productsDropdownOpen
              ? 'bg-chocolate text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-amber-50 hover:text-chocolate'
          }`}
        >
          <div className="flex items-center gap-3">
            <Cake className={`w-4 h-4 ${isProductsPath || productsDropdownOpen ? 'text-amber-300' : 'text-slate-400'}`} />
            <span>Products</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              productsDropdownOpen ? 'rotate-180 text-amber-300' : 'text-slate-400'
            }`}
          />
        </button>

        {/* Dropdown with all Product sub-links */}
        {productsDropdownOpen && (
          <div className="mt-1.5 ml-2 pl-2 border-l-2 border-amber-400 bg-amber-50/60 rounded-r-xl p-1.5 space-y-1 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70 px-2 py-0.5 flex items-center justify-between">
              <span>Products Menu</span>
              <span className="text-[9px] bg-amber-200/90 text-amber-950 font-mono px-1.5 py-0.2 rounded font-bold">
                {productSubLinks.length}
              </span>
            </div>
            {productSubLinks.map((sub) => {
              const SubIcon = sub.icon;
              const subBase = sub.path.split('?')[0];
              const subQuery = sub.path.includes('?') ? sub.path.substring(sub.path.indexOf('?')) : '';
              const isSubActive = subQuery
                ? location.pathname === subBase && location.search === subQuery
                : location.pathname === subBase && !location.search;

              return (
                <Link
                  key={sub.label}
                  to={sub.path}
                  onClick={() => {
                    setProductsDropdownOpen(false);
                    if (isMobile) setMobileSidebarOpen(false);
                  }}
                  className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                    isSubActive
                      ? 'bg-amber-500 text-chocolate font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-white hover:text-chocolate hover:shadow-2xs font-medium'
                  }`}
                >
                  <SubIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSubActive ? 'text-chocolate' : 'text-amber-700'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{sub.label}</div>
                    {sub.description && (
                      <div className={`text-[10px] truncate ${isSubActive ? 'text-chocolate/80' : 'text-slate-400'}`}>
                        {sub.description}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
          <button
            type="button"
            onClick={handleQuickClearCache}
            disabled={clearingCache}
            title="Clear cached products and categories so customers see immediate updates"
            className="flex items-center gap-1.5 text-amber-200 hover:text-white bg-amber-950/80 hover:bg-amber-900 border border-amber-800/70 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 font-semibold shadow-2xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${clearingCache ? 'animate-spin' : ''}`} />
            <span>{clearingCache ? 'Clearing...' : 'Clear Cache'}</span>
          </button>

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
              <div className="text-[10px] text-amber-300 capitalize flex items-center gap-1 justify-end">
                {isSuperAdmin ? (
                  <>
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Super Admin</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Sub-Admin ({admin?.role || 'Staff'})</span>
                  </>
                )}
              </div>
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
            if (item.path === '/admin/products') {
              return renderProductsItem(false);
            }
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
                if (item.path === '/admin/products') {
                  return renderProductsItem(true);
                }
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
