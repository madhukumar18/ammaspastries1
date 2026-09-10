<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with(['subcategories' => function ($q) {
            $q->where('is_active', true)->orderBy('display_order', 'asc');
        }])
        ->where('is_active', true)
        ->orderBy('display_order', 'asc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function show($slug)
    {
        $category = Category::with(['subcategories' => function ($q) {
            $q->where('is_active', true)->orderBy('display_order', 'asc');
        }])
        ->where('slug', $slug)
        ->where('is_active', true)
        ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }
}
