<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\PhotoCakeUpload;
use App\Models\Setting;

class PhotoCakeController extends Controller
{
    /**
     * Parse weight string (e.g. '0.5kg', '500g', '1.5kg') into numerical float in Kilograms.
     */
    public static function parseWeightInKg($weightStr): float
    {
        if (empty($weightStr)) {
            return 0.0;
        }
        $str = strtolower(trim((string) $weightStr));
        if (str_contains($str, 'g') && !str_contains($str, 'kg')) {
            $num = (float) preg_replace('/[^0-9.]/', '', $str);
            return $num / 1000.0;
        }
        return (float) preg_replace('/[^0-9.]/', '', $str);
    }

    /**
     * Sort weights array in ascending numerical order from minimum kg to maximum kg.
     */
    public static function sortWeightsAscending(array $weights): array
    {
        usort($weights, function ($a, $b) {
            $wA = self::parseWeightInKg($a['weight'] ?? '');
            $wB = self::parseWeightInKg($b['weight'] ?? '');
            return $wA <=> $wB;
        });

        foreach ($weights as $idx => &$w) {
            $w['is_min'] = ($idx === 0);
        }

        return array_values($weights);
    }

    /**
     * Default fallback configuration for Photo Cake Studio
     */
    public static function getDefaultConfig(): array
    {
        return [
            'shapes' => [
                [
                    'id' => 'heart',
                    'name' => 'Heart Shaped Cake',
                    'shape' => 'Heart Shape',
                    'tag' => 'Romantic & Celebrations',
                    'icon' => '❤️',
                    'image' => '/images/shapes/heart-cake.jpg',
                    'description' => 'Perfect for Anniversaries, Valentine & Romantic Celebrations',
                    'is_active' => true,
                ],
                [
                    'id' => 'round',
                    'name' => 'Round Shaped Cake',
                    'shape' => 'Round Shape',
                    'tag' => 'Classic Bestseller',
                    'icon' => '⭕',
                    'image' => '/images/shapes/round-cake.jpg',
                    'description' => 'Timeless circular bakery cake with delicate whipped piping',
                    'is_active' => true,
                ],
                [
                    'id' => 'square',
                    'name' => 'Square Shaped Cake',
                    'shape' => 'Square Shape',
                    'tag' => 'Modern & Grand',
                    'icon' => '⬛',
                    'image' => '/images/shapes/square-cake.jpg',
                    'description' => 'Contemporary sleek square cut, maximizes edible photo space',
                    'is_active' => true,
                ],
            ],
            'dietary' => [
                'allow_eggless' => true,
                'allow_egg' => true,
                'default_dietary' => 'eggless',
                'eggless_label' => '100% Pure Eggless',
                'egg_label' => 'With Egg (Classic Bakery)',
                'eggless_surcharge' => 0,
            ],
            'flavours' => [
                [
                    'id' => 'dutch-chocolate-truffle',
                    'name' => 'Dutch Chocolate Truffle',
                    'description' => 'Rich Belgian dark chocolate ganache with moist cocoa sponge',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'min_order_weight' => '0.5kg (500g)',
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 649, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 1149, 'is_min' => false],
                        ['weight' => '1.5kg', 'price' => 1599, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 2099, 'is_min' => false],
                        ['weight' => '3.0kg', 'price' => 2999, 'is_min' => false],
                    ],
                ],
                [
                    'id' => 'black-forest',
                    'name' => 'Black Forest with Red Cherries',
                    'description' => 'German chocolate sponge soaked in cherry syrup with sweet cherries',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'min_order_weight' => '0.5kg (500g)',
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 599, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 1099, 'is_min' => false],
                        ['weight' => '1.5kg', 'price' => 1499, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 1999, 'is_min' => false],
                        ['weight' => '3.0kg', 'price' => 2799, 'is_min' => false],
                    ],
                ],
                [
                    'id' => 'fresh-fruit-cream',
                    'name' => 'Seasonal Fresh Fruit Cream',
                    'description' => 'Fresh dairy cream infused with tropical kiwi, pineapple, and strawberries',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'min_order_weight' => '0.5kg (500g)',
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 649, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 1149, 'is_min' => false],
                        ['weight' => '1.5kg', 'price' => 1599, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 2099, 'is_min' => false],
                        ['weight' => '3.0kg', 'price' => 2999, 'is_min' => false],
                    ],
                ],
                [
                    'id' => 'royal-red-velvet',
                    'name' => 'Royal Red Velvet & Cream Cheese',
                    'description' => 'Crimson velvet crumb layered with Philadelphia cream cheese frosting',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'min_order_weight' => '0.5kg (500g)',
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 699, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 1249, 'is_min' => false],
                        ['weight' => '1.5kg', 'price' => 1699, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 2249, 'is_min' => false],
                        ['weight' => '3.0kg', 'price' => 3199, 'is_min' => false],
                    ],
                ],
                [
                    'id' => 'butterscotch-caramel',
                    'name' => 'Butterscotch Caramel Praline',
                    'description' => 'Crunchy caramelized cashew praline with smooth golden butterscotch cream',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'min_order_weight' => '0.5kg (500g)',
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 599, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 1049, 'is_min' => false],
                        ['weight' => '1.5kg', 'price' => 1499, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 1949, 'is_min' => false],
                        ['weight' => '3.0kg', 'price' => 2699, 'is_min' => false],
                    ],
                ],
                [
                    'id' => 'pineapple-delight',
                    'name' => 'Classic Sweet Pineapple Delight',
                    'description' => 'Light vanilla sponge loaded with juicy pineapple chunks and fruit cream',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'min_order_weight' => '0.5kg (500g)',
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 549, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 999, 'is_min' => false],
                        ['weight' => '1.5kg', 'price' => 1399, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 1849, 'is_min' => false],
                        ['weight' => '3.0kg', 'price' => 2599, 'is_min' => false],
                    ],
                ],
            ],
        ];
    }

    /**
     * Public endpoint: Get active Photo Cake configuration for customers
     */
    public function config()
    {
        $defaults = self::getDefaultConfig();

        $shapesRaw = Setting::getVal('photo_cake_shapes');
        $shapes = $shapesRaw ? json_decode($shapesRaw, true) : $defaults['shapes'];
        $activeShapes = array_values(array_filter($shapes, fn($s) => ($s['is_active'] ?? true) === true));

        $dietaryRaw = Setting::getVal('photo_cake_dietary');
        $dietary = $dietaryRaw ? json_decode($dietaryRaw, true) : $defaults['dietary'];

        $flavoursRaw = Setting::getVal('photo_cake_flavours');
        $flavours = $flavoursRaw ? json_decode($flavoursRaw, true) : $defaults['flavours'];
        $activeFlavours = array_values(array_filter($flavours, fn($f) => ($f['is_active'] ?? true) === true));

        // Always sort weights numerically ascending from minimum kg to maximum kg
        $activeFlavours = array_map(function ($f) {
            if (!empty($f['weights']) && is_array($f['weights'])) {
                $f['weights'] = self::sortWeightsAscending($f['weights']);
            }
            if (empty($f['min_order_weight']) && !empty($f['weights'])) {
                $f['min_order_weight'] = $f['weights'][0]['weight'] ?? '0.5kg (500g)';
            }
            return $f;
        }, $activeFlavours);

        return response()->json([
            'success' => true,
            'data' => [
                'shapes' => $activeShapes,
                'dietary' => $dietary,
                'flavours' => $activeFlavours,
            ]
        ]);
    }

    /**
     * Securely upload photo for custom photo cake
     */
    public function upload(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,webp,jpg|max:5120', // max 5MB
        ]);

        $file = $request->file('photo');
        $originalFilename = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $fileSize = $file->getSize();

        // Generate safe unique filename and store in protected storage
        $storedName = 'photocake_' . date('Ymd_His') . '_' . Str::random(16) . '.' . $file->getClientOriginalExtension();
        $storedPath = $file->storeAs('photo_cakes', $storedName);

        $previewToken = Str::random(40);

        $upload = PhotoCakeUpload::create([
            'user_id' => $request->user()?->id,
            'session_id' => $request->input('session_id', $previewToken),
            'original_filename' => $originalFilename,
            'stored_path' => $storedPath,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'preview_token' => $previewToken,
            'uploader_ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully! Preview generated.',
            'data' => [
                'upload_id' => $upload->id,
                'preview_token' => $previewToken,
                'preview_url' => url("/api/photo-cakes/preview/{$previewToken}"),
                'original_filename' => $originalFilename,
            ]
        ]);
    }

    /**
     * Serve preview image to customer using token
     */
    public function preview($token)
    {
        $upload = PhotoCakeUpload::where('preview_token', $token)->firstOrFail();

        if (!Storage::exists($upload->stored_path)) {
            abort(404, 'Uploaded image not found.');
        }

        $fileContent = Storage::get($upload->stored_path);
        return response($fileContent, 200)
            ->header('Content-Type', $upload->mime_type)
            ->header('Cache-Control', 'private, max-age=3600');
    }
}
