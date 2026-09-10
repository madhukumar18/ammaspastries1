# Implementation Plan — Ammas Pastries Full-Stack E-Commerce Platform

A production-ready full-stack e-commerce web platform for **Ammas Pastries**, an online bakery and cake-selling business. The platform features a customer-facing React SPA (Vite, React Router, Tailwind/Modern CSS) and a robust Laravel 11/12 REST API backend powered by MySQL, complete with Razorpay payments, photo cake uploads, bulk order CSV processing, sales analytics, and a protected Admin Dashboard.

---

## Architecture Overview

```
                        BROWSER CLIENT
    ┌─────────────────────────────────────────────────────┐
    │          React 18+ / Vite Frontend (SPA)            │
    │         http://localhost:5173 (Development)         │
    │  - Top Delivery Bar & Main / Secondary Navbars      │
    │  - Outlet Selector (Persisted in Session / Storage) │
    │  - Global Live Search with Suggestions & Badges     │
    │  - Banner Carousel & Interactive Bakery Sections    │
    │  - Category Catalog, Product Details & Variants     │
    │  - Dedicated Photo Cake Upload & Customization      │
    │  - Cart, Wishlist, Checkout & Guest Flow            │
    │  - Razorpay Checkout & Order Confirmation           │
    │  - 3-Stage Visual Track Order & Customer Account    │
    │  - Bulk Order (CSV Template/Upload & Message)       │
    │  - Franchise & Contact Enquiries                    │
    │  - Protected Admin Dashboard & Management Tools     │
    └──────────────────────────┬──────────────────────────┘
                               │ JSON REST API / Multipart (CORS)
                               ▼
    ┌─────────────────────────────────────────────────────┐
    │               Laravel REST API Backend              │
    │         http://127.0.0.1:8000 (Development)         │
    │  - Authentication (Sanctum Tokens / Session)        │
    │  - Customer OTP (Dev logger/response + Live SMS)    │
    │  - Server-side Price Calculations (Tamper-proof)    │
    │  - Razorpay Order Creation & HMAC SHA256 Verify     │
    │  - Protected Photo Cake Storage & Admin Download    │
    │  - CSV Validator for Bulk Corporate Orders          │
    │  - Sales Analytics Engine (Yearly/Monthly/Daily)    │
    │  - Admin Authorization & Audit Logging Middleware   │
    └──────────────────────────┬──────────────────────────┘
                               │ PDO / Eloquent
                               ▼
    ┌─────────────────────────────────────────────────────┐
    │                    MySQL Database                   │
    │                localhost:3306 / Cloudways           │
    │  - 25+ Tables with Foreign Keys, Indexes & Seeds    │
    └─────────────────────────────────────────────────────┘
```

---

## Database Schema & Migrations
- `users`: ID, name, email, phone, password, role (`customer`), otp_code, otp_expires_at, email_verified_at, timestamps.
- `admins`: ID, name, email, password, role (`super_admin`, `admin`), permissions, timestamps.
- `categories`: ID, name, slug, description, image, display_order, is_active, timestamps.
- `subcategories`: ID, category_id, name, slug, description, display_order, is_active, timestamps.
- `products`: ID, name, slug, sku, category_id, subcategory_id, short_description, description, base_price, discount_price, weight, is_eggless, stock, is_available, is_featured, is_popular, is_new_arrival, is_gifting, timestamps.
- `product_variants`: ID, product_id, size_weight (e.g., 500g, 1kg, 2kg), price, discount_price, sku, stock, timestamps.
- `product_images`: ID, product_id, image_url, is_primary, display_order, timestamps.
- `outlets`: ID, name, code, address, area, city, state, pincode, phone, opening_time, closing_time, is_active, timestamps.
- `outlet_products`: ID, outlet_id, product_id, is_available, timestamps.
- `wishlists` & `wishlist_items`: User/session association, product_id, timestamps.
- `carts` & `cart_items`: User/session association, product_id, variant_id, quantity, customization, timestamps.
- `addresses`: User_id, name, phone, address_line1, address_line2, area, city, state, pincode, is_default, timestamps.
- `orders`: ID, order_number (`AMP-XXXXXX`), user_id (nullable for guest), outlet_id, customer_name, customer_email, customer_phone, delivery_address, delivery_area, delivery_city, delivery_pincode, subtotal, discount, delivery_fee, tax, total_amount, payment_status, order_status, tracking_status, delivery_date, delivery_time_slot, notes, timestamps.
- `order_items`: ID, order_id, product_id, variant_id, product_name, variant_title, unit_price, quantity, subtotal, timestamps.
- `order_customizations`: ID, order_item_id, name_on_cake, instructions, photo_cake_upload_id, eggless, timestamps.
- `photo_cake_uploads`: ID, original_filename, stored_path, mime_type, file_size, uploader_ip, timestamps.
- `payments`: ID, order_id, transaction_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, payload, timestamps.
- `reviews`: ID, product_id, user_id, customer_name, rating (1-5), comment, is_approved, is_featured, timestamps.
- `banners`: ID, title, subtitle, image_url, mobile_image_url, button_text, button_url, display_order, is_active, timestamps.
- `dream_cakes`: ID, product_id, title, description, badge, display_order, is_active, timestamps.
- `gifting_products`: ID, product_id, display_order, is_active, timestamps.
- `countries`: ID, name, code, flag_image, display_order, is_active, timestamps.
- `bulk_orders`: ID, customer_name, email, phone, message, order_type, file_path, status, timestamps.
- `bulk_order_items`: ID, bulk_order_id, product_name, quantity, preferred_date, preferred_time, outlet, special_instructions, timestamps.
- `franchise_enquiries`: ID, name, email, phone, city, budget, message, is_read, timestamps.
- `contact_enquiries`: ID, name, email, phone, subject, message, is_read, timestamps.
- `settings`: ID, key, value, group, timestamps.

