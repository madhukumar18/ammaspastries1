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
            $catId = $request->input('category_id');
            $query->where(function ($q) use ($catId) {
                $q->where('category_id', $catId)
                  ->orWhereHas('subcategory', function ($sub) use ($catId) {
                      $sub->where('category_id', $catId);
                  });
            });
        }

        if ($request->filled('subcategory_id')) {
            $query->where('subcategory_id', $request->input('subcategory_id'));
        }

        if ($request->filled('stock_status')) {
            if ($request->input('stock_status') === 'in_stock') {
                $query->where('is_available', true);
            } elseif ($request->input('stock_status') === 'out_of_stock') {
                $query->where('is_available', false);
            }
        } elseif ($request->has('is_available')) {
            $query->where('is_available', filter_var($request->input('is_available'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_eggless')) {
            $query->where('is_eggless', filter_var($request->input('is_eggless'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 15;
        }
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
        if (!$request->filled('base_price')) {
            if ($request->filled('piece_price')) {
                $minQty = max(1, (int) $request->input('dessert_min_quantity', 1));
                $request->merge(['base_price' => (float) $request->input('piece_price') * $minQty]);
            } elseif ($request->filled('dessert_default_price')) {
                $request->merge(['base_price' => $request->input('dessert_default_price')]);
            }
        }

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
            'shapes' => 'nullable|array',
            'shapes.*.id' => 'nullable|string',
            'shapes.*.shape' => 'nullable|string',
            'shapes.*.name' => 'nullable|string',
            'shapes.*.price' => 'nullable|numeric|min:0',
            'shapes.*.egg_price' => 'nullable|numeric|min:0',
            'shapes.*.eggless_price' => 'nullable|numeric|min:0',
            'shapes.*.image' => 'nullable|string',
            'shapes.*.is_active' => 'nullable|boolean',
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
            'chocolate_pack_options' => 'nullable|array',
            'chocolate_pack_options.*.weight' => 'required_with:chocolate_pack_options|numeric|min:0.01',
            'chocolate_pack_options.*.unit' => 'required_with:chocolate_pack_options|string|in:g,kg,grams,kilograms',
            'chocolate_pack_options.*.price' => 'required_with:chocolate_pack_options|numeric|min:0.01',
            'chocolate_pricing_type' => 'nullable|string|in:weight,piece,both',
            'sell_by_kg' => 'nullable|boolean',
            'kg_step' => 'nullable|numeric',
            'kg_default' => 'nullable|numeric',
            'kg_max' => 'nullable|numeric',
            'kg_price' => 'nullable|numeric',
            'sell_by_pieces' => 'nullable|boolean',
            'piece_default' => 'nullable|integer',
            'piece_step' => 'nullable|integer',
            'piece_max' => 'nullable|integer',
            'enable_fixed_weight_pricing' => 'nullable|boolean',
            'fixed_weight_options' => 'nullable',
        ]);

        $this->validateCakesAndPastriesSaleOptions($validated);

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
        $isChocolates = ($catId == 5) || ($category && ($category->slug === 'chocolates' || str_contains(strtolower($category->name), 'chocolate')));

        if ($isDessert) {
            $minQty = max(1, (int) ($validated['dessert_min_quantity'] ?? $validated['piece_default'] ?? 1));
            $stepSize = max(1, (int) ($validated['dessert_step_size'] ?? $validated['piece_step'] ?? 1));
            $pieceLimit = max($minQty, (int) ($validated['piece_limit'] ?? $validated['piece_max'] ?? 20));
            $pricePerPiece = isset($validated['piece_price']) && (float) $validated['piece_price'] > 0
                ? (float) $validated['piece_price']
                : (isset($validated['dessert_default_price']) && (float) $validated['dessert_default_price'] > 0
                    ? ((float) $validated['dessert_default_price'] / $minQty)
                    : (float) ($validated['base_price'] ?? 50));

            $validated['dessert_min_quantity'] = $minQty;
            $validated['dessert_step_size'] = $stepSize;
            $validated['piece_min'] = $minQty;
            $validated['piece_default'] = $minQty;
            $validated['piece_step'] = $stepSize;
            $validated['piece_limit'] = $pieceLimit;
            $validated['piece_max'] = $pieceLimit;
            $validated['piece_price'] = $pricePerPiece;
            $validated['dessert_default_price'] = round($pricePerPiece * $minQty, 2);
            $validated['base_price'] = $validated['dessert_default_price'];
            $validated['weight'] = "{$minQty} Pcs";
            $validated['portion_type'] = 'portion';
            $validated['portion_unit'] = 'pieces';
            $validated['portion_step'] = (string) $stepSize;
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

        if ($isChocolates) {
            $pricingType = $validated['chocolate_pricing_type'] ?? 'weight';
            $validated['chocolate_pricing_type'] = $pricingType;

            $hasWeight = ($pricingType === 'weight' || $pricingType === 'both');
            $hasPiece = ($pricingType === 'piece' || $pricingType === 'both');

            $cleanedPacks = [];
            $lowestPackPrice = null;
            $firstPackLabel = null;

            if (!empty($validated['chocolate_pack_options']) && is_array($validated['chocolate_pack_options'])) {
                foreach ($validated['chocolate_pack_options'] as $p) {
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
                        if ($lowestPackPrice === null || $price < $lowestPackPrice) {
                            $lowestPackPrice = $price;
                        }
                        if ($firstPackLabel === null) {
                            $firstPackLabel = $label;
                        }
                    }
                }
            }

            if ($hasWeight && empty($cleanedPacks) && !$hasPiece) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one pack option with weight > 0 and price > 0 is required for Chocolates sold by weight.',
                ], 422);
            }

            $validated['chocolate_pack_options'] = $cleanedPacks;

            if ($hasPiece) {
                $piecePrice = (float) ($validated['piece_price'] ?? $validated['base_price'] ?? 50);
                $validated['piece_price'] = $piecePrice > 0 ? $piecePrice : 50;
                $validated['piece_min'] = 1;
                $validated['piece_step'] = 1;
                $validated['piece_default'] = 1;
                $validated['sell_by_pieces'] = true;
            }

            if ($hasWeight && !empty($cleanedPacks)) {
                $validated['base_price'] = $lowestPackPrice ?? (float) ($validated['base_price'] ?? 100);
                $validated['weight'] = $firstPackLabel ?? 'Pack';
                $validated['portion_type'] = $hasPiece ? 'both' : 'weight';
                $validated['portion_unit'] = 'grams';
            } elseif ($hasPiece) {
                $validated['base_price'] = $validated['piece_price'];
                $validated['weight'] = '1 Pc';
                $validated['portion_type'] = 'portion';
                $validated['portion_unit'] = 'pieces';
            }
        }

        if (array_key_exists('shapes', $validated) && is_array($validated['shapes'])) {
            $normalizedShapes = [];
            foreach ($validated['shapes'] as $s) {
                if (empty($s['shape']) && empty($s['name'])) continue;
                $shapeName = trim($s['name'] ?? $s['shape'] ?? 'Shape');
                $shapeKey = ucfirst(trim($s['shape'] ?? $shapeName));
                $eggPrice = isset($s['egg_price']) && $s['egg_price'] !== '' ? round((float) $s['egg_price'], 2) : (isset($s['price']) && $s['price'] !== '' ? round((float) $s['price'], 2) : 0);
                $egglessPrice = isset($s['eggless_price']) && $s['eggless_price'] !== '' ? round((float) $s['eggless_price'], 2) : (isset($s['price']) && $s['price'] !== '' ? round((float) $s['price'], 2) : 0);

                $normalizedShapes[] = [
                    'id' => !empty($s['id']) ? trim($s['id']) : strtolower(Str::slug($shapeKey . '-' . $shapeName)),
                    'shape' => $shapeKey,
                    'name' => !empty($s['name']) ? trim($s['name']) : ($shapeKey . ' Shape'),
                    'egg_price' => $eggPrice,
                    'eggless_price' => $egglessPrice,
                    'price' => $eggPrice, // backward compatibility
                    'image' => !empty($s['image']) ? trim($s['image']) : null,
                    'is_active' => filter_var($s['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ];
            }
            $validated['shapes'] = $normalizedShapes;
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

        if (!$request->filled('base_price')) {
            if ($request->filled('piece_price')) {
                $minQty = max(1, (int) $request->input('dessert_min_quantity', $product->dessert_min_quantity ?: 1));
                $request->merge(['base_price' => (float) $request->input('piece_price') * $minQty]);
            } elseif ($request->filled('dessert_default_price')) {
                $request->merge(['base_price' => $request->input('dessert_default_price')]);
            }
        }

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
            'shapes' => 'nullable|array',
            'shapes.*.id' => 'nullable|string',
            'shapes.*.shape' => 'nullable|string',
            'shapes.*.name' => 'nullable|string',
            'shapes.*.price' => 'nullable|numeric|min:0',
            'shapes.*.egg_price' => 'nullable|numeric|min:0',
            'shapes.*.eggless_price' => 'nullable|numeric|min:0',
            'shapes.*.image' => 'nullable|string',
            'shapes.*.is_active' => 'nullable|boolean',
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
            'chocolate_pack_options' => 'nullable|array',
            'chocolate_pack_options.*.weight' => 'required_with:chocolate_pack_options|numeric|min:0.01',
            'chocolate_pack_options.*.unit' => 'required_with:chocolate_pack_options|string|in:g,kg,grams,kilograms',
            'chocolate_pack_options.*.price' => 'required_with:chocolate_pack_options|numeric|min:0.01',
            'chocolate_pricing_type' => 'nullable|string|in:weight,piece,both',
            'sell_by_kg' => 'nullable|boolean',
            'kg_step' => 'nullable|numeric',
            'kg_default' => 'nullable|numeric',
            'kg_max' => 'nullable|numeric',
            'kg_price' => 'nullable|numeric',
            'sell_by_pieces' => 'nullable|boolean',
            'piece_default' => 'nullable|integer',
            'piece_step' => 'nullable|integer',
            'piece_max' => 'nullable|integer',
            'enable_fixed_weight_pricing' => 'nullable|boolean',
            'fixed_weight_options' => 'nullable',
        ]);

        $this->validateCakesAndPastriesSaleOptions($validated, $product);

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
        $isChocolates = ($catId == 5) || ($category && ($category->slug === 'chocolates' || str_contains(strtolower($category->name), 'chocolate')));

        if ($isDessert) {
            $minQty = max(1, (int) ($validated['dessert_min_quantity'] ?? $validated['piece_default'] ?? $product->dessert_min_quantity ?? 1));
            $stepSize = max(1, (int) ($validated['dessert_step_size'] ?? $validated['piece_step'] ?? $product->dessert_step_size ?? 1));
            $pieceLimit = max($minQty, (int) ($validated['piece_limit'] ?? $validated['piece_max'] ?? $product->piece_limit ?? 20));
            $pricePerPiece = isset($validated['piece_price']) && (float) $validated['piece_price'] > 0
                ? (float) $validated['piece_price']
                : (isset($validated['dessert_default_price']) && (float) $validated['dessert_default_price'] > 0
                    ? ((float) $validated['dessert_default_price'] / $minQty)
                    : (float) ($validated['base_price'] ?? $product->piece_price ?? 50));

            $validated['dessert_min_quantity'] = $minQty;
            $validated['dessert_step_size'] = $stepSize;
            $validated['piece_min'] = $minQty;
            $validated['piece_default'] = $minQty;
            $validated['piece_step'] = $stepSize;
            $validated['piece_limit'] = $pieceLimit;
            $validated['piece_max'] = $pieceLimit;
            $validated['piece_price'] = $pricePerPiece;
            $validated['dessert_default_price'] = round($pricePerPiece * $minQty, 2);
            $validated['base_price'] = $validated['dessert_default_price'];
            $validated['weight'] = "{$minQty} Pcs";
            $validated['portion_type'] = 'portion';
            $validated['portion_unit'] = 'pieces';
            $validated['portion_step'] = (string) $stepSize;
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

        if ($isChocolates) {
            $pricingType = $validated['chocolate_pricing_type'] ?? $product->chocolate_pricing_type ?? 'weight';
            $validated['chocolate_pricing_type'] = $pricingType;

            $hasWeight = ($pricingType === 'weight' || $pricingType === 'both');
            $hasPiece = ($pricingType === 'piece' || $pricingType === 'both');

            $packsInput = $validated['chocolate_pack_options'] ?? $product->chocolate_pack_options;
            $cleanedPacks = [];
            $lowestPackPrice = null;
            $firstPackLabel = null;

            if (!empty($packsInput) && is_array($packsInput)) {
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
                        if ($lowestPackPrice === null || $price < $lowestPackPrice) {
                            $lowestPackPrice = $price;
                        }
                        if ($firstPackLabel === null) {
                            $firstPackLabel = $label;
                        }
                    }
                }
            }

            if ($hasWeight && empty($cleanedPacks) && !$hasPiece) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one pack option with weight > 0 and price > 0 is required for Chocolates sold by weight.',
                ], 422);
            }

            $validated['chocolate_pack_options'] = $cleanedPacks;

            if ($hasPiece) {
                $piecePrice = (float) ($validated['piece_price'] ?? $product->piece_price ?? $validated['base_price'] ?? 50);
                $validated['piece_price'] = $piecePrice > 0 ? $piecePrice : 50;
                $validated['piece_min'] = 1;
                $validated['piece_step'] = 1;
                $validated['piece_default'] = 1;
                $validated['sell_by_pieces'] = true;
            }

            if ($hasWeight && !empty($cleanedPacks)) {
                $validated['base_price'] = $lowestPackPrice ?? (float) ($validated['base_price'] ?? $product->base_price ?? 100);
                $validated['weight'] = $firstPackLabel ?? $product->weight ?? 'Pack';
                $validated['portion_type'] = $hasPiece ? 'both' : 'weight';
                $validated['portion_unit'] = 'grams';
            } elseif ($hasPiece) {
                $validated['base_price'] = $validated['piece_price'];
                $validated['weight'] = '1 Pc';
                $validated['portion_type'] = 'portion';
                $validated['portion_unit'] = 'pieces';
            }
        }

        if (array_key_exists('shapes', $validated) && is_array($validated['shapes'])) {
            $normalizedShapes = [];
            foreach ($validated['shapes'] as $s) {
                if (empty($s['shape']) && empty($s['name'])) continue;
                $shapeName = trim($s['name'] ?? $s['shape'] ?? 'Shape');
                $shapeKey = ucfirst(trim($s['shape'] ?? $shapeName));
                $eggPrice = isset($s['egg_price']) && $s['egg_price'] !== '' ? round((float) $s['egg_price'], 2) : (isset($s['price']) && $s['price'] !== '' ? round((float) $s['price'], 2) : 0);
                $egglessPrice = isset($s['eggless_price']) && $s['eggless_price'] !== '' ? round((float) $s['eggless_price'], 2) : (isset($s['price']) && $s['price'] !== '' ? round((float) $s['price'], 2) : 0);

                $normalizedShapes[] = [
                    'id' => !empty($s['id']) ? trim($s['id']) : strtolower(Str::slug($shapeKey . '-' . $shapeName)),
                    'shape' => $shapeKey,
                    'name' => !empty($s['name']) ? trim($s['name']) : ($shapeKey . ' Shape'),
                    'egg_price' => $eggPrice,
                    'eggless_price' => $egglessPrice,
                    'price' => $eggPrice, // backward compatibility
                    'image' => !empty($s['image']) ? trim($s['image']) : null,
                    'is_active' => filter_var($s['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ];
            }
            $validated['shapes'] = $normalizedShapes;
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

    /**
     * Validate Cakes & Pastries and Sweets sale options (Sell by kg, Sell by pieces, and Fixed Weight Pricing)
     */
    protected function validateCakesAndPastriesSaleOptions(array &$validated, ?Product $existingProduct = null): void
    {
        $categoryId = $validated['category_id'] ?? $existingProduct?->category_id;
        $category = $categoryId ? \App\Models\Category::find($categoryId) : null;
        $isApplicableCategory = $category && (
            $category->slug === 'cakes-pastries' ||
            str_contains(strtolower($category->name), 'cakes & pastries') ||
            (int) $category->id === 1 ||
            $category->slug === 'sweets' ||
            str_contains(strtolower($category->name), 'sweet') ||
            (int) $category->id === 9
        );

        if (!$isApplicableCategory) {
            return;
        }

        $hasSaleOptionFields = array_key_exists('sell_by_kg', $validated) || array_key_exists('sell_by_pieces', $validated);
        if (!$hasSaleOptionFields) {
            if ($existingProduct) {
                return;
            }
            // For legacy creation without explicit sale option fields, default to sell_by_kg
            $sellByKg = true;
            $sellByPieces = false;
        } else {
            $sellByKg = filter_var($validated['sell_by_kg'] ?? ($existingProduct?->sell_by_kg ?? false), FILTER_VALIDATE_BOOLEAN);
            $sellByPieces = filter_var($validated['sell_by_pieces'] ?? ($existingProduct?->sell_by_pieces ?? false), FILTER_VALIDATE_BOOLEAN);
        }

        if (!$sellByKg && !$sellByPieces) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'sale_options' => ['At least one sale option must be enabled (Sell by kg or Sell by pieces).']
            ]);
        }

        if ($sellByKg) {
            $kgStep = isset($validated['kg_step']) ? (float) $validated['kg_step'] : ($existingProduct?->kg_step ?? 0.5);
            $kgDefault = isset($validated['kg_default']) ? (float) $validated['kg_default'] : ($existingProduct?->kg_default ?? 0.5);
            $kgMax = isset($validated['kg_max']) ? (float) $validated['kg_max'] : ($existingProduct?->kg_max ?? 10.0);
            $kgPrice = isset($validated['kg_price']) && $validated['kg_price'] !== ''
                ? (float) $validated['kg_price']
                : (float) ($existingProduct?->kg_price ?? $validated['base_price'] ?? $existingProduct?->base_price ?? 0);

            if ($kgPrice <= 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'kg_price' => ['Price per kg must be greater than 0.']
                ]);
            }

            if (!in_array($kgStep, [0.5, 1.0, 1])) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'kg_step' => ['Increment step for kg must be 0.5 kg or 1 kg.']
                ]);
            }

            if ($kgDefault <= 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'kg_default' => ['Default kg must be greater than 0.']
                ]);
            }

            if ($kgDefault > $kgMax) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'kg_default' => ['Default kg cannot be greater than maximum kg.']
                ]);
            }

            $stepTimes10 = (int) round($kgStep * 10);
            $defaultTimes10 = (int) round($kgDefault * 10);
            if ($stepTimes10 > 0 && ($defaultTimes10 % $stepTimes10) !== 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'kg_default' => ["Default kg ({$kgDefault}) must be a multiple of the increment step ({$kgStep} kg)."]
                ]);
            }

            $validated['sell_by_kg'] = true;
            $validated['kg_step'] = $kgStep;
            $validated['kg_default'] = $kgDefault;
            $validated['kg_max'] = $kgMax;
            $validated['kg_price'] = $kgPrice;
        } else {
            $validated['sell_by_kg'] = false;
        }

        if ($sellByPieces) {
            $pieceDefault = isset($validated['piece_default']) ? (int) $validated['piece_default'] : ($existingProduct?->piece_default ?? 1);
            $pieceStep = isset($validated['piece_step']) ? (int) $validated['piece_step'] : ($existingProduct?->piece_step ?? 1);
            $pieceMax = isset($validated['piece_max']) ? (int) $validated['piece_max'] : ($existingProduct?->piece_max ?? 20);
            $piecePrice = isset($validated['piece_price']) && $validated['piece_price'] !== ''
                ? (float) $validated['piece_price']
                : (float) ($existingProduct?->piece_price ?? 0);

            if ($piecePrice <= 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'piece_price' => ['Price per piece must be greater than 0.']
                ]);
            }

            if ($pieceStep < 1) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'piece_step' => ['Increment step for pieces must be at least 1.']
                ]);
            }

            if ($pieceDefault < 1) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'piece_default' => ['Default pieces must be at least 1.']
                ]);
            }

            if ($pieceDefault > $pieceMax) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'piece_default' => ['Default pieces cannot be greater than maximum pieces.']
                ]);
            }

            if ($pieceStep > 0 && ($pieceDefault % $pieceStep) !== 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'piece_default' => ["Default pieces ({$pieceDefault}) must be a multiple of the increment step ({$pieceStep})."]
                ]);
            }

            $validated['sell_by_pieces'] = true;
            $validated['piece_default'] = $pieceDefault;
            $validated['piece_step'] = $pieceStep;
            $validated['piece_max'] = $pieceMax;
            $validated['piece_price'] = $piecePrice;
        } else {
            $validated['sell_by_pieces'] = false;
        }

        // Fixed Price by Weight options validation and normalization
        $enableFixed = filter_var($validated['enable_fixed_weight_pricing'] ?? ($existingProduct?->enable_fixed_weight_pricing ?? false), FILTER_VALIDATE_BOOLEAN);

        if ($enableFixed) {
            $rawFixed = $validated['fixed_weight_options'] ?? ($existingProduct?->fixed_weight_options ?? []);
            if (is_string($rawFixed)) {
                $rawFixed = json_decode($rawFixed, true) ?: [];
            }
            $cleanedFixed = [];
            if (is_array($rawFixed)) {
                foreach ($rawFixed as $opt) {
                    $w = trim((string)($opt['weight'] ?? ''));
                    $p = (float)($opt['price'] ?? 0);
                    if ($w !== '' && $p > 0) {
                        $cleanedFixed[] = [
                            'weight' => $w,
                            'price' => round($p, 2),
                        ];
                    }
                }
            }
            if (empty($cleanedFixed)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'fixed_weight_options' => ['At least one valid weight-price option (e.g. 1 kg → ₹500) with price > 0 is required when Fixed Weight Pricing is enabled.']
                ]);
            }
            $validated['enable_fixed_weight_pricing'] = true;
            $validated['fixed_weight_options'] = $cleanedFixed;
        } else {
            $validated['enable_fixed_weight_pricing'] = false;
            $validated['fixed_weight_options'] = $validated['fixed_weight_options'] ?? ($existingProduct?->fixed_weight_options ?? []);
        }
    }
}
