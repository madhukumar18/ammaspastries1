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
import AdminRistaPosPage from './pages/Admin/AdminRistaPosPage';
import AdminSecurityLogsPage from './pages/Admin/AdminSecurityLogsPage';
import AdminCategoryImagesPage from './pages/Admin/AdminCategoryImagesPage';
import ErrorBoundary from './components/UI/ErrorBoundary';

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
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="photo-cakes" element={<AdminPhotoCakePage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="category-images" element={<AdminCategoryImagesPage />} />
            <Route path="outlets" element={<AdminOutletsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="rista-pos" element={<AdminRistaPosPage />} />
            <Route path="security-logs" element={<AdminSecurityLogsPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="gifting" element={<AdminGiftingPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="bulk-products" element={<AdminBulkProductsPage />} />
            <Route path="bulk-products-csv" element={<AdminBulkProductsPage />} />
            <Route path="bulk-imports" element={<AdminBulkImportsPage />} />
            <Route path="franchise-enquiries" element={<AdminEnquiriesPage />} />
            <Route path="contact-enquiries" element={<AdminEnquiriesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
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
