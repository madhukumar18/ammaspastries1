<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index()
    {
        $cacheKey = 'categories:active_tree';

        // Store clean array in cache to prevent PHP object serialization/unserialization issues
        $categories = Cache::remember($cacheKey, 86400, function () {
            return Category::with(['subcategories' => function ($q) {
                $q->where('is_active', true)->orderBy('display_order', 'asc');
            }])
            ->where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->get()
            ->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function show($slug)
    {
        $cacheKey = 'category:slug:' . $slug;

        $category = Cache::remember($cacheKey, 86400, function () use ($slug) {
            return Category::with(['subcategories' => function ($q) {
                $q->where('is_active', true)->orderBy('display_order', 'asc');
            }])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail()
            ->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }
}
