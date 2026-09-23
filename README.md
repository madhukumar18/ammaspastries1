# AMMAS PASTRIES — Complete Full-Stack E-Commerce Platform

A production-grade, full-stack e-commerce web platform for **Ammas Pastries** (premier bakery and artisan confectionery in Bengaluru). Crafted with a modern **React 19 + Tailwind CSS** frontend, a robust **Laravel 12 REST API** backend, **MySQL / SQLite** database, and integrated **Razorpay** payment processing.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [Local Development Quick Start](#local-development-quick-start)
4. [Database & Seeded Credentials](#database--seeded-credentials)
5. [Application Walkthrough](#application-walkthrough)
   - [Customer Storefront](#customer-storefront)
   - [Photo Cake Customizer & Secure Storage](#photo-cake-customizer--secure-storage)
   - [Cart, Tamper-Proof Pricing & Checkout](#cart-tamper-proof-pricing--checkout)
   - [3-Stage Real-Time Order Tracking](#3-stage-real-time-order-tracking)
   - [Corporate Bulk Orders & CSV Upload](#corporate-bulk-orders--csv-upload)
   - [Admin Backoffice & Sales Analytics](#admin-backoffice--sales-analytics)
6. [API Architecture & Endpoints](#api-architecture--endpoints)
7. [Automated Testing](#automated-testing)
8. [Cloudways & Production Deployment](#cloudways--production-deployment)

---

## Key Features

- **Rich Visual Bakery Design System:** Warm cream, chocolate, and gold visual palette, modern typography (*Playfair Display* & *Inter*), micro-animations, product badges, and responsive layouts for mobile, tablet, and desktop.
- **Dynamic Catalog & Variants:** Multi-level categories (Cakes & Pastries, Snacks, Desserts, Dry Fruits & Chocolates, Party Items) with weight/size variants (500g, 1kg, 2kg, pieces), live price calculations, eggless filters, and instant search suggestions.
- **Interactive Photo Cake Studio:** Live circular canvas visualizer with edible cake border, customer image upload, custom piping name, flavour selection, and tamper-proof storage in `storage/app/photo_cakes/` with secure preview tokens.
- **Tamper-Proof Checkout & Razorpay:** Server-side recalculation of product prices, variant prices, delivery fees, and coupons. Front-end amounts are never trusted. Integrates Razorpay test orders with HMAC SHA256 signature verification and automatic offline fallback for instant local testing.
- **3-Stage Visual Order Tracking:** Real-time customer tracking (`Order Confirmed` ➔ `Preparing in Kitchen` ➔ `Out for Delivery / Delivered`) with detailed breakdown.
- **Corporate Bulk Orders & CSV Importer:** Downloadable sample CSV template stream, drag-and-drop file upload, row-by-row server validation with error reporting, and sentence-message inquiry form.
- **Protected Admin Backoffice:**
  - **Dynamic Sales Analytics:** Real database-calculated stats (Total Revenue, Monthly Orders, Active Outlets, Average Order Value), yearly sales bar chart with dynamic year selector, and daily trend line chart.
  - **Product & Category CRUD:** Manage products, multiple variants, images, active/inactive toggles, new arrivals, and popular items.
  - **Outlet Management:** Manage 5+ Bengaluru branches (Indiranagar, Koramangala, Jayanagar, Whitefield, Malleshwaram) with opening hours and contact details.
  - **Order Operations:** Transition order statuses, view customer delivery slots, preview and download custom photo cake images with authenticated binary streaming.
  - **Content & Gifting:** Hero banner carousel manager, "Popular in Gifting" showcase, signature "Dream Cake" 5-in-1 highlight, review moderation, and policy editor.

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | Single-Page Application with responsive design and instant HMR |
| **Icons & UI** | Lucide React, Canvas Confetti | Modern UI icons and celebratory effects |
| **State & API** | React Context API, Axios | Centralized state management and authenticated API interceptors |
| **Backend** | Laravel 12 (PHP 8.2+) | High-performance RESTful API framework |
| **Authentication** | Laravel Sanctum | Token-based authentication for customers and administrators |
| **Database** | MySQL / SQLite | Relational schema with foreign keys, indexes, and full seeder |
| **Payments** | Razorpay SDK & HMAC SHA256 | Secure web payment gateway with sandbox verification |

---

## Local Development Quick Start

### Prerequisites
- **PHP 8.2+** (with `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl` extensions)
- **Composer** (PHP package manager)
- **Node.js 18+** & **npm**
- **MySQL** or **SQLite** (SQLite works out-of-the-box with zero installation)

---

### Option A: 1-Click Automated Setup (Recommended)

#### On Windows:
1. Double-click `setup.bat` (or run `./setup.bat` in Command Prompt / PowerShell).
2. Double-click `run.bat` to start both the Laravel backend and React frontend dev servers simultaneously!

#### On Linux / macOS:
```bash
chmod +x setup.sh run.sh
./setup.sh
./run.sh
```

---

### Option B: Manual Setup

#### Step 1: Backend Setup (Laravel)
```bash
cd backend

# 1. Copy environment template
cp .env.example .env

# 2. Install PHP dependencies
composer install

# 3. Generate application encryption key
php artisan key:generate

# 4. Create public storage symlink for uploaded images
php artisan storage:link

# 5. Run database migrations and seed all sample data (products, outlets, admins, categories)
php artisan migrate --seed

# 6. Start the Laravel development server
php artisan serve --port=8000
```
Backend API will be running at: `http://127.0.0.1:8000`

#### Step 2: Frontend Setup (React + Vite)
```bash
cd frontend

# 1. Copy frontend environment template
cp .env.example .env

# 2. Install Node dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Frontend application will be running at: `http://localhost:5173`

> **Note on Environment & Security:** `.env` files contain local secrets and passwords and are strictly ignored by `.gitignore`. They are never pushed to GitHub. When running on any new machine, simply copy `.env.example` to `.env` as shown above.

---

## Database & Seeded Credentials

### 1. Admin Backoffice Access
- **URL:** `http://localhost:5173/admin/login`
- **Email:** `admin@ammaspastries.in`
- **Password:** `Admin@12345`

### 2. Demo Customer Account
- **URL:** `http://localhost:5173/user/login`
- **Phone / OTP Mode:** Enter phone `9845012345` ➔ Click "Send OTP" ➔ Enter OTP `123456`
- **Email / Password Mode:** Email: `customer@ammaspastries.in` / Password: `Customer@12345`
- **Guest Checkout:** Available directly on the checkout screen without logging in.

### 3. Pre-Seeded Bengaluru Outlets
1. **Indiranagar Flagship:** 100 Feet Road, Indiranagar, Bengaluru - 560038
2. **Koramangala Branch:** 80 Feet Road, 4th Block, Koramangala, Bengaluru - 560034
3. **Jayanagar Boutique:** 9th Main, 4th Block, Jayanagar, Bengaluru - 560011
4. **Whitefield Express:** ITPL Main Road, Whitefield, Bengaluru - 560066
5. **Malleshwaram Heritage:** Sampige Road, Malleshwaram, Bengaluru - 560003

---

## Application Walkthrough

### Customer Storefront
- **Sticky Delivery Bar:** Displays current delivery status, local operational timings, and dynamic store announcements.
- **Hero Slider:** Promotional banners with responsive call-to-actions linking to curated collections.
- **Quick Categories:** Visual circular category cards for fast navigation.
- **Popular in Gifting & Dream Cake:** Spotlight sections highlighting signature hampers and the viral 5-in-1 sensory cake.
- **Curated Feeds:** "New Arrivals" and "Most Popular" toggleable product grids with instant add-to-cart.
- **Gift Cake From Abroad:** Country selector allowing non-resident Indians (USA, UK, UAE, Canada, Australia) to send celebration cakes to loved ones in Bengaluru.

### Photo Cake Customizer & Secure Storage
1. Navigate to `/photo-cake`.
2. Select a base cake flavour (Dutch Truffle, Red Velvet, Black Forest, Fresh Fruit, etc.).
3. Choose size (1kg, 1.5kg, 2kg, 3kg) and dietary preference (Eggless / With Egg).
4. Upload any high-resolution photo (JPG, PNG, WebP up to 5MB).
5. Watch the **live circular canvas visualizer** simulate how the photo will appear framed with confectionery frosting on the actual cake.
6. Photos are uploaded via `/api/photo-cakes/upload` and securely placed in the non-public directory `storage/app/photo_cakes/`.
7. Customers view their draft with an encrypted temporary preview token; unauthorized users cannot browse user photos.
8. Store managers access authorized previews and binary downloads within the protected admin order viewer.

### Cart, Tamper-Proof Pricing & Checkout
- **Cart (`/cart`):** Add items, update quantities, toggle wishlist, and test promotional coupons (`WELCOME100` for ₹100 off, `AMMAS50` for ₹50 off, `FESTIVE15` for 15% discount).
- **Server Recalculation:** When checking out, `OrderController.php` queries the database for all item IDs and variant IDs to calculate subtotal, delivery charges, and applicable discounts. Front-end pricing parameters are disregarded.
- **Guest or Registered:** Supports frictionless guest ordering with delivery date & time slot selection.
- **Razorpay Integration:** Initializes Razorpay checkout order. In sandbox/local test mode, customers can complete a simulated payment or use the Razorpay test modal with automatic signature verification.

### 3-Stage Real-Time Order Tracking
- Navigate to `/track-order`.
- Enter order number (e.g. `AMMAS-XXXXX`) and phone number.
- Visual stepper illustrates:
  1. **Order Confirmed** (Payment captured, invoice generated)
  2. **Preparing in Kitchen** (Master bakers assembling layers & piping message)
  3. **Out for Delivery / Delivered** (Assigned rider on the way)

### Corporate Bulk Orders & CSV Upload
- Navigate to `/bulk-order`.
- **Method 1 (Download & Upload CSV):** Download the standard formatted CSV template via `/api/bulk-orders/template`, populate employee/event celebrations, and drop the CSV into the upload zone. The system checks each row for valid product name, quantity, and contact data, returning row-by-row validation feedback.
- **Method 2 (Custom Requirement):** Submit corporate gifting dates, budget, and custom message directly to the bakery catering team.

### Admin Backoffice & Sales Analytics
- **Path:** `/admin/dashboard`
- **Real Database Calculations:** Calculates actual metrics from the `orders` table.
- **Yearly Sales Bar Chart:** Filter by year (e.g., 2026, 2025) to view dynamic monthly revenue bars.
- **Line Graph:** Displays daily sales revenue trends.
- **Order Management:** View orders, change statuses (`pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`), and inspect photo cake attachments.

---

## API Architecture & Endpoints

All endpoints are prefixed with `/api`.

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Email & Password customer login |
| `POST` | `/auth/send-otp` | Send mobile OTP |
| `POST` | `/auth/verify-otp` | Verify OTP and authenticate |
| `GET` | `/categories` | List all categories with subcategories |
| `GET` | `/products` | List paginated products with category/eggless filters |
| `GET` | `/products/{slug}` | Detailed product with variants and customer reviews |
| `GET` | `/search?q={query}` | Global live search suggestions |
| `GET` | `/outlets` | List all active bakery branches |
| `POST` | `/photo-cakes/upload` | Securely upload custom cake photo |
| `GET` | `/photo-cakes/preview/{token}` | Customer preview with secure token |
| `POST` | `/orders/create` | Tamper-proof order creation |
| `POST` | `/orders/track` | Track order by order number and phone |
| `POST` | `/payments/razorpay/order` | Create Razorpay order ID |
| `POST` | `/payments/razorpay/verify` | Verify Razorpay HMAC signature |
| `GET` | `/bulk-orders/template` | Stream sample bulk order CSV template |
| `POST` | `/bulk-orders/upload-csv` | Upload and validate bulk corporate CSV |
| `POST` | `/reviews/submit` | Submit customer review |
| `POST` | `/enquiries/franchise` | Submit franchise application |
| `POST` | `/enquiries/contact` | Submit contact inquiry |
| `POST` | `/coupons/validate` | Check coupon code validity |

### Admin Endpoints (Protected by Sanctum Token)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/admin/login` | Admin credentials verification |
| `GET` | `/admin/dashboard/summary` | Real database metric counters |
| `GET` | `/admin/dashboard/sales-bar-chart` | Monthly sales bar chart by year |
| `GET` | `/admin/dashboard/sales-line-graph` | Daily sales trends line graph |
| `GET/POST`| `/admin/products` | View and create products with variants |
| `PUT/DEL` | `/admin/products/{id}` | Update and delete products |
| `POST` | `/admin/products/{id}/toggle-field`| Toggle new arrival or popular flag |
| `GET/POST`| `/admin/categories` | Manage categories and subcategories |
| `GET/POST`| `/admin/outlets` | Manage store outlets and operating hours |
| `GET/PUT` | `/admin/orders` | Manage customer orders & update tracking status |
| `GET` | `/admin/photo-cake/{id}/download` | Authorized binary photo cake download |
| `GET/POST`| `/admin/banners` | Manage homepage promotional carousel |
| `GET/POST`| `/admin/gifting` | Manage Popular in Gifting items & Dream Cake |
| `GET/POST`| `/admin/reviews` | Moderate reviews & feature testimonials |
| `GET/PUT` | `/admin/bulk-imports` | Review corporate CSV uploads and orders |
| `GET/POST`| `/admin/franchise-enquiries`| Review franchise applications |
| `GET/POST`| `/admin/settings` | Update delivery bar message & policies |

---

## Automated Testing

The backend includes a comprehensive PHPUnit test suite verifying authentication, product catalogs, tamper-proof order calculation, and status transitions:

```bash
cd backend
php artisan test
```

### Passing Tests:
- `ProductApiTest`: Tests category listing, product filtering, and variant pricing.
- `OrderAndTrackingTest`: Tests order placement, server price recalculation, order tracking by phone, and status flow.

---

## Cloudways & Production Deployment

For complete, step-by-step instructions on deploying this platform on a **DigitalOcean server via Cloudways**, see the dedicated deployment guide:

👉 [**CLOUDWAYS_DEPLOYMENT.md**](./CLOUDWAYS_DEPLOYMENT.md)

It covers:
1. Cloudways PHP 8.2+ Application setup
2. Git deployment and environment variables
3. MySQL production database migration & seeding
4. Nginx webroot and directory permissions
5. Production Vite build & asset serving
6. SSL certificate installation
7. Cron scheduling & queue workers
8. Razorpay live webhook configuration
