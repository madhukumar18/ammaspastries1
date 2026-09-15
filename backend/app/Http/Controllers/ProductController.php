<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\DreamCake;
use App\Models\GiftingProduct;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'subcategory', 'variants', 'images'])
            ->where('is_available', true);

        // Filter by category slug
        if ($request->filled('category')) {
            $catSlug = $request->input('category');
            $query->whereHas('category', function ($q) use ($catSlug) {
                $q->where('slug', $catSlug);
            });
        }

        // Filter by subcategory slug
        if ($request->filled('subcategory') || $request->filled('sub')) {
            $subSlug = $request->input('subcategory') ?: $request->input('sub');
            $query->whereHas('subcategory', function ($q) use ($subSlug) {
                $q->where('slug', $subSlug);
            });
        }

        // Filter by diet / eggless (all, eggless, egg)
        if ($request->filled('diet')) {
            $diet = strtolower($request->input('diet'));
            if ($diet === 'eggless') {
                $query->where('is_eggless', true);
            } elseif ($diet === 'egg') {
                $query->where('is_eggless', false);
            }
            // 'all' leaves the query unrestricted to show both eggless and with-egg cakes
        } elseif ($request->filled('eggless') && $request->input('eggless') !== 'all') {
            $isEggless = filter_var($request->input('eggless'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_eggless', $isEggless);
        }

        // Filter by new arrival
        if ($request->has('new_arrival')) {
            $query->where('is_new_arrival', true);
        }

        // Filter by popular
        if ($request->has('popular')) {
            $query->where('is_popular', true);
        }

        // Filter by gifting
        if ($request->has('gifting')) {
            $query->where('is_gifting', true);
        }

        // Search query
        if ($request->filled('search') || $request->filled('q')) {
            $searchTerm = $request->input('search') ?: $request->input('q');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhere('short_description', 'like', "%{$searchTerm}%")
                  ->orWhere('sku', 'like', "%{$searchTerm}%")
                  ->orWhereHas('category', function ($catQ) use ($searchTerm) {
                      $catQ->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // Sorting
        $sort = $request->input('sort', 'popular');
        switch ($sort) {
            case 'price_low_high':
                $query->orderBy('base_price', 'asc');
                break;
            case 'price_high_low':
                $query->orderBy('base_price', 'desc');
                break;
            case 'newest':
                $query->orderBy('id', 'desc');
                break;
            default:
                $query->orderBy('is_popular', 'desc')->orderBy('is_featured', 'desc')->orderBy('id', 'asc');
                break;
        }

        $perPage = min((int) $request->input('per_page', 12), 48);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
            ]
        ]);
    }

    public function show($slug)
    {
        $product = Product::with([
            'category',
            'subcategory',
            'variants' => function ($q) {
                $q->where('is_available', true)->orderBy('price', 'asc');
            },
            'images',
            'approvedReviews' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }
        ])
        ->where('slug', $slug)
        ->where('is_available', true)
        ->firstOrFail();

        // Related products in same category with full variants and category details
        $related = Product::with(['category', 'variants', 'images'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_available', true)
            ->limit(12)
            ->get();

        // If fewer than 6 related items in same category, supplement with other popular products
        if ($related->count() < 6) {
            $existingIds = $related->pluck('id')->push($product->id)->all();
            $supplements = Product::with(['category', 'variants', 'images'])
                ->whereNotIn('id', $existingIds)
                ->where('is_available', true)
                ->orderBy('is_popular', 'desc')
                ->limit(12 - $related->count())
                ->get();
            $related = $related->concat($supplements);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'related' => $related,
            ]
        ]);
    }

    // Live global search endpoint
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        if (strlen($query) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $limit = min((int) $request->input('limit', 6), 20);

        $results = Product::with(['category'])
            ->where('is_available', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('short_description', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhereHas('category', function ($catQ) use ($query) {
                      $catQ->where('name', 'like', "%{$query}%");
                  });
            })
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    // Gifting products for homepage carousel
    public function gifting()
    {
        $items = GiftingProduct::with(['product.variants', 'product.category'])
            ->where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->get()
            ->pluck('product')
            ->filter();

        return response()->json([
            'success' => true,
            'data' => $items->values(),
        ]);
    }

    // Dream cake for homepage highlight
    public function dreamCake()
    {
        $dream = DreamCake::with(['product.variants', 'product.images'])
            ->where('is_active', true)
            ->first();

        return response()->json([
            'success' => true,
            'data' => $dream,
        ]);
    }

    // New arrivals
    public function newArrivals()
    {
        $products = Product::with(['category', 'variants'])
            ->where('is_available', true)
            ->where('is_new_arrival', true)
            ->orderBy('id', 'desc')
            ->limit(8)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    // Most popular
    public function mostPopular()
    {
        $products = Product::with(['category', 'variants'])
            ->where('is_available', true)
            ->where('is_popular', true)
            ->orderBy('id', 'asc')
            ->limit(8)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }
}
