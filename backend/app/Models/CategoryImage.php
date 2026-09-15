<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryImage extends Model
{
    use HasFactory;

    protected $table = 'category_images';

    protected $fillable = [
        'name',
        'slug',
        'subtitle',
        'image_url',
        'target_url',
        'badge_text',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Default categories from secondary navbar for initial seeding & reset
     */
    public static function getDefaultCategories(): array
    {
        return [
            [
                'name' => 'Cakes & Pastries',
                'slug' => 'cakes-pastries',
                'subtitle' => 'Fresh Cream & Exotic Fruit Delights',
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
                'target_url' => '/category/cakes-pastries',
                'badge_text' => 'Bestseller',
                'display_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Theme Cakes',
                'slug' => 'theme-cakes',
                'subtitle' => 'Handcrafted 3D Designer Showstoppers',
                'image_url' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'target_url' => '/category/theme-cakes',
                'badge_text' => 'Artisan 3D',
                'display_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Photo Cake',
                'slug' => 'photo-cake',
                'subtitle' => 'Edible Sugar Sheet Photo Prints',
                'image_url' => 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
                'target_url' => '/photo-cake',
                'badge_text' => 'Customized',
                'display_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Snacks',
                'slug' => 'snacks',
                'subtitle' => 'Oven-Hot Puffs, Rolls, Buns & Burgers',
                'image_url' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700',
                'target_url' => '/category/snacks',
                'badge_text' => 'Hot & Crisp',
                'display_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Dessert',
                'slug' => 'dessert',
                'subtitle' => 'Cheesecakes, Rich Brownies & Cupcakes',
                'image_url' => 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=700',
                'target_url' => '/category/dessert',
                'badge_text' => 'Indulgence',
                'display_order' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Dry Fruits',
                'slug' => 'dry-fruits',
                'subtitle' => 'Selected Cashews, Almonds & Pistachios',
                'image_url' => 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=700',
                'target_url' => '/category/dry-fruits',
                'badge_text' => 'Healthy',
                'display_order' => 6,
                'is_active' => true,
            ],
            [
                'name' => 'Chocolates',
                'slug' => 'chocolates',
                'subtitle' => 'Velvety Handcrafted Belgian Truffles',
                'image_url' => 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700',
                'target_url' => '/category/chocolates',
                'badge_text' => 'Belgian Cocoa',
                'display_order' => 7,
                'is_active' => true,
            ],
            [
                'name' => 'Sweets',
                'slug' => 'sweets',
                'subtitle' => 'Pure Desi Ghee Mithai & Ladoos',
                'image_url' => 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=700',
                'target_url' => '/category/sweets',
                'badge_text' => 'Pure Ghee',
                'display_order' => 8,
                'is_active' => true,
            ],
            [
                'name' => 'Pastries & Slices',
                'slug' => 'pastries-slices',
                'subtitle' => 'Single-Portion Delights & Mousse Cups',
                'image_url' => 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=700',
                'target_url' => '/category/pastries-slices',
                'badge_text' => 'Single Portion',
                'display_order' => 9,
                'is_active' => true,
            ],
            [
                'name' => 'Party Items',
                'slug' => 'party-items',
                'subtitle' => 'Sparkling Candles, Toppers & Sashes',
                'image_url' => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700',
                'target_url' => '/category/party-items',
                'badge_text' => 'Party Props',
                'display_order' => 10,
                'is_active' => true,
            ],
        ];
    }
}
