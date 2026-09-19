import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/UI/ToastContainer';
import ScrollToTop from './components/UI/ScrollToTop';
import BakeryCursorTrail from './components/UI/BakeryCursorTrail';

// Layouts
import PublicLayout from './components/Layout/PublicLayout';
import AdminLayout from './pages/Admin/AdminLayout';

// Public Pages
import HomePage from './pages/Home/HomePage';
import CategoryPage from './pages/Catalog/CategoryPage';
import CuratedListPage from './pages/Catalog/CuratedListPage';
import SearchResultsPage from './pages/Catalog/SearchResultsPage';
import ProductDetailPage from './pages/Product/ProductDetailPage';
import PhotoCakePage from './pages/PhotoCake/PhotoCakePage';
import ThemeCakePage from './pages/ThemeCake/ThemeCakePage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmation/OrderConfirmationPage';
import TrackOrderPage from './pages/TrackOrder/TrackOrderPage';
import WishlistPage from './pages/Wishlist/WishlistPage';
import LoginPage from './pages/Auth/LoginPage';
import AccountPage from './pages/Account/AccountPage';
import BulkOrderPage from './pages/BulkOrder/BulkOrderPage';
import FranchisePage from './pages/Franchise/FranchisePage';
import ContactPage from './pages/Contact/ContactPage';
import AboutPage from './pages/About/AboutPage';
import PolicyPage from './pages/Policy/PolicyPage';

// Admin Pages
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminProductsPage from './pages/Admin/AdminProductsPage';
import AdminCategoriesPage from './pages/Admin/AdminCategoriesPage';
import AdminOutletsPage from './pages/Admin/AdminOutletsPage';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import AdminBannersPage from './pages/Admin/AdminBannersPage';
import AdminGiftingPage from './pages/Admin/AdminGiftingPage';
import AdminReviewsPage from './pages/Admin/AdminReviewsPage';
import AdminBulkImportsPage from './pages/Admin/AdminBulkImportsPage';
import AdminBulkProductsPage from './pages/Admin/AdminBulkProductsPage';
import AdminEnquiriesPage from './pages/Admin/AdminEnquiriesPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';
import AdminPhotoCakePage from './pages/Admin/AdminPhotoCakePage';
import AdminThemeCakePage from './pages/Admin/AdminThemeCakePage';
import AdminRistaPosPage from './pages/Admin/AdminRistaPosPage';
import AdminSecurityLogsPage from './pages/Admin/AdminSecurityLogsPage';
import AdminCategoryImagesPage from './pages/Admin/AdminCategoryImagesPage';
import AdminSubAdminsPage from './pages/Admin/AdminSubAdminsPage';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { useApp } from './context/AppContext';

// Route Guard to enforce module-level visibility on direct navigation
const AdminRouteGuard = ({ module, superOnly = false, children }) => {
  const { isSuperAdmin, hasPermission } = useApp();

  if (superOnly && !isSuperAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-rose-100 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <h2 className="font-serif text-xl font-bold text-slate-800">Super Administrator Access Required</h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          This area is restricted exclusively to the Super Administrator. You do not have permission to access this management console.
        </p>
      </div>
    );
  }

  if (module && !hasPermission(module)) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-amber-100 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ⚠️
        </div>
        <h2 className="font-serif text-xl font-bold text-slate-800">Module Permission Required</h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          You do not have administrative permission to view the <strong className="text-amber-800 capitalize">{module.replace(/_/g, ' ')}</strong> module. Please contact your Super Administrator to request access.
        </p>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <ScrollToTop />
          <ToastContainer />
          <BakeryCursorTrail />

          <Routes>
          {/* Public Storefront Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/theme-cakes" element={<ThemeCakePage />} />
            <Route path="/theme-cakes" element={<ThemeCakePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/cakes/:slug" element={<ProductDetailPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/new-arrivals" element={<CuratedListPage />} />
            <Route path="/most-popular" element={<CuratedListPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/photo-cake" element={<PhotoCakePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/user/login" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/bulk-order" element={<BulkOrderPage />} />
            <Route path="/franchise-enquiry" element={<FranchisePage />} />
            <Route path="/franchise" element={<FranchisePage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/about" element={<AboutPage />} />
            
            {/* Legal Policies */}
            <Route path="/policies/:slug" element={<PolicyPage />} />
            <Route path="/policy/:slug" element={<PolicyPage />} />
            <Route path="/terms-and-conditions" element={<PolicyPage />} />
            <Route path="/terms-conditions" element={<PolicyPage />} />
            <Route path="/privacy-policy" element={<PolicyPage />} />
            <Route path="/shipping-policy" element={<PolicyPage />} />
            <Route path="/refund-policy" element={<PolicyPage />} />
            <Route path="/terms-of-use" element={<PolicyPage />} />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Backoffice Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminRouteGuard module="dashboard"><AdminDashboardPage /></AdminRouteGuard>} />
            <Route path="products" element={<AdminRouteGuard module="products"><AdminProductsPage /></AdminRouteGuard>} />
            <Route path="photo-cakes" element={<AdminRouteGuard module="photo_cakes"><AdminPhotoCakePage /></AdminRouteGuard>} />
            <Route path="theme-cakes" element={<AdminRouteGuard module="theme_cakes"><AdminThemeCakePage /></AdminRouteGuard>} />
            <Route path="categories" element={<AdminRouteGuard module="categories"><AdminCategoriesPage /></AdminRouteGuard>} />
            <Route path="category-images" element={<AdminRouteGuard module="categories"><AdminCategoryImagesPage /></AdminRouteGuard>} />
            <Route path="outlets" element={<AdminRouteGuard module="outlets"><AdminOutletsPage /></AdminRouteGuard>} />
            <Route path="orders" element={<AdminRouteGuard module="orders"><AdminOrdersPage /></AdminRouteGuard>} />
            <Route path="rista-pos" element={<AdminRouteGuard module="rista_pos"><AdminRistaPosPage /></AdminRouteGuard>} />
            <Route path="security-logs" element={<AdminRouteGuard superOnly module="security_logs"><AdminSecurityLogsPage /></AdminRouteGuard>} />
            <Route path="banners" element={<AdminRouteGuard module="banners"><AdminBannersPage /></AdminRouteGuard>} />
            <Route path="gifting" element={<AdminRouteGuard module="gifting"><AdminGiftingPage /></AdminRouteGuard>} />
            <Route path="reviews" element={<AdminRouteGuard module="reviews"><AdminReviewsPage /></AdminRouteGuard>} />
            <Route path="bulk-products" element={<AdminRouteGuard module="bulk_products"><AdminBulkProductsPage /></AdminRouteGuard>} />
            <Route path="bulk-products-csv" element={<AdminRouteGuard module="bulk_products"><AdminBulkProductsPage /></AdminRouteGuard>} />
            <Route path="bulk-imports" element={<AdminRouteGuard module="bulk_orders"><AdminBulkImportsPage /></AdminRouteGuard>} />
            <Route path="franchise-enquiries" element={<AdminRouteGuard module="franchise_enquiries"><AdminEnquiriesPage /></AdminRouteGuard>} />
            <Route path="contact-enquiries" element={<AdminRouteGuard module="contact_enquiries"><AdminEnquiriesPage /></AdminRouteGuard>} />
            <Route path="sub-admins" element={<AdminRouteGuard superOnly module="sub_admins"><AdminSubAdminsPage /></AdminRouteGuard>} />
            <Route path="settings" element={<AdminRouteGuard superOnly module="settings"><AdminSettingsPage /></AdminRouteGuard>} />
          </Route>

          {/* Fallback 404 -> Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
}

export default App;
