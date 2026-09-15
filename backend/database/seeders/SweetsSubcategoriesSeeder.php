<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Subcategory;

class SweetsSubcategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $category = Category::where('slug', 'sweets')->first();

        if (!$category) {
            $category = Category::create([
                'name' => 'Sweets',
                'slug' => 'sweets',
                'description' => 'Delectable traditional and authentic sweets, festive treats, and mithai crafted with pure ghee and premium ingredients.',
                'image' => 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=600',
                'display_order' => 6,
                'is_active' => true,
            ]);
        }

        $subcategories = [
            [
                'name' => 'Gulab Jamun & Rasgulla',
                'slug' => 'gulab-jamun-rasgulla',
                'description' => 'Soft, warm, syrup-soaked traditional gulab jamuns and delicate spongy rasgullas.',
                'display_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Kaju & Dry Fruit Sweets',
                'slug' => 'kaju-dry-fruit-sweets',
                'description' => 'Rich silver-leafed Kaju Katli, Kaju rolls, and premium pistachio dry fruit bites.',
                'display_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Laddoo & Peda',
                'slug' => 'laddoo-peda',
                'description' => 'Melt-in-mouth Motichoor laddoos, Besan laddoos, and cardamom-infused Mathura pedas.',
                'display_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Ghee Mysore Pak & Halwa',
                'slug' => 'ghee-mysore-pak-halwa',
                'description' => 'Authentic Bengaluru pure desi ghee soft Mysore Pak and rich layered halwas.',
                'display_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Rasmalai & Bengali Sweets',
                'slug' => 'rasmalai-bengali-sweets',
                'description' => 'Chilled saffron-pistachio Rasmalai, Cham Cham, and fresh chenna delicacies.',
                'display_order' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Festive Sweet Gift Boxes',
                'slug' => 'festive-sweet-boxes',
                'description' => 'Elegantly packed assorted traditional sweet hampers perfect for celebrations and gifting.',
                'display_order' => 6,
                'is_active' => true,
            ],
        ];

        foreach ($subcategories as $sub) {
            Subcategory::updateOrCreate(
                [
                    'category_id' => $category->id,
                    'slug' => $sub['slug'],
                ],
                [
                    'name' => $sub['name'],
                    'description' => $sub['description'],
                    'display_order' => $sub['display_order'],
                    'is_active' => $sub['is_active'],
                ]
            );
        }
    }
}
