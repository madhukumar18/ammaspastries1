<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\Review;
use App\Models\Product;

class ReviewController extends Controller
{
    // Public reviews list (with stats, filtering, and sorting)
    public function index(Request $request)
    {
        $query = Review::where('is_approved', true)
            ->with(['product:id,name,slug,image_url']);

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->input('rating'));
        }

        $sort = $request->input('sort', 'newest');
        if ($sort === 'highest') {
            $query->orderBy('rating', 'desc')->orderBy('created_at', 'desc');
        } elseif ($sort === 'lowest') {
            $query->orderBy('rating', 'asc')->orderBy('created_at', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Limit or return all
        if ($request->boolean('all')) {
            $reviews = $query->get();
        } else {
            $limit = min((int) $request->input('limit', 50), 100);
            $reviews = $query->limit($limit)->get();
        }

        // Aggregate stats for verified reviews
        $totalCount = Review::where('is_approved', true)->count();
        $avgRating = $totalCount > 0 ? round((float) Review::where('is_approved', true)->avg('rating'), 1) : 5.0;

        $breakdown = [];
        for ($s = 5; $s >= 1; $s--) {
            $breakdown[$s] = Review::where('is_approved', true)->where('rating', $s)->count();
        }

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'stats' => [
                'total' => $totalCount,
                'average_rating' => $avgRating,
                'breakdown' => $breakdown,
            ],
        ]);
    }

    // Customer submit review
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'customer_name' => 'required|string|max:255',
            'customer_location' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:5|max:1000',
        ]);

        $review = Review::create([
            'product_id' => $validated['product_id'] ?? null,
            'user_id' => $request->user()?->id,
            'customer_name' => trim($validated['customer_name']),
            'customer_location' => trim($validated['customer_location'] ?? '') ?: 'Bengaluru',
            'rating' => (int) $validated['rating'],
            'comment' => trim($validated['comment']),
            'is_approved' => true, // Saves and publishes directly to customer website
            'is_featured' => false,
        ]);

        // Invalidate cached product detail and home data so new review appears immediately
        if (!empty($validated['product_id'])) {
            $product = Product::find($validated['product_id']);
            if ($product) {
                Cache::forget('products:show:' . $product->slug);
            }
        }
        Cache::forget('content:home');

        // Load product relation if exists
        $review->load('product:id,name,slug,image_url');

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback! Your review is now published.',
            'data' => $review,
        ], 201);
    }
}
