<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;

class ReviewController extends Controller
{
    // Public approved reviews
    public function index(Request $request)
    {
        $query = Review::where('is_approved', true);

        if ($request->has('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        $reviews = $query->orderBy('rating', 'desc')->orderBy('created_at', 'desc')->limit(20)->get();

        return response()->json([
            'success' => true,
            'data' => $reviews,
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
            'customer_name' => $validated['customer_name'],
            'customer_location' => $validated['customer_location'] ?: 'Bengaluru',
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'is_approved' => false, // Requires admin moderation
            'is_featured' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your review! It will be displayed after brief quality verification.',
            'data' => $review,
        ], 201);
    }
}
