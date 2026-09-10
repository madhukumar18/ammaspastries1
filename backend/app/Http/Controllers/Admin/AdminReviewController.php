<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;

class AdminReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::with(['product'])->orderBy('id', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'pagination' => [
                'total' => $reviews->total(),
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
            ]
        ]);
    }

    public function toggleApproval($id)
    {
        $review = Review::findOrFail($id);
        $review->is_approved = !$review->is_approved;
        $review->save();

        return response()->json([
            'success' => true,
            'message' => $review->is_approved ? 'Review approved and published.' : 'Review hidden from public view.',
            'data' => $review,
        ]);
    }

    public function toggleFeatured($id)
    {
        $review = Review::findOrFail($id);
        $review->is_featured = !$review->is_featured;
        $review->save();

        return response()->json([
            'success' => true,
            'message' => $review->is_featured ? 'Review marked as featured.' : 'Review unmarked from featured.',
            'data' => $review,
        ]);
    }

    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
        ]);
    }
}
