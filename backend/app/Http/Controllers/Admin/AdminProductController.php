<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'subcategory', 'variants', 'images']);

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('sku', 'like', "%{$s}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->has('is_available')) {
            $query->where('is_available', filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_eggless')) {
            $query->where('is_eggless', filter_var($request->input('is_eggless'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $products = $query->orderBy('id', 'desc')->paginate($perPage);

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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'weight' => 'nullable|string|max:50',
            'portion_type' => 'nullable|string|in:weight,portion,both',
            'portion_unit' => 'nullable|string|max:50',
            'portion_step' => 'nullable|string|max:50',
            'piece_price' => 'nullable|numeric|min:0',
            'piece_limit' => 'nullable|integer|min:0',
            'piece_min' => 'nullable|integer|min:1',
            'is_eggless' => 'boolean',
            'stock' => 'integer|min:0',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_popular' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_gifting' => 'boolean',
            'image_url' => 'nullable|string',
            'variants' => 'nullable|array',
            'variants.*.size_weight' => 'required|string',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
        ]);

        $slug = Str::slug($validated['name']);
        // Ensure unique slug
        $count = Product::where('slug', 'like', "{$slug}%")->count();
        if ($count > 0) {
            $slug .= '-' . ($count + 1);
        }
        $validated['slug'] = $slug;

        $variants = $validated['variants'] ?? [];
        unset($validated['variants']);

        $product = Product::create($validated);

        // Add primary image
        if (!empty($product->image_url)) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $product->image_url,
                'is_primary' => true,
                'display_order' => 1,
            ]);
        }

        // Add variants
        if (!empty($variants)) {
            foreach ($variants as $v) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'size_weight' => $v['size_weight'],
                    'price' => $v['price'],
                    'discount_price' => $v['discount_price'] ?? null,
                    'stock' => 50,
                    'is_available' => true,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully!',
            'data' => $product->load(['variants', 'images', 'category']),
        ], 201);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'subcategory', 'variants', 'images'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => "nullable|string|max:100|unique:products,sku,{$id}",
            'category_id' => 'sometimes|required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'base_price' => 'sometimes|required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'weight' => 'nullable|string|max:50',
            'portion_type' => 'nullable|string|in:weight,portion,both',
            'portion_unit' => 'nullable|string|max:50',
            'portion_step' => 'nullable|string|max:50',
            'piece_price' => 'nullable|numeric|min:0',
            'piece_limit' => 'nullable|integer|min:0',
            'piece_min' => 'nullable|integer|min:1',
            'is_eggless' => 'boolean',
            'stock' => 'integer|min:0',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_popular' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_gifting' => 'boolean',
            'image_url' => 'nullable|string',
            'variants' => 'nullable|array',
        ]);

        $variants = $validated['variants'] ?? null;
        unset($validated['variants']);

        $product->update($validated);

        if ($variants !== null) {
            // Re-sync variants
            $product->variants()->delete();
            foreach ($variants as $v) {
                if (!empty($v['size_weight']) && isset($v['price'])) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'size_weight' => $v['size_weight'],
                        'price' => $v['price'],
                        'discount_price' => $v['discount_price'] ?? null,
                        'stock' => 50,
                        'is_available' => true,
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully!',
            'data' => $product->load(['variants', 'images', 'category']),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }

    // Toggle quick fields (availability, popular, new arrival, gifting)
    public function toggleField(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $field = $request->input('field');

        if (!in_array($field, ['is_available', 'is_popular', 'is_new_arrival', 'is_gifting', 'is_featured'])) {
            return response()->json(['success' => false, 'message' => 'Invalid field'], 400);
        }

        $product->{$field} = !$product->{$field};
        $product->save();

        return response()->json([
            'success' => true,
            'message' => "Updated {$field} status successfully.",
            'data' => [
                'field' => $field,
                'value' => $product->{$field},
            ]
        ]);
    }
}
