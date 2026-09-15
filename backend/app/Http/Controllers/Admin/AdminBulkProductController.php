<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\ProductVariant;
use App\Models\ProductImage;

class AdminBulkProductController extends Controller
{
    /**
     * Export all products across the website to a CSV file.
     */
    public function exportCsv()
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Ammas_Pastries_Products_Export_' . date('Ymd_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'ID',
            'SKU',
            'Name',
            'Slug',
            'Category',
            'Subcategory',
            'Base Price',
            'Discount Price',
            'Weight',
            'Is Eggless',
            'Stock',
            'Is Available',
            'Is Featured',
            'Is Popular',
            'Is New Arrival',
            'Is Gifting',
            'Image URL',
            'Short Description',
            'Description',
            'Variants',
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, $columns);

            Product::with(['category', 'subcategory', 'variants'])
                ->orderBy('id', 'asc')
                ->chunk(100, function ($products) use ($file) {
                    foreach ($products as $p) {
                        // Format variants as "size:price:discount|size:price:discount"
                        $variantStrings = [];
                        foreach ($p->variants as $v) {
                            $vStr = $v->size_weight . ':' . $v->price;
                            if ($v->discount_price !== null && $v->discount_price !== '') {
                                $vStr .= ':' . $v->discount_price;
                            }
                            $variantStrings[] = $vStr;
                        }
                        $variantsFormatted = implode('|', $variantStrings);

                        fputcsv($file, [
                            $p->id,
                            $p->sku,
                            $p->name,
                            $p->slug,
                            $p->category ? $p->category->name : '',
                            $p->subcategory ? $p->subcategory->name : '',
                            $p->base_price,
                            $p->discount_price ?: '',
                            $p->weight ?: '',
                            $p->is_eggless ? 'yes' : 'no',
                            $p->stock,
                            $p->is_available ? 'yes' : 'no',
                            $p->is_featured ? 'yes' : 'no',
                            $p->is_popular ? 'yes' : 'no',
                            $p->is_new_arrival ? 'yes' : 'no',
                            $p->is_gifting ? 'yes' : 'no',
                            $p->image_url ?: '',
                            $p->short_description ?: '',
                            $p->description ?: '',
                            $variantsFormatted,
                        ]);
                    }
                });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Download a blank or sample CSV template for bulk product import.
     */
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Ammas_Pastries_Products_Bulk_Template.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'ID',
            'SKU',
            'Name',
            'Slug',
            'Category',
            'Subcategory',
            'Base Price',
            'Discount Price',
            'Weight',
            'Is Eggless',
            'Stock',
            'Is Available',
            'Is Featured',
            'Is Popular',
            'Is New Arrival',
            'Is Gifting',
            'Image URL',
            'Short Description',
            'Description',
            'Variants',
        ];

        $sampleRows = [
            [
                '', // Leave empty for new product, or put ID to update
                'AMP-BLU-01',
                'Blueberry Velveteen Cake',
                'blueberry-velveteen-cake',
                'Cakes & Pastries',
                'Premium Cakes',
                '649',
                '599',
                '500g',
                'yes',
                '30',
                'yes',
                'yes',
                'yes',
                'yes',
                'yes',
                'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'Luscious fresh wild blueberry compote with soft cream cheese sponge.',
                'Artisan layered cake infused with Canadian wild blueberries, silky fresh cream, and tender sponge.',
                '500g:599:549|1kg:1099:999|2kg:2099:1899',
            ],
            [
                '',
                'THM-CAR-01',
                'Vintage Car Racer Theme Cake',
                'vintage-car-racer-theme-cake',
                'Theme Cakes',
                '', // Theme cakes has no subcategories
                '1599',
                '1449',
                '1.5kg',
                'yes',
                '20',
                'yes',
                'yes',
                'no',
                'yes',
                'no',
                'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
                'Custom 3D race car theme cake with checkered flags and chocolate asphalt road.',
                'Rev up birthday excitement with our handcrafted vintage racer car cake sculpted in rich chocolate mud sponge.',
                '1.5kg:1449:1399|2.0kg:1999:1899|3.0kg:2899:2749',
            ],
        ];

        $callback = function () use ($columns, $sampleRows) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, $columns);
            foreach ($sampleRows as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import and bulk update products from an uploaded CSV file.
     */
    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if (!$handle) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to read the uploaded CSV file.',
            ], 400);
        }

        // Read and strip BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'The uploaded CSV file is empty.',
            ], 400);
        }

        // Map column indices
        $columnMap = [];
        foreach ($header as $idx => $colName) {
            $normalized = strtolower(trim(preg_replace('/[^a-zA-Z0-9_]/', '', $colName)));
            $columnMap[$normalized] = $idx;
        }

        $createdCount = 0;
        $updatedCount = 0;
        $errors = [];
        $lineNum = 1;

        // Cache all categories and subcategories to avoid repeated DB lookups
        $categories = Category::with('subcategories')->get();

        while (($row = fgetcsv($handle)) !== false) {
            $lineNum++;

            // Skip empty rows
            if (empty(array_filter($row, fn($val) => trim($val) !== ''))) {
                continue;
            }

            $get = function ($key) use ($row, $columnMap) {
                $k = strtolower(str_replace([' ', '_', '-'], '', $key));
                if (isset($columnMap[$k]) && isset($row[$columnMap[$k]])) {
                    return trim($row[$columnMap[$k]]);
                }
                return '';
            };

            $id = $get('id');
            $name = $get('name');
            $sku = $get('sku');
            $slug = $get('slug');
            $categoryName = $get('category');
            $subcategoryName = $get('subcategory');
            $basePrice = $get('baseprice') ?: $get('price');
            $discountPrice = $get('discountprice');
            $weight = $get('weight');
            $isEggless = $this->toBool($get('iseggless'), true);
            $stock = (int) ($get('stock') ?: 50);
            $isAvailable = $this->toBool($get('isavailable'), true);
            $isFeatured = $this->toBool($get('isfeatured'), false);
            $isPopular = $this->toBool($get('ispopular'), false);
            $isNewArrival = $this->toBool($get('isnewarrival'), false);
            $isGifting = $this->toBool($get('isgifting'), false);
            $imageUrl = $get('imageurl') ?: $get('image');
            $shortDescription = $get('shortdescription');
            $description = $get('description');
            $variantsString = $get('variants');

            if (empty($name)) {
                $errors[] = "Row #{$lineNum}: 'Name' is required.";
                continue;
            }

            // Match Category
            $category = null;
            if (!empty($categoryName)) {
                $cSearch = strtolower($categoryName);
                $category = $categories->first(function ($c) use ($cSearch) {
                    return strtolower($c->slug) === $cSearch || strtolower($c->name) === $cSearch;
                });
            }

            if (!$category) {
                // Default to Cakes & Pastries if none matched or fallback to first
                $category = $categories->firstWhere('slug', 'cakes-pastries') ?: $categories->first();
            }

            // Match Subcategory (optional)
            $subcategory = null;
            if (!empty($subcategoryName) && $category && $category->subcategories->count() > 0) {
                $sSearch = strtolower($subcategoryName);
                $subcategory = $category->subcategories->first(function ($s) use ($sSearch) {
                    return strtolower($s->slug) === $sSearch || strtolower($s->name) === $sSearch;
                });
            }

            // Determine unique slug
            if (empty($slug)) {
                $slug = Str::slug($name);
            }

            // Determine SKU
            if (empty($sku)) {
                $sku = 'AMP-' . strtoupper(Str::random(6));
            }

            // Check if product exists for UPDATE
            $product = null;
            if (!empty($id) && is_numeric($id)) {
                $product = Product::find((int) $id);
            }

            if (!$product && !empty($sku)) {
                $product = Product::where('sku', $sku)->first();
            }

            if (!$product && !empty($slug)) {
                $product = Product::where('slug', $slug)->first();
            }

            $productData = [
                'name' => $name,
                'sku' => $sku,
                'slug' => $slug,
                'category_id' => $category ? $category->id : null,
                'subcategory_id' => $subcategory ? $subcategory->id : null,
                'base_price' => !empty($basePrice) ? (float) $basePrice : 499.00,
                'discount_price' => !empty($discountPrice) ? (float) $discountPrice : null,
                'weight' => $weight ?: '500g',
                'is_eggless' => $isEggless,
                'stock' => $stock,
                'is_available' => $isAvailable,
                'is_featured' => $isFeatured,
                'is_popular' => $isPopular,
                'is_new_arrival' => $isNewArrival,
                'is_gifting' => $isGifting,
                'image_url' => $imageUrl ?: null,
                'short_description' => $shortDescription ?: null,
                'description' => $description ?: null,
            ];

            try {
                if ($product) {
                    $product->update($productData);
                    $updatedCount++;
                } else {
                    $product = Product::create($productData);
                    $createdCount++;
                }

                // Update primary image if provided
                if (!empty($imageUrl)) {
                    ProductImage::updateOrCreate(
                        ['product_id' => $product->id, 'is_primary' => true],
                        ['image_url' => $imageUrl, 'display_order' => 1]
                    );
                }

                // Synchronize variants if provided
                if (!empty($variantsString)) {
                    $variantParts = explode('|', $variantsString);
                    foreach ($variantParts as $vPart) {
                        $vItems = explode(':', trim($vPart));
                        $size = trim($vItems[0] ?? '');
                        $vPrice = isset($vItems[1]) && is_numeric(trim($vItems[1])) ? (float) trim($vItems[1]) : $product->base_price;
                        $vDiscount = isset($vItems[2]) && is_numeric(trim($vItems[2])) ? (float) trim($vItems[2]) : null;

                        if (!empty($size)) {
                            ProductVariant::updateOrCreate(
                                [
                                    'product_id' => $product->id,
                                    'size_weight' => $size,
                                ],
                                [
                                    'price' => $vPrice,
                                    'discount_price' => $vDiscount,
                                    'sku' => $product->sku . '-' . str_replace([' ', '(', ')'], '', $size),
                                    'stock' => $product->stock ?: 20,
                                    'is_available' => true,
                                ]
                            );
                        }
                    }
                }
            } catch (\Exception $e) {
                $errors[] = "Row #{$lineNum} ({$name}): " . $e->getMessage();
            }
        }

        fclose($handle);

        return response()->json([
            'success' => true,
            'message' => "Bulk import completed: {$createdCount} products created, {$updatedCount} products updated.",
            'data' => [
                'created_count' => $createdCount,
                'updated_count' => $updatedCount,
                'failed_count' => count($errors),
                'errors' => $errors,
            ],
        ]);
    }

    /**
     * Helper to parse boolean inputs.
     */
    private function toBool($val, $default = false): bool
    {
        if ($val === '' || $val === null) {
            return $default;
        }
        $v = strtolower(trim((string) $val));
        if (in_array($v, ['1', 'true', 'yes', 'y', 'eggless', 'active', 't'])) {
            return true;
        }
        if (in_array($v, ['0', 'false', 'no', 'n', 'inactive', 'f', 'egg'])) {
            return false;
        }
        return $default;
    }
}
