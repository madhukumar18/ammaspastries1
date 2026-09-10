<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Banner;
use App\Models\Country;
use App\Models\Policy;
use App\Models\Setting;
use App\Models\Coupon;

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
                'email' => Setting::getVal('contact_email', 'care@ammaspastries.in'),
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
}
