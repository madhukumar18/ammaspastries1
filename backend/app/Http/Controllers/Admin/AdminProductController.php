<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\Category;

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
            'theme_cake_default_weight' => 'nullable|numeric|min:0.1',
            'theme_cake_default_price' => 'nullable|numeric|min:1',
            'theme_cake_step_size' => 'nullable|numeric|min:0.1',
            'theme_cake_price_tiers' => 'nullable|array',
            'theme_cake_price_tiers.*.weight' => 'required_with:theme_cake_price_tiers|numeric|min:0.1',
            'theme_cake_price_tiers.*.price' => 'required_with:theme_cake_price_tiers|numeric|min:1',
            'dessert_min_quantity' => 'nullable|integer|min:1',
            'dessert_default_price' => 'nullable|numeric|min:0',
            'dessert_step_size' => 'nullable|integer|min:1',
            'dessert_price_tiers' => 'nullable|array',
            'dessert_price_tiers.*.quantity' => 'required_with:dessert_price_tiers|integer|min:1',
            'dessert_price_tiers.*.price' => 'required_with:dessert_price_tiers|numeric|min:0',
            'dry_fruit_pack_options' => 'nullable|array',
            'dry_fruit_pack_options.*.weight' => 'required_with:dry_fruit_pack_options|numeric|min:0.01',
            'dry_fruit_pack_options.*.unit' => 'required_with:dry_fruit_pack_options|string|in:g,kg,grams,kilograms',
            'dry_fruit_pack_options.*.price' => 'required_with:dry_fruit_pack_options|numeric|min:0.01',
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
                }
                if (!empty($sv['piece'])) {
                    if (isset($sv['piece']['eggless_price']) && $sv['piece']['eggless_price'] !== '') {
                        $validated['piece_price'] = (float) $sv['piece']['eggless_price'];
                        $validated['piece_min'] = 1;
                        $validated['piece_limit'] = 20;
                    } elseif (isset($sv['piece']['egg_price']) && $sv['piece']['egg_price'] !== '') {
                        $validated['piece_price'] = (float) $sv['piece']['egg_price'];
                        $validated['piece_min'] = 1;
                        $validated['piece_limit'] = 20;
                    }
                }
                if (!empty($sv['weight'])) {
                    if (isset($sv['weight']['eggless_price']) && $sv['weight']['eggless_price'] !== '') {
                        $validated['base_price'] = (float) $sv['weight']['eggless_price'];
                    } elseif (isset($sv['weight']['egg_price']) && $sv['weight']['egg_price'] !== '') {
                        $validated['base_price'] = (float) $sv['weight']['egg_price'];
                    }
                }
            }
        }

        // Sync theme_cake_default_price into base columns if configured
        if (!empty($validated['theme_cake_default_price']) && !empty($validated['theme_cake_default_weight'])) {
            $validated['base_price'] = (float) $validated['theme_cake_default_price'];
            $validated['weight'] = ((float) $validated['theme_cake_default_weight']) . 'kg';
        }

        // Category-specific validations and synchronizations
        $catId = $validated['category_id'] ?? null;
        $category = $catId ? Category::find($catId) : null;
        $isDessert = ($catId == 3) || ($category && ($category->slug === 'dessert' || str_contains(strtolower($category->name), 'dessert')));
        $isDryFruit = ($catId == 4) || ($category && ($category->slug === 'dry-fruits' || str_contains(strtolower($category->name), 'dry fruit')));

        if ($isDessert) {
            $minQty = max(1, (int) ($validated['dessert_min_quantity'] ?? 1));
            $validated['dessert_min_quantity'] = $minQty;
            $validated['dessert_step_size'] = 1;
            if (isset($validated['dessert_default_price']) && (float) $validated['dessert_default_price'] > 0) {
                $validated['base_price'] = (float) $validated['dessert_default_price'];
            }
            $validated['weight'] = "{$minQty} Pcs";
            $validated['portion_type'] = 'portion';
            $validated['portion_unit'] = 'pieces';
            $validated['portion_step'] = '1';
        }

        if ($isDryFruit) {
            if (empty($validated['dry_fruit_pack_options']) || !is_array($validated['dry_fruit_pack_options'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one pack option with weight, unit (g/kg), and price is required for Dry Fruits.',
                ], 422);
            }

            $cleanedPacks = [];
            $lowestPrice = null;
            $firstLabel = null;
            foreach ($validated['dry_fruit_pack_options'] as $p) {
                $w = (float) ($p['weight'] ?? 0);
                $u = strtolower(trim($p['unit'] ?? 'g'));
                if ($u === 'grams' || $u === 'gram') $u = 'g';
                if ($u === 'kilograms' || $u === 'kilogram') $u = 'kg';
                if (!in_array($u, ['g', 'kg'])) $u = 'g';
                $price = (float) ($p['price'] ?? 0);

                if ($w > 0 && $price > 0) {
                    $label = ($w == (int) $w ? (int) $w : $w) . $u;
                    $cleanedPacks[] = [
                        'weight' => $w,
                        'unit' => $u,
                        'label' => $label,
                        'price' => round($price, 2),
                    ];
                    if ($lowestPrice === null || $price < $lowestPrice) {
                        $lowestPrice = $price;
                    }
                    if ($firstLabel === null) {
                        $firstLabel = $label;
                    }
                }
            }

            if (empty($cleanedPacks)) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one valid pack size with weight > 0 and price > 0 is required for Dry Fruits.',
                ], 422);
            }

            $validated['dry_fruit_pack_options'] = $cleanedPacks;
            $validated['base_price'] = $lowestPrice ?? (float) ($validated['base_price'] ?? 100);
            $validated['weight'] = $firstLabel ?? 'Pack';
            $validated['portion_type'] = 'weight';
            $validated['portion_unit'] = 'grams';
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
            'theme_cake_default_weight' => 'nullable|numeric|min:0.1',
            'theme_cake_default_price' => 'nullable|numeric|min:1',
            'theme_cake_step_size' => 'nullable|numeric|min:0.1',
            'theme_cake_price_tiers' => 'nullable|array',
            'theme_cake_price_tiers.*.weight' => 'required_with:theme_cake_price_tiers|numeric|min:0.1',
            'theme_cake_price_tiers.*.price' => 'required_with:theme_cake_price_tiers|numeric|min:1',
            'dessert_min_quantity' => 'nullable|integer|min:1',
            'dessert_default_price' => 'nullable|numeric|min:0',
            'dessert_step_size' => 'nullable|integer|min:1',
            'dessert_price_tiers' => 'nullable|array',
            'dessert_price_tiers.*.quantity' => 'required_with:dessert_price_tiers|integer|min:1',
            'dessert_price_tiers.*.price' => 'required_with:dessert_price_tiers|numeric|min:0',
            'dry_fruit_pack_options' => 'nullable|array',
            'dry_fruit_pack_options.*.weight' => 'required_with:dry_fruit_pack_options|numeric|min:0.01',
            'dry_fruit_pack_options.*.unit' => 'required_with:dry_fruit_pack_options|string|in:g,kg,grams,kilograms',
            'dry_fruit_pack_options.*.price' => 'required_with:dry_fruit_pack_options|numeric|min:0.01',
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

        // Sync theme_cake_default_price into base columns if configured
        if (!empty($validated['theme_cake_default_price']) && !empty($validated['theme_cake_default_weight'])) {
            $validated['base_price'] = (float) $validated['theme_cake_default_price'];
            $validated['weight'] = ((float) $validated['theme_cake_default_weight']) . 'kg';
        }

        // Sync dessert_default_price and piece-based quantity if configured or category is Dessert
        $catId = $validated['category_id'] ?? $product->category_id;
        $category = $catId ? Category::find($catId) : null;
        $isDessert = ($catId == 3) || ($category && ($category->slug === 'dessert' || str_contains(strtolower($category->name), 'dessert')));
        $isDryFruit = ($catId == 4) || ($category && ($category->slug === 'dry-fruits' || str_contains(strtolower($category->name), 'dry fruit')));

        if ($isDessert) {
            $minQty = max(1, (int) ($validated['dessert_min_quantity'] ?? $product->dessert_min_quantity ?? 1));
            $validated['dessert_min_quantity'] = $minQty;
            $validated['dessert_step_size'] = 1;
            if (isset($validated['dessert_default_price']) && (float) $validated['dessert_default_price'] > 0) {
                $validated['base_price'] = (float) $validated['dessert_default_price'];
            }
            $validated['weight'] = "{$minQty} Pcs";
            $validated['portion_type'] = 'portion';
            $validated['portion_unit'] = 'pieces';
            $validated['portion_step'] = '1';
        }

        if ($isDryFruit) {
            $packsInput = $validated['dry_fruit_pack_options'] ?? $product->dry_fruit_pack_options;
            if (empty($packsInput) || !is_array($packsInput)) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one pack option with weight, unit (g/kg), and price is required for Dry Fruits.',
                ], 422);
            }

            $cleanedPacks = [];
            $lowestPrice = null;
            $firstLabel = null;
            foreach ($packsInput as $p) {
                $w = (float) ($p['weight'] ?? 0);
                $u = strtolower(trim($p['unit'] ?? 'g'));
                if ($u === 'grams' || $u === 'gram') $u = 'g';
                if ($u === 'kilograms' || $u === 'kilogram') $u = 'kg';
                if (!in_array($u, ['g', 'kg'])) $u = 'g';
                $price = (float) ($p['price'] ?? 0);

                if ($w > 0 && $price > 0) {
                    $label = ($w == (int) $w ? (int) $w : $w) . $u;
                    $cleanedPacks[] = [
                        'weight' => $w,
                        'unit' => $u,
                        'label' => $label,
                        'price' => round($price, 2),
                    ];
                    if ($lowestPrice === null || $price < $lowestPrice) {
                        $lowestPrice = $price;
                    }
                    if ($firstLabel === null) {
                        $firstLabel = $label;
                    }
                }
            }

            if (empty($cleanedPacks)) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one valid pack size with weight > 0 and price > 0 is required for Dry Fruits.',
                ], 422);
            }

            $validated['dry_fruit_pack_options'] = $cleanedPacks;
            $validated['base_price'] = $lowestPrice ?? (float) ($validated['base_price'] ?? $product->base_price ?? 100);
            $validated['weight'] = $firstLabel ?? $product->weight ?? 'Pack';
            $validated['portion_type'] = 'weight';
            $validated['portion_unit'] = 'grams';
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
