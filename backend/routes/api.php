<?php

use Illuminate\Support\Facades\Route;

// Customer & Public Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OutletController;
use App\Http\Controllers\PhotoCakeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\BulkOrderController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\EnquiryController;
use App\Http\Controllers\ContentController;

// Admin Controllers
use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminOutletController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminPhotoCakeController;
use App\Http\Controllers\Admin\AdminBannerController;
use App\Http\Controllers\Admin\AdminGiftingController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminBulkImportController;
use App\Http\Controllers\Admin\AdminBulkProductController;
use App\Http\Controllers\Admin\AdminEnquiryController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminMediaController;
use App\Http\Controllers\Admin\AdminRistaPosController;
use App\Http\Controllers\Admin\AdminSecurityLogController;
use App\Http\Controllers\Admin\AdminCategoryImageController;
use App\Http\Controllers\Admin\AdminSubAdminController;
use App\Http\Controllers\Admin\AdminCacheController;

/*
|--------------------------------------------------------------------------
| API Routes for Ammas Pastries
|--------------------------------------------------------------------------
*/

// --- Public Endpoints ---

// Customer Authentication
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::get('/guest-session', [AuthController::class, 'guestSession']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Categories & Subcategories
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

// Products & Search
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/search', [ProductController::class, 'search']);
Route::get('/gifting', [ProductController::class, 'gifting']);
Route::get('/dream-cake', [ProductController::class, 'dreamCake']);
Route::get('/new-arrivals', [ProductController::class, 'newArrivals']);
Route::get('/most-popular', [ProductController::class, 'mostPopular']);

// Outlets
Route::get('/outlets', [OutletController::class, 'index']);
Route::get('/outlets/{id}', [OutletController::class, 'show']);

// Photo Cake Upload, Preview & Config
Route::get('/photo-cakes/config', [PhotoCakeController::class, 'config']);
Route::post('/photo-cakes/upload', [PhotoCakeController::class, 'upload']);
Route::get('/photo-cakes/preview/{token}', [PhotoCakeController::class, 'preview']);

// Orders & Tracking
Route::post('/orders/create', [OrderController::class, 'create']);
Route::post('/orders/track', [OrderController::class, 'track']);
Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);

// Authenticated Customer Orders
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/orders/my-orders', [OrderController::class, 'myOrders']);
});

// Razorpay Payments
Route::post('/payments/razorpay/order', [PaymentController::class, 'createRazorpayOrder']);
Route::post('/payments/razorpay/verify', [PaymentController::class, 'verifyPayment']);
Route::post('/payments/razorpay/webhook', [PaymentController::class, 'webhook']);

// Bulk Corporate Orders & CSV
Route::get('/bulk-orders/template', [BulkOrderController::class, 'downloadTemplate']);
Route::post('/bulk-orders/upload-csv', [BulkOrderController::class, 'uploadCsv']);
Route::post('/bulk-orders/enquiry', [BulkOrderController::class, 'submitMessage']);

// Customer Reviews & Moderation
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews/submit', [ReviewController::class, 'store']);

// Enquiries (Franchise & Contact Us)
Route::post('/enquiries/franchise', [EnquiryController::class, 'storeFranchise']);
Route::post('/enquiries/contact', [EnquiryController::class, 'storeContact']);

// Content & Settings
Route::get('/settings/delivery-bar', [ContentController::class, 'deliveryBar']);
Route::get('/content/banners', [ContentController::class, 'banners']);
Route::get('/content/category-images', [ContentController::class, 'categoryImages']);
Route::get('/category-images', [ContentController::class, 'categoryImages']);
Route::get('/content/countries', [ContentController::class, 'countries']);
Route::get('/content/policies/{slug}', [ContentController::class, 'policy']);
Route::get('/content/about-us', [ContentController::class, 'aboutUs']);
Route::get('/content/contact-info', [ContentController::class, 'contactInfo']);
Route::post('/coupons/validate', [ContentController::class, 'validateCoupon']);
Route::get('/geocode', [ContentController::class, 'geocode']);


// --- Admin Endpoints ---

// Admin Auth
Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/register', [AdminAuthController::class, 'register']);
Route::post('/admin/forgot-password', [AdminAuthController::class, 'forgotPassword']);
Route::post('/admin/reset-password', [AdminAuthController::class, 'resetPassword']);

