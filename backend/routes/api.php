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
use App\Http\Controllers\Admin\AdminEnquiryController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminMediaController;

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

// Photo Cake Upload & Preview
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
Route::get('/content/countries', [ContentController::class, 'countries']);
Route::get('/content/policies/{slug}', [ContentController::class, 'policy']);
Route::get('/content/about-us', [ContentController::class, 'aboutUs']);
Route::get('/content/contact-info', [ContentController::class, 'contactInfo']);
Route::post('/coupons/validate', [ContentController::class, 'validateCoupon']);


// --- Admin Endpoints ---

// Admin Auth
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Protected Admin Routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/me', [AdminAuthController::class, 'me']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);

    // Media Gallery Upload (Cakes, Banners, Assets)
    Route::post('/media/upload', [AdminMediaController::class, 'upload']);

    // Dashboard & Sales Analytics
    Route::get('/dashboard/summary', [AdminDashboardController::class, 'summary']);
    Route::get('/dashboard/sales-bar-chart', [AdminDashboardController::class, 'salesBarChart']);
    Route::get('/dashboard/sales-line-graph', [AdminDashboardController::class, 'salesLineGraph']);

    // Products Management
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::get('/products/{id}', [AdminProductController::class, 'show']);
    Route::put('/products/{id}', [AdminProductController::class, 'update']);
    Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);
    Route::post('/products/{id}/toggle-field', [AdminProductController::class, 'toggleField']);

    // Categories & Subcategories
    Route::get('/categories', [AdminCategoryController::class, 'index']);
    Route::post('/categories', [AdminCategoryController::class, 'store']);
    Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
    Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);
    Route::post('/subcategories', [AdminCategoryController::class, 'storeSubcategory']);
    Route::delete('/subcategories/{id}', [AdminCategoryController::class, 'destroySubcategory']);

    // Outlets Management
    Route::get('/outlets', [AdminOutletController::class, 'index']);
    Route::post('/outlets', [AdminOutletController::class, 'store']);
    Route::put('/outlets/{id}', [AdminOutletController::class, 'update']);
    Route::delete('/outlets/{id}', [AdminOutletController::class, 'destroy']);

    // Orders Management
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

    // Protected Photo Cake Access
    Route::get('/photo-cake/{uploadId}/preview', [AdminPhotoCakeController::class, 'preview']);
    Route::get('/photo-cake/{uploadId}/download', [AdminPhotoCakeController::class, 'download']);

    // Banners
    Route::get('/banners', [AdminBannerController::class, 'index']);
    Route::post('/banners', [AdminBannerController::class, 'store']);
    Route::put('/banners/{id}', [AdminBannerController::class, 'update']);
    Route::delete('/banners/{id}', [AdminBannerController::class, 'destroy']);

    // Gifting & Dream Cake
    Route::get('/gifting', [AdminGiftingController::class, 'getGifting']);
    Route::post('/gifting', [AdminGiftingController::class, 'addGifting']);
    Route::delete('/gifting/{id}', [AdminGiftingController::class, 'removeGifting']);
    Route::get('/dream-cake', [AdminGiftingController::class, 'getDreamCake']);
    Route::post('/dream-cake', [AdminGiftingController::class, 'updateDreamCake']);

    // Customer Review Moderation
    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::post('/reviews/{id}/toggle-approval', [AdminReviewController::class, 'toggleApproval']);
    Route::post('/reviews/{id}/toggle-featured', [AdminReviewController::class, 'toggleFeatured']);
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy']);

    // Corporate Bulk Imports & Enquiries
    Route::get('/bulk-imports', [AdminBulkImportController::class, 'index']);
    Route::get('/bulk-orders/{id}', [AdminBulkImportController::class, 'show']);
    Route::put('/bulk-orders/{id}/status', [AdminBulkImportController::class, 'updateStatus']);
    Route::delete('/bulk-orders/{id}', [AdminBulkImportController::class, 'destroy']);

    // Franchise & Contact Enquiries
    Route::get('/franchise-enquiries', [AdminEnquiryController::class, 'getFranchise']);
    Route::post('/franchise-enquiries/{id}/toggle-read', [AdminEnquiryController::class, 'toggleFranchiseRead']);
    Route::delete('/franchise-enquiries/{id}', [AdminEnquiryController::class, 'deleteFranchise']);
    Route::get('/contact-enquiries', [AdminEnquiryController::class, 'getContact']);
    Route::post('/contact-enquiries/{id}/toggle-read', [AdminEnquiryController::class, 'toggleContactRead']);
    Route::delete('/contact-enquiries/{id}', [AdminEnquiryController::class, 'deleteContact']);

    // Dynamic Site Content Settings
    Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
    Route::post('/settings', [AdminSettingsController::class, 'updateSettings']);
    Route::get('/policies', [AdminSettingsController::class, 'getPolicies']);
    Route::put('/policies/{slug}', [AdminSettingsController::class, 'updatePolicy']);
});
