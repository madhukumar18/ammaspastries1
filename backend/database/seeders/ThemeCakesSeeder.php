<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;

class ThemeCakesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or Find Category: Theme Cakes
        $category = Category::firstOrCreate(
            ['slug' => 'theme-cakes'],
            [
                'name' => 'Theme Cakes',
                'description' => 'Custom artisan 3D designer cakes, teddy bear cakes, cartoon themes, and celebration showstoppers handcrafted for your special moments.',
                'image' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'display_order' => 3,
                'is_active' => true,
            ]
        );

        // 2. Theme Cakes has NO subcategories (customers browse all theme cakes directly)
        Subcategory::where('category_id', $category->id)->delete();

        // 3. Products under Theme Cakes (no subcategories)
        $productsData = [
            [
                'name' => 'Teddy Bear 3D Theme Cake',
                'slug' => 'teddy-bear-3d-theme-cake',
                'sku' => 'THM-TED-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Adorable handcrafted 3D teddy bear cake sculpted with rich cream and personalized celebration styling.',
                'description' => 'Make birthdays and baby showers unforgettable with our handcrafted Teddy Bear Theme Cake. Sculpted with silky buttercream, premium chocolate sponge, and delicate fondant accents. Fully customizable by our master bakers with name and age plaque.',
                'base_price' => 1399,
                'discount_price' => 1249,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1249, 'discount' => 1199],
                    ['size' => '1.5kg', 'price' => 1799, 'discount' => 1699],
                    ['size' => '2.0kg', 'price' => 2299, 'discount' => 2199],
                    ['size' => '3.0kg', 'price' => 3299, 'discount' => 3149],
                ],
            ],
            [
                'name' => 'Cute Little Teddy Boy Cake',
                'slug' => 'cute-little-teddy-boy-cake',
                'sku' => 'THM-TED-02',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Sweet pastel blue & cream teddy bear cake with edible cloud accents and festive lettering.',
                'description' => 'Designed especially for baby milestones and first birthdays. Features a smiling handcrafted teddy sitting atop a vanilla-strawberry cloud with edible chocolate buttons.',
                'base_price' => 1499,
                'discount_price' => 1349,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1349, 'discount' => 1299],
                    ['size' => '1.5kg', 'price' => 1899, 'discount' => 1799],
                    ['size' => '2.0kg', 'price' => 2449, 'discount' => 2349],
                ],
            ],
            [
                'name' => 'Jungle Safari Animals Theme Cake',
                'slug' => 'jungle-safari-animals-theme-cake',
                'sku' => 'THM-SAF-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Exciting wildlife jungle theme cake with handcrafted lion, giraffe, and elephant accents.',
                'description' => 'A wild adventure in every slice! Layered with rich Dutch truffle chocolate and dressed in vibrant edible jungle greenery with cute animal figurines.',
                'base_price' => 1599,
                'discount_price' => 1449,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1449, 'discount' => 1399],
                    ['size' => '1.5kg', 'price' => 1999, 'discount' => 1899],
                    ['size' => '2.0kg', 'price' => 2599, 'discount' => 2449],
                    ['size' => '3.0kg', 'price' => 3699, 'discount' => 3499],
                ],
            ],
            [
                'name' => 'Princess Royal Castle Theme Cake',
                'slug' => 'princess-royal-castle-theme-cake',
                'sku' => 'THM-PRN-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Fairytale princess castle cake with pastel pink towers, golden crowns, and edible sparkles.',
                'description' => 'Fit for royalty! Baked with luscious red velvet sponge and delicate cream cheese frosting, finished with enchanted castle spires and shimmering edible pearls.',
                'base_price' => 1699,
                'discount_price' => 1549,
                'weight' => '1.5kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => false,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=700',
                'variants' => [
                    ['size' => '1.5kg', 'price' => 1549, 'discount' => 1499],
                    ['size' => '2.0kg', 'price' => 2099, 'discount' => 1999],
                    ['size' => '3.0kg', 'price' => 3099, 'discount' => 2949],
                ],
            ],
            [
                'name' => 'Superhero Action Comic Theme Cake',
                'slug' => 'superhero-action-comic-theme-cake',
                'sku' => 'THM-SPH-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Dynamic heroic action cake with comic bursts, shield emblem, and bold celebratory colors.',
                'description' => 'Unleash superhero excitement! Made with decadent dark chocolate and crisp praline crunch, styled with iconic superhero emblems and explosive comic lettering.',
                'base_price' => 1549,
                'discount_price' => 1399,
                'weight' => '1.0kg',
                'is_eggless' => false,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1399, 'discount' => 1349],
                    ['size' => '1.5kg', 'price' => 1949, 'discount' => 1849],
                    ['size' => '2.0kg', 'price' => 2499, 'discount' => 2399],
                ],
            ],
            [
                'name' => 'Unicorn Magic Rainbow Theme Cake',
                'slug' => 'unicorn-magic-rainbow-theme-cake',
                'sku' => 'THM-UNI-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Whimsical unicorn cake with pastel rainbow swirl mane, golden horn, and marshmallow clouds.',
                'description' => 'A magical favorite for kids of all ages. Six vibrant rainbow vanilla sponge layers filled with silky whipped cream and decorated with a gleaming golden unicorn horn.',
                'base_price' => 1449,
                'discount_price' => 1299,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1299, 'discount' => 1249],
                    ['size' => '1.5kg', 'price' => 1849, 'discount' => 1749],
                    ['size' => '2.0kg', 'price' => 2399, 'discount' => 2299],
                    ['size' => '3.0kg', 'price' => 3399, 'discount' => 3249],
                ],
            ],
            [
                'name' => 'Golden 1st Birthday Milestone Theme Cake',
                'slug' => 'golden-1st-birthday-milestone-theme-cake',
                'sku' => 'THM-MLS-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Grand celebration number one cake styled with golden macaron pearls, white truffle, and chocolate stars.',
                'description' => 'Celebrate your little one’s very first milestone in grand style! Baked with delicate Madagascar vanilla layers, whipped white chocolate truffle, and crowned with shimmering golden macarons and edible star toppers.',
                'base_price' => 1699,
                'discount_price' => 1549,
                'weight' => '1.5kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'variants' => [
                    ['size' => '1.5kg', 'price' => 1549, 'discount' => 1499],
                    ['size' => '2.0kg', 'price' => 2099, 'discount' => 1999],
                    ['size' => '3.0kg', 'price' => 3199, 'discount' => 2999],
                ],
            ],
            [
                'name' => 'Silver Jubilee 25th Milestone Number Cake',
                'slug' => 'silver-jubilee-25th-milestone-cake',
                'sku' => 'THM-MLS-02',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Elegant dual-digit 25 number cake adorned with fresh berries, edible silver leaf, and Belgian dark chocolate ganache.',
                'description' => 'Mark a quarter century of love or achievement. Dual cutout digits of rich chocolate mud sponge layered with dark ganache, fresh strawberries, and delicate silver foil.',
                'base_price' => 2199,
                'discount_price' => 1999,
                'weight' => '2.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => false,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
                'variants' => [
                    ['size' => '2.0kg', 'price' => 1999, 'discount' => 1899],
                    ['size' => '3.0kg', 'price' => 2899, 'discount' => 2749],
                ],
            ],
            [
                'name' => 'Spider-Man Web Slinger Theme Cake',
                'slug' => 'spiderman-web-slinger-theme-cake',
                'sku' => 'THM-SPH-02',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Red & blue webbed superhero cake featuring spider crest emblem and rich Dutch chocolate truffle sponge.',
                'description' => 'Your friendly neighborhood hero brings action-packed deliciousness to the party! Decadent chocolate truffle filled with crunchy choco crisps and styled with hand-piped web details.',
                'base_price' => 1499,
                'discount_price' => 1349,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1349, 'discount' => 1299],
                    ['size' => '1.5kg', 'price' => 1899, 'discount' => 1799],
                    ['size' => '2.0kg', 'price' => 2449, 'discount' => 2349],
                ],
            ],
            [
                'name' => 'Cocomelon Musical Garden Theme Cake',
                'slug' => 'cocomelon-musical-garden-theme-cake',
                'sku' => 'THM-KID-01',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Bright green watermelon TV themed cake with cute ladybug and rainbow musical notes.',
                'description' => 'Toddlers’ favorite sensation turned into sweet confectionery joy! Vanilla berry cream sponge topped with handcrafted edible fondant watermelon antenna and cheerful music notes.',
                'base_price' => 1549,
                'discount_price' => 1399,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1399, 'discount' => 1349],
                    ['size' => '1.5kg', 'price' => 1949, 'discount' => 1849],
                    ['size' => '2.0kg', 'price' => 2499, 'discount' => 2399],
                ],
            ],
            [
                'name' => 'Frozen Elsa Winter Wonderland Theme Cake',
                'slug' => 'frozen-elsa-winter-wonderland-theme-cake',
                'sku' => 'THM-PRN-02',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Shimmering icy blue cake with edible crystal sugar shards, white snowflakes, and silver tiara.',
                'description' => 'Let it go into sheer confectionery bliss! Icy turquoise buttercream with glistening sugar glass icicles, white chocolate snowflakes, and blueberry cream layers.',
                'base_price' => 1649,
                'discount_price' => 1499,
                'weight' => '1.5kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=700',
                'variants' => [
                    ['size' => '1.5kg', 'price' => 1499, 'discount' => 1449],
                    ['size' => '2.0kg', 'price' => 2049, 'discount' => 1949],
                    ['size' => '3.0kg', 'price' => 2999, 'discount' => 2849],
                ],
            ],
            [
                'name' => 'Baby Panda Bamboo Forest Theme Cake',
                'slug' => 'baby-panda-bamboo-forest-theme-cake',
                'sku' => 'THM-TED-03',
                'category_id' => $category->id,
                'subcategory_id' => null,
                'short_description' => 'Charming black & white panda cake with edible green bamboo shoots and sweet vanilla truffle sponge.',
                'description' => 'Irresistibly cute panda character sculpted atop a fresh green meadow cake with handcrafted edible bamboo sticks and white chocolate pearls.',
                'base_price' => 1449,
                'discount_price' => 1329,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700',
                'variants' => [
                    ['size' => '1.0kg', 'price' => 1329, 'discount' => 1279],
                    ['size' => '1.5kg', 'price' => 1879, 'discount' => 1779],
                    ['size' => '2.0kg', 'price' => 2429, 'discount' => 2329],
                ],
            ],
        ];

        foreach ($productsData as $pData) {
            $variants = $pData['variants'] ?? [];
            unset($pData['variants']);

            $product = Product::updateOrCreate(
                ['slug' => $pData['slug']],
                $pData
            );

            // Primary Image
            ProductImage::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'is_primary' => true,
                ],
                [
                    'image_url' => $product->image_url,
                    'display_order' => 1,
                ]
            );

            // Variants
            foreach ($variants as $v) {
                ProductVariant::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'size_weight' => $v['size'],
                    ],
                    [
                        'price' => $v['price'],
                        'discount_price' => $v['discount'] ?? null,
                        'sku' => $product->sku . '-' . str_replace([' ', '(', ')'], '', $v['size']),
                        'stock' => 30,
                        'is_available' => true,
                    ]
                );
            }
        }
    }
}