---

## Core Controllers & API Endpoints
- `AuthController`: Register, Login, Dev OTP generate/verify, Guest session init, Logout, Profile update.
- `AdminAuthController`: Admin login, verify token, admin profile.
- `CategoryController`: List categories with nested subcategories.
- `ProductController`: List products, filtering by category, subcategory, search, tags, pagination, single product details.
- `OutletController`: List active outlets, get outlet details.
- `CartController`: Sync cart, add item, update quantity, remove item, apply coupon.
- `PhotoCakeController`: Secure upload of photo cake image with validation, preview token generation.
- `OrderController`: Server-side recalculation of product prices, variants, delivery fee, coupons; tracking endpoint.
- `PaymentController`: Razorpay order creation, HMAC SHA256 signature verification, webhook handler.
- `BulkOrderController`: CSV template streaming, CSV upload with row-by-row validation, sentence inquiry.
- `ReviewController`: Submit review, fetch approved reviews for homepage & product.
- `EnquiryController`: Franchise enquiry submission, Contact enquiry submission.
- `ContentController`: Delivery bar config, policy pages, countries for abroad gifting.
- `AdminDashboardController`: Metrics (Daily/Monthly/Yearly Sales, Total Orders, Average Order Value), yearly bar chart, line chart.
- `AdminProductController` & `AdminCategoryController`: Full CRUD, image uploads, variant management.
- `AdminOrderController`: View orders, filter, status progression (`Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`), cancel order.
- `AdminPhotoCakeController`: Authorized image preview & binary file download.
- `AdminMediaController`: Handle local gallery image uploads for products and banners.
- `AdminBannerController`, `AdminReviewController`, `AdminBulkImportController`, `AdminEnquiryController`, `AdminSettingsController`.

---

## Frontend Layout & Pages
- **Layout:** `TopDeliveryBar`, `MainNavbar`, `SecondaryNavbar` (multi-level dropdowns for Cakes & Pastries, Snacks, Desserts, Dry Fruits, Chocolates, Party Items), and `Footer`.
- **Pages:**
  - `HomePage` (Banner carousel, cake intro, gifting showcase, dream cake spotlight, latest & greatest switcher, NRI country carousel, reviews).
  - `CategoryPage` (Catalog filtering, subcategory varieties, eggless toggle, sorting).
  - `ProductDetailPage` (Variants, price update, gallery, reviews submission modal).
  - `PhotoCakePage` (Interactive circular canvas with live photo upload simulation, flavor & size options).
  - `CartPage` & `CheckoutPage` (Persistent cart, coupons, guest/customer checkout, Razorpay gateway).
  - `OrderConfirmationPage` & `TrackOrderPage` (Celebratory confetti, 3-stage visual order progress stepper).
  - `BulkOrderPage` (Downloadable CSV template stream, drag-and-drop CSV validation, corporate form).
  - `FranchisePage` & `ContactPage` (Direct enquiry forms).
  - `AboutPage` & `PolicyPage` (Story, kitchen standards, dynamic legal policies).
  - `AdminLoginPage` & `AdminLayout` (Protected admin panel with 12 management modules).
