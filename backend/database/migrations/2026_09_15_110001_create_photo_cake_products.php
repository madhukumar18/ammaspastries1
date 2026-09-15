<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure category for photo cakes exists
        $catId = DB::table('categories')->where('slug', 'photo-cake')->value('id');
        if (!$catId) {
            $catId = DB::table('categories')->insertGetId([
                'name' => 'Photo Cake Studio',
                'slug' => 'photo-cake',
                'description' => 'Customized photo print cakes in round, heart, and rectangle shapes.',
                'image' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600',
                'display_order' => 99,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $photoProducts = [
            [
                'id' => 9901,
                'category_id' => $catId,
                'name' => 'Custom Heart Shaped Photo Cake',
                'slug' => 'custom-heart-photo-cake',
                'sku' => 'PHOTO-HEART-9901',
                'base_price' => 699,
                'is_available' => true,
                'is_eggless' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 9902,
                'category_id' => $catId,
                'name' => 'Custom Round Shaped Photo Cake',
                'slug' => 'custom-round-photo-cake',
                'sku' => 'PHOTO-ROUND-9902',
                'base_price' => 649,
                'is_available' => true,
                'is_eggless' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 9903,
                'category_id' => $catId,
                'name' => 'Custom Square / Rectangle Photo Cake',
                'slug' => 'custom-square-photo-cake',
                'sku' => 'PHOTO-SQUARE-9903',
                'base_price' => 649,
                'is_available' => true,
                'is_eggless' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($photoProducts as $p) {
            if (!DB::table('products')->where('id', $p['id'])->exists()) {
                DB::table('products')->insert($p);
            }
        }
    }

    public function down(): void
    {
        DB::table('products')->whereIn('id', [9901, 9902, 9903])->delete();
    }
};
