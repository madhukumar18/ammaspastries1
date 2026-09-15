<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Banner;
use App\Models\Country;
use App\Models\Policy;
use App\Models\Setting;
use App\Models\Coupon;
use App\Models\CategoryImage;

class ContentController extends Controller
{
    // Delivery bar configuration
    public function deliveryBar()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'message' => Setting::getVal('delivery_message', 'Home Delivery Available'),
                'delivery_time' => Setting::getVal('delivery_time', '45 Mins to 1 Hour'),
                'opening_time' => Setting::getVal('opening_time', '10:00 AM'),
                'closing_time' => Setting::getVal('closing_time', '10:00 PM'),
            ]
        ]);
    }

    // Hero banners
    public function banners()
    {
        $banners = Banner::where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $banners,
        ]);
    }

    // Active Category Images Showcase
    public function categoryImages()
    {
        $categoryImages = CategoryImage::where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $settings = [
            'badge_text' => Setting::getVal('category_carousel_badge', 'Explore Bakery Specialties'),
            'title' => Setting::getVal('category_carousel_title', 'Fresh Confectionery Categories'),
            'subtitle' => Setting::getVal('category_carousel_subtitle', 'Click any category to order fresh artisan creations'),
            'auto_scroll' => filter_var(Setting::getVal('category_carousel_auto_scroll', 'true'), FILTER_VALIDATE_BOOLEAN),
            'scroll_speed' => (float) Setting::getVal('category_carousel_speed', 0.85),
            'pause_on_hover' => filter_var(Setting::getVal('category_carousel_pause_on_hover', 'true'), FILTER_VALIDATE_BOOLEAN),
            'show_arrows' => filter_var(Setting::getVal('category_carousel_show_arrows', 'true'), FILTER_VALIDATE_BOOLEAN),
            'show_bottom_hint' => filter_var(Setting::getVal('category_carousel_show_hint', 'true'), FILTER_VALIDATE_BOOLEAN),
            'bottom_hint' => Setting::getVal('category_carousel_hint_text', 'Click any category circle to browse full catalog'),
        ];

        return response()->json([
            'success' => true,
            'data' => $categoryImages,
            'settings' => $settings,
        ]);
    }

    // Countries for "Gift Cake From Abroad" carousel
    public function countries()
    {
        $countries = Country::where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $countries,
        ]);
    }

    // Policies
    public function policy($slug)
    {
        $policy = Policy::where('slug', $slug)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $policy,
        ]);
    }

    // About Us content
    public function aboutUs()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'title' => 'The Story of Ammas Pastries',
                'tagline' => 'Crafting Fresh Smiles and Sweet Moments Since 2005',
                'story' => 'Ammas Pastries began with a humble dream: to bake cakes that taste just like home-made love, using only wholesome dairy ingredients, zero preservatives, and uncompromised craftsmanship. Over the years, we have grown into one of Bengaluru’s most beloved artisan bakeries, serving thousands of celebrations each week.',
                'kitchen_standards' => [
                    '100% Pure Dairy Fresh Cream with Zero Vegetable Shortening',
                    'Finest Belgian Couverture Chocolates and Dutch Cocoa',
                    'Farm-fresh Seasonal Fruits Delivered Every Morning',
                    'Stringent 5-Star Kitchen Sanitation & Hygiene Protocols',
                    'Dedicated 100% Pure Vegetarian / Eggless Baking Lines',
                ],
                'stats' => [
                    ['value' => '500,000+', 'label' => 'Celebrations Sweetened'],
                    ['value' => '45 Mins', 'label' => 'Average Delivery Time'],
                    ['value' => '4.9 ★', 'label' => 'Google Customer Rating'],
                    ['value' => '15+', 'label' => 'Bengaluru Outlets'],
                ]
            ]
        ]);
    }

    // Contact info
    public function contactInfo()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'phone' => Setting::getVal('contact_phone', '+91 80 4567 8900'),
                'email' => Setting::getVal('contact_email', 'mkumar200418@gmail.com'),
                'address' => Setting::getVal('contact_address', 'Ammas Pastries Central Kitchen, MG Road, Bengaluru, Karnataka 560001'),
                'hours' => 'Monday - Sunday: 10:00 AM - 10:00 PM',
            ]
        ]);
    }

    // Validate Coupon
    public function validateCoupon(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))->first();

        if (!$coupon || !$coupon->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired coupon code.',
            ], 404);
        }

        if ($coupon->min_order_amount > 0 && $validated['subtotal'] < $coupon->min_order_amount) {
            return response()->json([
                'success' => false,
                'message' => "This coupon requires a minimum cart subtotal of ₹{$coupon->min_order_amount}.",
            ], 422);
        }

        $discount = $coupon->calculateDiscount($validated['subtotal']);

        return response()->json([
            'success' => true,
            'message' => "Coupon '{$coupon->code}' applied successfully!",
            'data' => [
                'code' => $coupon->code,
                'discount' => $discount,
                'description' => $coupon->description,
            ]
        ]);
    }

    // Google Geocoding Proxy Fallback
    public function geocode(Request $request)
    {
        $address = $request->query('address');
        $latlng = $request->query('latlng');
        $apiKey = env('GOOGLE_GEOCODING_API_KEY', '***REMOVED_GOOGLE_API_KEY***');

        $params = ['key' => $apiKey];
        if ($address) {
            $params['address'] = $address;
            $params['components'] = 'country:IN';
        } elseif ($latlng) {
            $params['latlng'] = $latlng;
        } else {
            return response()->json(['success' => false, 'message' => 'address or latlng required'], 422);
        }

        try {
            $res = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(10)->get('https://maps.googleapis.com/maps/api/geocode/json', $params);
            return response()->json($res->json(), $res->status());
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
