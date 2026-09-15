<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Subcategory;

class AdminCategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with(['subcategories'])->orderBy('display_order', 'asc')->get();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully!',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully!',
            'data' => $category,
        ]);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    // Subcategory operations
    public function storeSubcategory(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'display_order' => 'integer',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $subcategory = Subcategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subcategory created successfully!',
            'data' => $subcategory,
        ], 201);
    }

    public function updateSubcategory(Request $request, $id)
    {
        $subcategory = Subcategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:categories,id',
            'description' => 'nullable|string',
            'display_order' => 'integer',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $subcategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subcategory updated successfully!',
            'data' => $subcategory,
        ]);
    }

    public function destroySubcategory($id)
    {
        $subcategory = Subcategory::findOrFail($id);
        $subcategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subcategory deleted successfully.',
        ]);
    }
}
