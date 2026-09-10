# Ammas Pastries — Cloudways Production Deployment Guide
### Host: DigitalOcean (via Cloudways Managed Cloud)

This guide provides step-by-step instructions to deploy the **Ammas Pastries full-stack platform** (Laravel 12 REST API + React SPA + MySQL + Razorpay) onto a Cloudways DigitalOcean server.

---

## Architecture Options on Cloudways

You can deploy using either of two standard architectures on Cloudways:

- **Option A (Unified Single Domain — Recommended):**
  - Domain: `https://www.ammaspastries.in`
  - React SPA files served directly from Laravel's `public/` directory or root Nginx.
  - API routes: `https://www.ammaspastries.in/api/...`
  - Benefits: Zero CORS issues, single SSL certificate, easiest cookie/session handling.

- **Option B (Decoupled Subdomains):**
  - Storefront: `https://www.ammaspastries.in` (Vite SPA on Cloudways or Cloudflare Pages/Vercel)
  - API: `https://api.ammaspastries.in` (Cloudways Laravel Application)

*This guide details **Option A** for seamless deployment on a single Cloudways server.*

---

## 1. Cloudways Server Provisioning

1. Log in to your [Cloudways Console](https://platform.cloudways.com/).
2. Click **Add Server** and configure:
   - **Application:** Select **Custom App (PHP 8.x)** or **Laravel**.
   - **Application Name:** `ammas-pastries`
   - **Server Name:** `ammas-prod-server`
   - **Cloud Provider:** **DigitalOcean**
   - **Server Size:** 2GB RAM / 1 Core minimum (4GB recommended for high festive seasonal traffic).
   - **Location:** **Bangalore, India** (lowest latency for Bengaluru customers).
3. Click **Launch Now** and wait 5–7 minutes for provisioning.

---

## 2. Server & PHP Configuration

1. In Cloudways, navigate to **Server Management** ➔ **Settings & Packages**:
   - **PHP Version:** Set to **PHP 8.2** or **PHP 8.3**.
   - **Memory Limit:** Set to `512M`.
   - **Execution Time:** Set to `300` seconds.
   - **Upload Size:** Set to `32M` (allows high-res photo cake uploads).
2. Under the **Packages** tab:
   - Ensure **MySQL / MariaDB** is active (MariaDB 10.6+ or MySQL 8.0).
   - Ensure **Redis** is installed and running for session/cache acceleration.

---

## 3. Application Webroot Configuration

1. Navigate to **Application Management** ➔ `ammas-pastries`.
2. Go to **Application Settings** ➔ **Webroot Directory**.
3. Set the Webroot to:
   ```text
   public_html/backend/public
   ```
   *(This ensures web visitors can only access Laravel's secure public folder).*

---

## 4. Deploying Code via Git / SSH

### Method A: Cloudways Git Integration
1. Go to **Application Management** ➔ **Deployment Via Git**.
2. Generate an SSH Key in Cloudways and add it to your GitHub/GitLab repository deploy keys.
3. Enter your repository SSH URL and branch (`main`).
4. Set destination to: `public_html`.
5. Click **Start Deployment**.

### Method B: Manual SSH / Terminal
Connect via SSH using your Master or Application credentials:
```bash
ssh master_username@your_server_ip
cd applications/your_app_folder/public_html
git clone https://github.com/your-org/ammas-pastries.git .
```

---

## 5. Backend Configuration & Composer Setup

1. In your SSH terminal, navigate to the `backend/` directory:
   ```bash
   cd /home/master/applications/your_app_folder/public_html/backend
   ```

2. Install production Composer dependencies (without dev packages):
   ```bash
   composer install --no-dev --optimize-autoloader
   ```

3. Create the production `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Retrieve your Cloudways MySQL credentials:
   - In Cloudways Application Management, find **Database Name**, **Database Username**, and **Database Password** under **Access Details**.

5. Edit `.env` (`nano .env`):
   ```ini
   APP_NAME="Ammas Pastries"
   APP_ENV=production
   APP_KEY=
   APP_DEBUG=false
   APP_URL=https://www.ammaspastries.in

   LOG_CHANNEL=stack
   LOG_LEVEL=error

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_cloudways_db_name
   DB_USERNAME=your_cloudways_db_user
   DB_PASSWORD=your_cloudways_db_password

   BROADCAST_CONNECTION=log
   CACHE_STORE=redis
   QUEUE_CONNECTION=redis
   SESSION_DRIVER=redis

   REDIS_CLIENT=phpredis
   REDIS_HOST=127.0.0.1
   REDIS_PASSWORD=null
   REDIS_PORT=6379

   # Razorpay Production Keys
   RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
   RAZORPAY_KEY_SECRET=your_actual_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret

   # CORS Allowed Origins
   CORS_ALLOWED_ORIGINS=https://www.ammaspastries.in,https://ammaspastries.in
   SANCTUM_STATEFUL_DOMAINS=www.ammaspastries.in,ammaspastries.in
   ```

6. Generate the Application Encryption Key:
   ```bash
   php artisan key:generate --force
   ```

7. Run Database Migrations and initial Seeder:
   ```bash
   php artisan migrate --force --seed
   ```

8. Create the Storage Symlink:
   ```bash
   php artisan storage:link
   ```

9. Set folder permissions so Nginx/PHP-FPM can write to storage:
   ```bash
   chmod -R 775 storage bootstrap/cache
   chmod -R 775 storage/app/photo_cakes
   chmod -R 775 storage/app/bulk_imports
   ```

---

## 6. Frontend Production Build & Integration

You can build the React frontend either on your local machine or directly on the server:

### Option 1: Build Locally and Deploy
1. In your local development machine:
   ```bash
   cd frontend
   # Set production API URL in .env.production
   echo "VITE_API_URL=https://www.ammaspastries.in/api" > .env.production
   npm run build
   ```
2. Copy the resulting `frontend/dist/*` files into the server's `backend/public/` folder.
3. This creates:
   - `backend/public/index.html`
   - `backend/public/assets/...`

### Option 2: Build on Cloudways Server
Cloudways servers include Node.js and npm:
```bash
cd /home/master/applications/your_app_folder/public_html/frontend
npm install
npm run build
# Copy built files into Laravel's public directory
cp -r dist/* ../backend/public/
```

---

## 7. Nginx / Single Page Application Routing

To ensure both the Laravel REST API (`/api/*`) and React SPA frontend client-side routes (`/cakes/:slug`, `/cart`, `/checkout`, `/admin/*`) resolve properly without 404s, add an SPA catch-all rule in Laravel.

Add this fallback to `backend/routes/web.php`:
```php
<?php

use Illuminate\Support\Facades\Route;

// Fallback to React SPA index.html for all non-API web routes
Route::fallback(function () {
    return file_get_contents(public_path('index.html'));
});
```

---

## 8. SSL Certificate Setup (Let's Encrypt)

1. In Cloudways Application Management, go to **SSL Certificate**.
2. Select **Let's Encrypt**.
3. Enter your email address and domain name:
   - Primary Domain: `ammaspastries.in`
   - Additional Domains: `www.ammaspastries.in`
4. Make sure your DNS A-records at GoDaddy / Cloudflare / Namecheap point to your **Cloudways Server Public IP**.
5. Click **Install Certificate**. Cloudways will automatically issue and renew the SSL certificate.
6. Enable **Auto-Renewal** and **Force HTTPS**.

---

## 9. Laravel Cron & Scheduled Tasks

Ammas Pastries automated tasks (daily sales rollups, unverified order cleanup, delivery slot updates) use Laravel's scheduler:

1. In Cloudways Application Management, go to **Cron Optimizer** / **Cron Jobs**.
2. Click **Add New Cron Job** ➔ **Advanced Mode**.
3. Set schedule to: Every Minute (`* * * * *`).
4. Set Command to:
   ```bash
   php /home/master/applications/your_app_folder/public_html/backend/artisan schedule:run >> /dev/null 2>&1
   ```

---

## 10. Queue Worker (Supervisor) Setup

For asynchronous order notifications, invoice PDF generation, and customer SMS/OTP dispatch:

1. In Cloudways, go to **Application Management** ➔ **Supervisord**.
2. Click **Add New Process**:
   - **Name:** `ammas-worker`
   - **Command:** `php /home/master/applications/your_app_folder/public_html/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600`
   - **Number of Processes:** `2`
   - **User:** `master` (or application username)
3. Click **Save**.

---

## 11. Razorpay Live Payment Gateway Setup

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch from **Test Mode** to **Live Mode**.
3. Navigate to **Settings** ➔ **API Keys** ➔ Generate Live Key ID and Key Secret.
4. Add live keys to your `backend/.env`:
   ```ini
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Navigate to **Settings** ➔ **Webhooks** ➔ **Add New Webhook**:
   - **Webhook URL:** `https://www.ammaspastries.in/api/payments/razorpay/webhook`
   - **Secret:** Generate a secret string and put it in `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events:**
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
6. Save the webhook.

---

## 12. Production Optimization Checklist

Before announcing the launch, execute these optimization commands on the server:

```bash
cd /home/master/applications/your_app_folder/public_html/backend

# 1. Cache configuration files
php artisan config:cache

# 2. Cache application routes
php artisan route:cache

# 3. Cache Blade views
php artisan view:cache

# 4. Cache application events
php artisan event:cache

# 5. Optimize Composer Autoloader
composer dump-autoload -o
```

---

## 13. Backups & Disaster Recovery

Cloudways provides automated daily server and application-level backups:
1. In Cloudways Server Management, go to **Backups**.
2. Verify:
   - **Backup Frequency:** 1 Day (Daily).
   - **Retention:** 7 to 14 days.
   - **On-Demand Backup:** Take a full snapshot prior to major festive sales (Diwali, New Year, Valentine's Day).

---

## 14. Verification Checklist

- [ ] Storefront loads securely via `https://www.ammaspastries.in` with green padlock.
- [ ] Sticky delivery bar displays live store hours and order cutoffs.
- [ ] Category filtering, search bar suggestions, and eggless toggle respond instantly.
- [ ] Photo cake circular canvas upload works and images are safely stored in `storage/app/photo_cakes/`.
- [ ] Cart reflects promotional coupons (`WELCOME100`, `AMMAS50`).
- [ ] Checkout recalculates prices strictly on backend database records.
- [ ] Razorpay checkout opens in live mode and processes payments.
- [ ] Order confirmation triggers celebratory confetti and generates order ID.
- [ ] Real-time order tracking steppers update from `Confirmed` to `Delivered`.
- [ ] Corporate bulk order CSV template downloads and uploads correctly.
- [ ] Admin dashboard (`/admin/dashboard`) graphs real database sales data with year selector.
- [ ] Admin orders screen displays photo cake previews and authenticated binary download.