// Protected Admin Routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/me', [AdminAuthController::class, 'me']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);

    // Media Gallery Upload (Cakes, Banners, Assets)
    Route::post('/media/upload', [AdminMediaController::class, 'upload']);

    // Dashboard & Sales Analytics
    Route::middleware('permission:dashboard')->group(function () {
        Route::get('/dashboard/summary', [AdminDashboardController::class, 'summary']);
        Route::get('/dashboard/sales-bar-chart', [AdminDashboardController::class, 'salesBarChart']);
        Route::get('/dashboard/sales-line-graph', [AdminDashboardController::class, 'salesLineGraph']);
    });

    // Products Management
    Route::middleware('permission:products|theme_cakes')->group(function () {
        Route::get('/products/export-csv', [AdminBulkProductController::class, 'exportCsv']);
        Route::get('/products/csv-template', [AdminBulkProductController::class, 'downloadTemplate']);
        Route::post('/products/bulk-upload', [AdminBulkProductController::class, 'importCsv']);
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::get('/products/{id}', [AdminProductController::class, 'show']);
        Route::put('/products/{id}', [AdminProductController::class, 'update']);
        Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);
        Route::post('/products/{id}/toggle-field', [AdminProductController::class, 'toggleField']);
    });

    // Categories & Subcategories
    Route::middleware('permission:categories|theme_cakes')->group(function () {
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);
        Route::post('/subcategories', [AdminCategoryController::class, 'storeSubcategory']);
        Route::put('/subcategories/{id}', [AdminCategoryController::class, 'updateSubcategory']);
        Route::delete('/subcategories/{id}', [AdminCategoryController::class, 'destroySubcategory']);

        // Category Images Showcase
        Route::get('/category-images', [AdminCategoryImageController::class, 'index']);
        Route::get('/category-images/settings', [AdminCategoryImageController::class, 'getSettings']);
        Route::post('/category-images/settings', [AdminCategoryImageController::class, 'updateSettings']);
        Route::post('/category-images', [AdminCategoryImageController::class, 'store']);
        Route::put('/category-images/{id}', [AdminCategoryImageController::class, 'update']);
        Route::delete('/category-images/{id}', [AdminCategoryImageController::class, 'destroy']);
        Route::patch('/category-images/{id}/toggle-status', [AdminCategoryImageController::class, 'toggleStatus']);
        Route::post('/category-images/reset-defaults', [AdminCategoryImageController::class, 'resetDefaults']);
    });

    // Outlets Management
    Route::middleware('permission:outlets')->group(function () {
        Route::get('/outlets', [AdminOutletController::class, 'index']);
        Route::post('/outlets', [AdminOutletController::class, 'store']);
        Route::post('/outlets/parse-map-link', [AdminOutletController::class, 'parseMapLink']);
        Route::put('/outlets/{id}', [AdminOutletController::class, 'update']);
        Route::delete('/outlets/{id}', [AdminOutletController::class, 'destroy']);
    });

    // Orders Management
    Route::middleware('permission:orders')->group(function () {
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
    });

    // Protected Photo Cake Access & Management
    Route::middleware('permission:photo_cakes')->group(function () {
        Route::get('/photo-cake/management', [AdminPhotoCakeController::class, 'getManagementConfig']);
        Route::post('/photo-cake/management', [AdminPhotoCakeController::class, 'saveManagementConfig']);
        Route::post('/photo-cake/shape-image', [AdminPhotoCakeController::class, 'uploadShapeImage']);
        Route::get('/photo-cake/{uploadId}/preview', [AdminPhotoCakeController::class, 'preview']);
        Route::get('/photo-cake/{uploadId}/download', [AdminPhotoCakeController::class, 'download']);
    });

    // Banners
    Route::middleware('permission:banners')->group(function () {
        Route::get('/banners', [AdminBannerController::class, 'index']);
        Route::post('/banners', [AdminBannerController::class, 'store']);
        Route::put('/banners/{id}', [AdminBannerController::class, 'update']);
        Route::delete('/banners/{id}', [AdminBannerController::class, 'destroy']);
    });

    // Gifting & Dream Cake
    Route::middleware('permission:gifting')->group(function () {
        Route::get('/gifting', [AdminGiftingController::class, 'getGifting']);
        Route::post('/gifting', [AdminGiftingController::class, 'addGifting']);
        Route::delete('/gifting/{id}', [AdminGiftingController::class, 'removeGifting']);
        Route::get('/dream-cake', [AdminGiftingController::class, 'getDreamCake']);
        Route::post('/dream-cake', [AdminGiftingController::class, 'updateDreamCake']);
    });

    // Customer Review Moderation
    Route::middleware('permission:reviews')->group(function () {
        Route::get('/reviews', [AdminReviewController::class, 'index']);
        Route::post('/reviews/{id}/toggle-approval', [AdminReviewController::class, 'toggleApproval']);
        Route::post('/reviews/{id}/toggle-featured', [AdminReviewController::class, 'toggleFeatured']);
        Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy']);
    });

    // Corporate Bulk Imports & Enquiries
    Route::middleware('permission:bulk_orders')->group(function () {
        Route::get('/bulk-imports', [AdminBulkImportController::class, 'index']);
        Route::get('/bulk-orders/{id}', [AdminBulkImportController::class, 'show']);
        Route::put('/bulk-orders/{id}/status', [AdminBulkImportController::class, 'updateStatus']);
        Route::delete('/bulk-orders/{id}', [AdminBulkImportController::class, 'destroy']);
    });

    // Franchise Enquiries
    Route::middleware('permission:franchise_enquiries')->group(function () {
        Route::get('/franchise-enquiries', [AdminEnquiryController::class, 'getFranchise']);
        Route::post('/franchise-enquiries/{id}/toggle-read', [AdminEnquiryController::class, 'toggleFranchiseRead']);
        Route::delete('/franchise-enquiries/{id}', [AdminEnquiryController::class, 'deleteFranchise']);
    });

    // Contact Enquiries
    Route::middleware('permission:contact_enquiries')->group(function () {
        Route::get('/contact-enquiries', [AdminEnquiryController::class, 'getContact']);
        Route::post('/contact-enquiries/{id}/toggle-read', [AdminEnquiryController::class, 'toggleContactRead']);
        Route::delete('/contact-enquiries/{id}', [AdminEnquiryController::class, 'deleteContact']);
    });

    // Dynamic Site Content Settings (Super Admin)
    Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
    Route::post('/settings', [AdminSettingsController::class, 'updateSettings']);
    Route::get('/policies', [AdminSettingsController::class, 'getPolicies']);
    Route::put('/policies/{slug}', [AdminSettingsController::class, 'updatePolicy']);

    // Rista POS (DotPe) Integration
    Route::middleware('permission:rista_pos')->group(function () {
        Route::get('/rista-pos/config', [AdminRistaPosController::class, 'getConfig']);
        Route::post('/rista-pos/test-connection', [AdminRistaPosController::class, 'testConnection']);
        Route::get('/rista-pos/outlets', [AdminRistaPosController::class, 'getOutlets']);
        Route::post('/rista-pos/outlets/sync', [AdminRistaPosController::class, 'syncOutlets']);
        Route::put('/rista-pos/outlets/{id}', [AdminRistaPosController::class, 'updateOutlet']);
        Route::get('/rista-pos/orders', [AdminRistaPosController::class, 'getOrders']);
        Route::post('/rista-pos/orders/{id}/sync', [AdminRistaPosController::class, 'syncOrder']);
    });

    // Security Threat & Error Logs (Super Admin)
    Route::get('/security-logs', [AdminSecurityLogController::class, 'index']);
    Route::get('/security-logs/stats', [AdminSecurityLogController::class, 'stats']);
    Route::get('/security-logs/download', [AdminSecurityLogController::class, 'download']);
    Route::post('/security-logs/clear', [AdminSecurityLogController::class, 'clear']);
    Route::delete('/security-logs/{incidentId}', [AdminSecurityLogController::class, 'destroy']);
    Route::post('/security-logs/test-alert', [AdminSecurityLogController::class, 'testAlert']);

    // Sub-Admin & Role Permissions Management (Super Admin)
    Route::prefix('sub-admins')->group(function () {
        Route::get('/', [AdminSubAdminController::class, 'index']);
        Route::get('/modules', [AdminSubAdminController::class, 'modulesList']);
        Route::post('/', [AdminSubAdminController::class, 'store']);
        Route::get('/{id}', [AdminSubAdminController::class, 'show']);
        Route::put('/{id}', [AdminSubAdminController::class, 'update']);
        Route::delete('/{id}', [AdminSubAdminController::class, 'destroy']);
        Route::patch('/{id}/toggle-status', [AdminSubAdminController::class, 'toggleStatus']);
        Route::post('/{id}/reset-password', [AdminSubAdminController::class, 'resetPassword']);
    });

    // Cache & Performance Management (Super Admin & Admins)
    Route::get('/cache/status', [AdminCacheController::class, 'status']);
    Route::post('/cache/clear', [AdminCacheController::class, 'clear']);
});
