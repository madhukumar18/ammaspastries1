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
                'description' => 'Custom artisan 3D designer cakes, cartoon themes, superhero themes, wedding themes, and celebration showstoppers handcrafted for your special moments.',
                'image' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'display_order' => 3,
                'is_active' => true,
            ]
        );

        // 2. Seed Theme Subcategories if none exist
        $subcategoriesData = [
            [
                'name' => 'Cartoon Theme',
                'slug' => 'cartoon-theme',
                'description' => 'Playful character cakes and beloved animated friends for magical celebrations.',
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
                'display_order' => 1,
            ],
            [
                'name' => 'Superhero Theme',
                'slug' => 'superhero-theme',
                'description' => 'Action-packed hero cakes designed for champions and brave birthday stars.',
                'image_url' => 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
                'display_order' => 2,
            ],
            [
                'name' => 'Birthday Theme',
                'slug' => 'birthday-theme',
                'description' => 'Spectacular celebration centerpieces with personalized styling and sparkle.',
                'image_url' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'display_order' => 3,
            ],
            [
                'name' => 'Wedding Theme',
                'slug' => 'wedding-theme',
                'description' => 'Elegant multi-tier designer cakes for weddings, engagements, and anniversaries.',
                'image_url' => 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=700',
                'display_order' => 4,
            ],
        ];

        $subcatMap = [];
        foreach ($subcategoriesData as $subData) {
            $sub = Subcategory::firstOrCreate(
                ['category_id' => $category->id, 'slug' => $subData['slug']],
                [
                    'name' => $subData['name'],
                    'description' => $subData['description'],
                    'image_url' => $subData['image_url'],
                    'display_order' => $subData['display_order'],
                    'is_active' => true,
                ]
            );
            $subcatMap[$subData['slug']] = $sub->id;
        }

        $defaultFlavors = [
            ['id' => 'flv_1', 'name' => 'Chocolate', 'egg_price' => 500, 'eggless_price' => 550, 'is_available' => true],
            ['id' => 'flv_2', 'name' => 'Vanilla', 'egg_price' => 450, 'eggless_price' => 500, 'is_available' => true],
            ['id' => 'flv_3', 'name' => 'Red Velvet', 'egg_price' => 600, 'eggless_price' => 650, 'is_available' => true],
            ['id' => 'flv_4', 'name' => 'Butterscotch', 'egg_price' => 520, 'eggless_price' => 570, 'is_available' => true],
        ];

        // 3. Products under Theme Cakes
        $productsData = [
            [
                'name' => 'Teddy Bear 3D Theme Cake',
                'slug' => 'teddy-bear-3d-theme-cake',
                'sku' => 'THM-TED-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['cartoon-theme'] ?? null,
                'short_description' => 'Adorable handcrafted 3D teddy bear cake sculpted with rich cream and personalized celebration styling.',
                'description' => 'Make birthdays and baby showers unforgettable with our handcrafted Teddy Bear Theme Cake. Sculpted with silky buttercream, premium chocolate sponge, and delicate fondant accents.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
            ],
            [
                'name' => 'Cute Little Teddy Boy Cake',
                'slug' => 'cute-little-teddy-boy-cake',
                'sku' => 'THM-TED-02',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['cartoon-theme'] ?? null,
                'short_description' => 'Sweet pastel blue & cream teddy bear cake with edible cloud accents and festive lettering.',
                'description' => 'Designed especially for baby milestones and first birthdays. Features a smiling handcrafted teddy sitting atop a vanilla-strawberry cloud with edible chocolate buttons.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700',
            ],
            [
                'name' => 'Superhero Thunder Bolt Cake',
                'slug' => 'superhero-thunder-bolt-cake',
                'sku' => 'THM-SPH-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['superhero-theme'] ?? null,
                'short_description' => 'Dynamic comic book superhero themed cake with striking lightning emblem.',
                'description' => 'Unleash superhero power! Handcrafted with rich Belgian chocolate and dynamic edible shields.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
            ],
            [
                'name' => 'Royal Golden Celebration Theme Cake',
                'slug' => 'royal-golden-celebration-cake',
                'sku' => 'THM-BDY-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['birthday-theme'] ?? null,
                'short_description' => 'Opulent gold foil dusted cake crafted for landmark birthday celebrations.',
                'description' => 'Celebrate your milestone year in sheer luxury with gold leaf, chocolate crown toppers, and artisanal buttercream.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=700',
            ],
            [
                'name' => 'Botanical Floral Elegance Wedding Cake',
                'slug' => 'botanical-floral-wedding-cake',
                'sku' => 'THM-WED-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['wedding-theme'] ?? null,
                'short_description' => 'Stunning multi-tiered cake adorned with handcrafted sugar roses and pearls.',
                'description' => 'Designed for fairytale weddings and receptions. Delicately hand-piped with edible pearl luster and cascading botanical blooms.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '2.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
            ],
            [
                'name' => 'Jungle Safari Animals Theme Cake',
                'slug' => 'jungle-safari-animals-theme-cake',
                'sku' => 'THM-SAF-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['cartoon-theme'] ?? null,
                'short_description' => 'Exciting wildlife jungle theme cake with handcrafted lion, giraffe, and elephant accents.',
                'description' => 'A wild adventure in every slice! Layered with rich Dutch truffle chocolate and dressed in vibrant edible jungle greenery with cute animal figurines.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700',
            ],
            [
                'name' => 'Princess Royal Castle Theme Cake',
                'slug' => 'princess-royal-castle-theme-cake',
                'sku' => 'THM-PRN-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['wedding-theme'] ?? null,
                'short_description' => 'Fairytale princess castle cake with pastel pink towers, golden crowns, and edible sparkles.',
                'description' => 'Fit for royalty! Baked with luscious red velvet sponge and delicate cream cheese frosting, finished with enchanted castle spires and shimmering edible pearls.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.5kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => false,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=700',
            ],
            [
                'name' => 'Superhero Action Comic Theme Cake',
                'slug' => 'superhero-action-comic-theme-cake',
                'sku' => 'THM-SPH-03',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['superhero-theme'] ?? null,
                'short_description' => 'Dynamic heroic action cake with comic bursts, shield emblem, and bold celebratory colors.',
                'description' => 'Unleash superhero excitement! Made with decadent dark chocolate and crisp praline crunch, styled with iconic superhero emblems and explosive comic lettering.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => false,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700',
            ],
            [
                'name' => 'Golden 1st Birthday Milestone Theme Cake',
                'slug' => 'golden-1st-birthday-milestone-theme-cake',
                'sku' => 'THM-MLS-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['birthday-theme'] ?? null,
                'short_description' => 'Grand celebration number one cake styled with golden macaron pearls, white truffle, and chocolate stars.',
                'description' => 'Celebrate your little one’s very first milestone in grand style! Baked with delicate Madagascar vanilla layers, whipped white chocolate truffle, and crowned with shimmering golden macarons and edible star toppers.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.5kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
            ],
            [
                'name' => 'Spider-Man Web Slinger Theme Cake',
                'slug' => 'spiderman-web-slinger-theme-cake',
                'sku' => 'THM-SPH-02',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['superhero-theme'] ?? null,
                'short_description' => 'Red & blue webbed superhero cake featuring spider crest emblem and rich Dutch chocolate truffle sponge.',
                'description' => 'Your friendly neighborhood hero brings action-packed deliciousness to the party! Decadent chocolate truffle filled with crunchy choco crisps and styled with hand-piped web details.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
            ],
            [
                'name' => 'Cocomelon Musical Garden Theme Cake',
                'slug' => 'cocomelon-musical-garden-theme-cake',
                'sku' => 'THM-KID-01',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['cartoon-theme'] ?? null,
                'short_description' => 'Bright green watermelon TV themed cake with cute ladybug and rainbow musical notes.',
                'description' => 'Toddlers’ favorite sensation turned into sweet confectionery joy! Vanilla berry cream sponge topped with handcrafted edible fondant watermelon antenna and cheerful music notes.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700',
            ],
            [
                'name' => 'Baby Panda Bamboo Forest Theme Cake',
                'slug' => 'baby-panda-bamboo-forest-theme-cake',
                'sku' => 'THM-TED-03',
                'category_id' => $category->id,
                'subcategory_id' => $subcatMap['cartoon-theme'] ?? null,
                'short_description' => 'Charming black & white panda cake with edible green bamboo shoots and sweet vanilla truffle sponge.',
                'description' => 'Irresistibly cute panda character sculpted atop a fresh green meadow cake with handcrafted edible bamboo sticks and white chocolate pearls.',
                'base_price' => 500,
                'discount_price' => 500,
                'egg_price' => 500,
                'eggless_price' => 550,
                'flavours' => $defaultFlavors,
                'weight' => '1.0kg',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700',
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
            if (!empty($product->image_url)) {
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
            }

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
