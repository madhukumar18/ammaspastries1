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
            'egg_price' => 'nullable|numeric|min:0',
            'eggless_price' => 'nullable|numeric|min:0',
            'flavours' => 'nullable|array',
            'flavours.*.name' => 'nullable|string',
            'flavours.*.egg_price' => 'nullable|numeric|min:0',
            'flavours.*.eggless_price' => 'nullable|numeric|min:0',
            'flavours.*.is_available' => 'nullable|boolean',
            'cupcake_variants' => 'nullable|array',
            'snack_variants' => 'nullable|array',
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

        // Sync snack_variants into base columns if present
        if (!empty($validated['snack_variants']) && is_array($validated['snack_variants'])) {
            $sv = $validated['snack_variants'];
            $pricingType = $sv['pricing_type'] ?? 'piece';
            if ($pricingType === 'piece' && !empty($sv['piece'])) {
                $validated['portion_type'] = 'portion';
                $validated['portion_unit'] = 'pieces';
                if (isset($sv['piece']['eggless_price']) && $sv['piece']['eggless_price'] !== '') {
                    $validated['eggless_price'] = (float) $sv['piece']['eggless_price'];
                    $validated['base_price'] = (float) $sv['piece']['eggless_price'];
                    $validated['piece_price'] = (float) $sv['piece']['eggless_price'];
                }
                if (isset($sv['piece']['egg_price']) && $sv['piece']['egg_price'] !== '') {
                    $validated['egg_price'] = (float) $sv['piece']['egg_price'];
                    if (empty($validated['base_price'])) {
                        $validated['base_price'] = (float) $sv['piece']['egg_price'];
                        $validated['piece_price'] = (float) $sv['piece']['egg_price'];
                    }
                }
            } elseif ($pricingType === 'weight' && !empty($sv['weight'])) {
                $validated['portion_type'] = 'weight';
                $validated['portion_unit'] = $sv['weight']['unit'] ?? 'grams';
                $validated['weight'] = $sv['weight']['value'] ?? '500g';
                if (isset($sv['weight']['eggless_price']) && $sv['weight']['eggless_price'] !== '') {
                    $validated['eggless_price'] = (float) $sv['weight']['eggless_price'];
                    $validated['base_price'] = (float) $sv['weight']['eggless_price'];
                }
                if (isset($sv['weight']['egg_price']) && $sv['weight']['egg_price'] !== '') {
                    $validated['egg_price'] = (float) $sv['weight']['egg_price'];
                    if (empty($validated['base_price'])) {
                        $validated['base_price'] = (float) $sv['weight']['egg_price'];
                    }
                }
            } elseif ($pricingType === 'both') {
                $validated['portion_type'] = 'both';
                if (!empty($sv['weight'])) {
                    $validated['portion_unit'] = $sv['weight']['unit'] ?? 'grams';
                    $validated['weight'] = $sv['weight']['value'] ?? '500g';
                    if (isset($sv['weight']['eggless_price']) && $sv['weight']['eggless_price'] !== '') {
                        $validated['eggless_price'] = (float) $sv['weight']['eggless_price'];
                    }
                    if (isset($sv['weight']['egg_price']) && $sv['weight']['egg_price'] !== '') {
                        $validated['egg_price'] = (float) $sv['weight']['egg_price'];
                    }
                }
                if (!empty($sv['piece'])) {
                    $piecePrice = $sv['piece']['eggless_price'] ?? $sv['piece']['egg_price'] ?? null;
                    if ($piecePrice !== null) {
                        $validated['piece_price'] = (float) $piecePrice;
                    }
                }
                $base = $validated['piece_price'] ?? $validated['eggless_price'] ?? $validated['egg_price'] ?? null;
                if ($base !== null) {
                    $validated['base_price'] = (float) $base;
                }
            }
        }

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

        app(\App\Services\CacheManagerService::class)->clearCatalog();

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
            'egg_price' => 'nullable|numeric|min:0',
            'eggless_price' => 'nullable|numeric|min:0',
            'flavours' => 'nullable|array',
            'flavours.*.name' => 'nullable|string',
            'flavours.*.egg_price' => 'nullable|numeric|min:0',
            'flavours.*.eggless_price' => 'nullable|numeric|min:0',
            'flavours.*.is_available' => 'nullable|boolean',
            'cupcake_variants' => 'nullable|array',
            'snack_variants' => 'nullable|array',
            'variants' => 'nullable|array',
        ]);

        // Sync snack_variants into base columns if present
        if (!empty($validated['snack_variants']) && is_array($validated['snack_variants'])) {
            $sv = $validated['snack_variants'];
            $pricingType = $sv['pricing_type'] ?? 'piece';
            if ($pricingType === 'piece' && !empty($sv['piece'])) {
                $validated['portion_type'] = 'portion';
                $validated['portion_unit'] = 'pieces';
                if (isset($sv['piece']['eggless_price']) && $sv['piece']['eggless_price'] !== '') {
                    $validated['eggless_price'] = (float) $sv['piece']['eggless_price'];
                    $validated['base_price'] = (float) $sv['piece']['eggless_price'];
                    $validated['piece_price'] = (float) $sv['piece']['eggless_price'];
                }
                if (isset($sv['piece']['egg_price']) && $sv['piece']['egg_price'] !== '') {
                    $validated['egg_price'] = (float) $sv['piece']['egg_price'];
                    if (empty($validated['base_price'])) {
                        $validated['base_price'] = (float) $sv['piece']['egg_price'];
                        $validated['piece_price'] = (float) $sv['piece']['egg_price'];
                    }
                }
            } elseif ($pricingType === 'weight' && !empty($sv['weight'])) {
                $validated['portion_type'] = 'weight';
                $validated['portion_unit'] = $sv['weight']['unit'] ?? 'grams';
                $validated['weight'] = $sv['weight']['value'] ?? '500g';
                if (isset($sv['weight']['eggless_price']) && $sv['weight']['eggless_price'] !== '') {
                    $validated['eggless_price'] = (float) $sv['weight']['eggless_price'];
                    $validated['base_price'] = (float) $sv['weight']['eggless_price'];
                }
                if (isset($sv['weight']['egg_price']) && $sv['weight']['egg_price'] !== '') {
                    $validated['egg_price'] = (float) $sv['weight']['egg_price'];
                    if (empty($validated['base_price'])) {
                        $validated['base_price'] = (float) $sv['weight']['egg_price'];
                    }
                }
            } elseif ($pricingType === 'both') {
                $validated['portion_type'] = 'both';
                if (!empty($sv['weight'])) {
                    $validated['portion_unit'] = $sv['weight']['unit'] ?? 'grams';
                    $validated['weight'] = $sv['weight']['value'] ?? '500g';
                    if (isset($sv['weight']['eggless_price']) && $sv['weight']['eggless_price'] !== '') {
                        $validated['eggless_price'] = (float) $sv['weight']['eggless_price'];
                    }
                    if (isset($sv['weight']['egg_price']) && $sv['weight']['egg_price'] !== '') {
                        $validated['egg_price'] = (float) $sv['weight']['egg_price'];
                    }
                }
                if (!empty($sv['piece'])) {
                    $piecePrice = $sv['piece']['eggless_price'] ?? $sv['piece']['egg_price'] ?? null;
                    if ($piecePrice !== null) {
                        $validated['piece_price'] = (float) $piecePrice;
                    }
                }
                $base = $validated['piece_price'] ?? $validated['eggless_price'] ?? $validated['egg_price'] ?? null;
                if ($base !== null) {
                    $validated['base_price'] = (float) $base;
                }
            }
        }

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

        app(\App\Services\CacheManagerService::class)->clearCatalog();

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

        app(\App\Services\CacheManagerService::class)->clearCatalog();

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

        app(\App\Services\CacheManagerService::class)->clearCatalog();

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
