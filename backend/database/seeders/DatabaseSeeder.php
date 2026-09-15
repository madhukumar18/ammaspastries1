<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Admin;
use App\Models\Role;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\Banner;
use App\Models\DreamCake;
use App\Models\GiftingProduct;
use App\Models\Country;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Policy;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles & Admin
        $superRole = Role::firstOrCreate(
            ['slug' => 'super_admin'],
            [
                'name' => 'Super Administrator',
                'description' => 'Full access to all operations',
            ]
        );

        // Demo customer
        $demoUser = User::create([
            'name' => 'Rahul Sharma',
            'email' => 'rahul@example.com',
            'phone' => '9876543210',
            'password' => Hash::make('Secret@123'),
            'role' => 'customer',
        ]);

        // 2. Outlets
        $outletsData = [
            [
                'name' => 'Ammas Pastries - MG Road',
                'code' => 'AMP-MGR',
                'address' => 'No. 42, Ground Floor, Brigade Plaza, MG Road',
                'area' => 'MG Road',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560001',
                'phone' => '080-25580011',
                'opening_time' => '10:00 AM',
                'closing_time' => '10:00 PM',
                'is_active' => true,
            ],
            [
                'name' => 'Ammas Pastries - Indiranagar',
                'code' => 'AMP-IND',
                'address' => '784, 100 Feet Road, HAL 2nd Stage, Indiranagar',
                'area' => 'Indiranagar',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560038',
                'phone' => '080-25250022',
                'opening_time' => '10:00 AM',
                'closing_time' => '10:30 PM',
                'is_active' => true,
            ],
            [
                'name' => 'Ammas Pastries - Koramangala',
                'code' => 'AMP-KOR',
                'address' => '135, 5th Block, 80 Feet Road, Koramangala',
                'area' => 'Koramangala',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560095',
                'phone' => '080-25530033',
                'opening_time' => '10:00 AM',
                'closing_time' => '10:30 PM',
                'is_active' => true,
            ],
            [
                'name' => 'Ammas Pastries - Whitefield',
                'code' => 'AMP-WHI',
                'address' => 'Shop 12, Ascendas Park Square Mall, ITPL Main Road',
                'area' => 'Whitefield',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560066',
                'phone' => '080-28450044',
                'opening_time' => '10:00 AM',
                'closing_time' => '10:00 PM',
                'is_active' => true,
            ],
            [
                'name' => 'Ammas Pastries - Jayanagar',
                'code' => 'AMP-JAY',
                'address' => '24, 11th Main, 4th Block, Jayanagar',
                'area' => 'Jayanagar',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'pincode' => '560011',
                'phone' => '080-22440055',
                'opening_time' => '10:00 AM',
                'closing_time' => '10:00 PM',
                'is_active' => true,
            ],
        ];

        $outlets = [];
        foreach ($outletsData as $o) {
            $outlets[] = Outlet::create($o);
        }

        // 3. Categories & Subcategories
        $catCakes = Category::create([
            'name' => 'Cakes & Pastries',
            'slug' => 'cakes-pastries',
            'description' => 'Freshly baked artisanal cakes made with the finest Belgian chocolate, fresh fruits and rich cream.',
            'image' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
            'display_order' => 1,
            'is_active' => true,
        ]);

        $subExotic = Subcategory::create([
            'category_id' => $catCakes->id,
            'name' => 'Exotic Fruitz',
            'slug' => 'exotic-fruitz',
            'display_order' => 1,
        ]);

        $subMousse = Subcategory::create([
            'category_id' => $catCakes->id,
            'name' => 'Mousse & Cheese',
            'slug' => 'mousse-cheese',
            'display_order' => 2,
        ]);

        $subPremium = Subcategory::create([
            'category_id' => $catCakes->id,
            'name' => 'Premium Cakes',
            'slug' => 'premium-cakes',
            'display_order' => 3,
        ]);

        $subRegular = Subcategory::create([
            'category_id' => $catCakes->id,
            'name' => 'Regular Cakes',
            'slug' => 'regular-cakes',
            'display_order' => 4,
        ]);

        $subSpecial = Subcategory::create([
            'category_id' => $catCakes->id,
            'name' => 'Something Special',
            'slug' => 'something-special',
            'display_order' => 5,
        ]);

        // Snacks Category
        $catSnacks = Category::create([
            'name' => 'Snacks',
            'slug' => 'snacks',
            'description' => 'Hot, savory, crunchy bakery snacks prepared fresh every morning.',
            'image' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
            'display_order' => 2,
            'is_active' => true,
        ]);

        $snackSubs = [
            'Breads & Rusk' => 'breads-rusk',
            'Bun' => 'bun',
            'Burger' => 'burger',
            'Cookies' => 'cookies',
            'Croissant' => 'croissant',
            'Croquettes' => 'croquettes',
            'Cutlet' => 'cutlet',
            'Pizza' => 'pizza',
            'Puff' => 'puff',
            'Samosas' => 'samosas',
            'Sandwich' => 'sandwich',
            'Savouries' => 'savouries',
        ];
        $snackSubModels = [];
        $i = 1;
        foreach ($snackSubs as $name => $slug) {
            $snackSubModels[$slug] = Subcategory::create([
                'category_id' => $catSnacks->id,
                'name' => $name,
                'slug' => $slug,
                'display_order' => $i++,
            ]);
        }

        // Desserts Category
        $catDessert = Category::create([
            'name' => 'Dessert',
            'slug' => 'dessert',
            'description' => 'Indulgent sweet treats including decadent brownies, fruit tarts and gourmet cupcakes.',
            'image' => 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600',
            'display_order' => 3,
            'is_active' => true,
        ]);

        $dessertSubs = [
            'Apple Pie' => 'apple-pie',
            'Brownie' => 'brownie',
            'Cup Cakes' => 'cup-cakes',
            'Doughnuts' => 'doughnuts',
            'Dry Cakes' => 'dry-cakes',
        ];
        $dessertSubModels = [];
        $j = 1;
        foreach ($dessertSubs as $name => $slug) {
            $dessertSubModels[$slug] = Subcategory::create([
                'category_id' => $catDessert->id,
                'name' => $name,
                'slug' => $slug,
                'display_order' => $j++,
            ]);
        }

        // Dry Fruits
        $catDryFruits = Category::create([
            'name' => 'Dry Fruits',
            'slug' => 'dry-fruits',
            'description' => 'Premium roasted and salted dry fruits handpicked for your health and celebrations.',
            'image' => 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600',
            'display_order' => 4,
            'is_active' => true,
        ]);

        // Chocolates
        $catChocolates = Category::create([
            'name' => 'Chocolates',
            'slug' => 'chocolates',
            'description' => 'Handcrafted artisan bonbons and rich Belgian cocoa creations.',
            'image' => 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600',
            'display_order' => 5,
            'is_active' => true,
        ]);

        $subBonbon = Subcategory::create([
            'category_id' => $catChocolates->id,
            'name' => 'Bonbon',
            'slug' => 'bonbon',
            'display_order' => 1,
        ]);

        // Pastries & Slices
        $catPastries = Category::create([
            'name' => 'Pastries & Slices',
            'slug' => 'pastries-slices',
            'description' => 'Single-serving individual pastry slices for anytime cravings.',
            'image' => 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600',
            'display_order' => 6,
            'is_active' => true,
        ]);

        // Party Items
        $catParty = Category::create([
            'name' => 'Party Items',
            'slug' => 'party-items',
            'description' => 'Candles, party poppers, birthday caps, sparkling fountains and celebration decor.',
            'image' => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600',
            'display_order' => 7,
            'is_active' => true,
        ]);

        // 4. Products & Variants
        $productsData = [
            // Exotic Fruitz
            [
                'name' => 'Mango Fresh Cream Cake',
                'slug' => 'mango-fresh-cream-cake',
                'sku' => 'AMP-MNG-01',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subExotic->id,
                'short_description' => 'Juicy Alphonso mango chunks layered between delicate vanilla sponge and silky fresh cream.',
                'description' => 'Experience the king of fruits in every bite. Made with fresh seasonal Alphonso mango pulp, light sponge, and 100% dairy fresh cream. Perfect for birthday parties and family gatherings.',
                'base_price' => 549,
                'discount_price' => 499,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 499, 'discount' => 450],
                    ['size' => '1kg', 'price' => 949, 'discount' => 899],
                    ['size' => '1.5kg', 'price' => 1399, 'discount' => 1299],
                    ['size' => '2kg', 'price' => 1799, 'discount' => 1699],
                ]
            ],
            [
                'name' => 'Kiwi Strawberry Bliss Cake',
                'slug' => 'kiwi-strawberry-bliss-cake',
                'sku' => 'AMP-KSB-02',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subExotic->id,
                'short_description' => 'Tangy kiwi slices paired with sweet strawberry coulis on a light airy chiffon sponge.',
                'description' => 'A refreshing duo of fresh New Zealand kiwis and handpicked Mahabaleshwar strawberries. Topped with fresh fruit slices and glazed with natural fruit pectin.',
                'base_price' => 599,
                'discount_price' => 549,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => false,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 549, 'discount' => 499],
                    ['size' => '1kg', 'price' => 999, 'discount' => 949],
                    ['size' => '2kg', 'price' => 1899, 'discount' => 1799],
                ]
            ],
            // Mousse & Cheese
            [
                'name' => 'Belgian Dark Chocolate Mousse Cake',
                'slug' => 'belgian-dark-chocolate-mousse-cake',
                'sku' => 'AMP-BDC-03',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subMousse->id,
                'short_description' => 'Velvety smooth 70% dark Belgian chocolate mousse resting on a rich flourless cake base.',
                'description' => 'Pure indulgence for true chocolate lovers. Crafted with authentic Callebaut 70% Belgian dark chocolate, finished with a lustrous chocolate mirror glaze and edible gold flakes.',
                'base_price' => 649,
                'discount_price' => 599,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 599, 'discount' => 549],
                    ['size' => '1kg', 'price' => 1099, 'discount' => 999],
                    ['size' => '1.5kg', 'price' => 1599, 'discount' => 1449],
                    ['size' => '2kg', 'price' => 2099, 'discount' => 1899],
                ]
            ],
            [
                'name' => 'New York Blueberry Baked Cheesecake',
                'slug' => 'new-york-blueberry-baked-cheesecake',
                'sku' => 'AMP-NYB-04',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subMousse->id,
                'short_description' => 'Classic slow-baked Philadelphia cream cheese cake topped with slow-simmered wild blueberry compote.',
                'description' => 'Authentic New York recipe made with Philadelphia cream cheese, graham cracker crust, and topped with generous wild blueberry glaze. Creamy, dense, and heavenly.',
                'base_price' => 749,
                'discount_price' => 699,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 699, 'discount' => 649],
                    ['size' => '1kg', 'price' => 1299, 'discount' => 1199],
                    ['size' => '2kg', 'price' => 2399, 'discount' => 2199],
                ]
            ],
            // Premium Cakes
            [
                'name' => 'Royal Red Velvet Cake with Cream Cheese',
                'slug' => 'royal-red-velvet-cake',
                'sku' => 'AMP-RRV-05',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subPremium->id,
                'short_description' => 'Signature crimson sponge with a hint of cocoa, filled and frosted with tangy cream cheese frosting.',
                'description' => 'An all-time bestseller. Striking deep ruby sponge paired with authentic Madagascar vanilla cream cheese frosting. Celebratory, romantic and unforgettable.',
                'base_price' => 599,
                'discount_price' => 549,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 549, 'discount' => 499],
                    ['size' => '1kg', 'price' => 999, 'discount' => 899],
                    ['size' => '1.5kg', 'price' => 1449, 'discount' => 1349],
                    ['size' => '2kg', 'price' => 1899, 'discount' => 1749],
                ]
            ],
            [
                'name' => 'Signature 5-in-1 Dream Cake',
                'slug' => 'signature-dream-cake',
                'sku' => 'AMP-DRM-06',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subSpecial->id,
                'short_description' => 'Trending 5 layers of moist chocolate mud sponge, silky ganache, dark chocolate mousse, crispy chocolate shell and Dutch cocoa powder.',
                'description' => 'The viral Dream Cake served in our signature golden collectible tin. Five sensational textures in a single scoop. Crack the chocolate top layer and dive into paradise.',
                'base_price' => 799,
                'discount_price' => 749,
                'weight' => '650g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
                'variants' => [
                    ['size' => '650g (Tin Box)', 'price' => 749, 'discount' => 699],
                    ['size' => '1.2kg (Party Box)', 'price' => 1399, 'discount' => 1299],
                ]
            ],
            // Regular Cakes
            [
                'name' => 'Classic Black Forest Celebration Cake',
                'slug' => 'classic-black-forest-cake',
                'sku' => 'AMP-CBF-07',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subRegular->id,
                'short_description' => 'Layers of chocolate sponge soaked in red cherry syrup, whipped cream and Belgian chocolate curls.',
                'description' => 'The timeless celebration favorite. Generously loaded with candied cherries, fresh whipped cream and showered with crisp chocolate shavings.',
                'base_price' => 449,
                'discount_price' => 399,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 399, 'discount' => 369],
                    ['size' => '1kg', 'price' => 749, 'discount' => 699],
                    ['size' => '2kg', 'price' => 1449, 'discount' => 1349],
                ]
            ],
            [
                'name' => 'Butterscotch Crunch Cake',
                'slug' => 'butterscotch-crunch-cake',
                'sku' => 'AMP-BSC-08',
                'category_id' => $catCakes->id,
                'subcategory_id' => $subRegular->id,
                'short_description' => 'Spongy vanilla cake infused with caramelized brown sugar syrup and crunchy butterscotch pralines.',
                'description' => 'Delightful caramelized crunch in every bite. Handcrafted butterscotch sauce and roasted nut pralines make this a family favorite.',
                'base_price' => 449,
                'discount_price' => 399,
                'weight' => '500g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=700',
                'variants' => [
                    ['size' => '500g', 'price' => 399, 'discount' => 369],
                    ['size' => '1kg', 'price' => 749, 'discount' => 699],
                    ['size' => '2kg', 'price' => 1449, 'discount' => 1349],
                ]
            ],
            // Snacks
            [
                'name' => 'Paneer Tikka Puff (Pack of 2)',
                'slug' => 'paneer-tikka-puff',
                'sku' => 'AMP-PTP-09',
                'category_id' => $catSnacks->id,
                'subcategory_id' => $snackSubModels['puff']->id ?? null,
                'short_description' => 'Flaky golden puff pastry stuffed with spiced tandoori cottage cheese and bell peppers.',
                'description' => 'Baked to crispy perfection with 128 layers of golden puff pastry and stuffed with marinated malai paneer.',
                'base_price' => 79,
                'discount_price' => 69,
                'weight' => '180g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=700',
                'variants' => [
                    ['size' => '2 Pcs', 'price' => 69, 'discount' => null],
                    ['size' => '4 Pcs Box', 'price' => 135, 'discount' => 125],
                ]
            ],
            [
                'name' => 'Artisanal Butter Croissant',
                'slug' => 'artisanal-butter-croissant',
                'sku' => 'AMP-ABC-10',
                'category_id' => $catSnacks->id,
                'subcategory_id' => $snackSubModels['croissant']->id ?? null,
                'short_description' => 'French-style laminated pastry made with 100% pure dairy butter for an airy, flaky bite.',
                'description' => 'Golden brown exterior with a delicate honeycomb crumb. Baked fresh every morning using European-style butter.',
                'base_price' => 89,
                'discount_price' => 79,
                'weight' => '90g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => false,
                'is_new_arrival' => true,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=700',
                'variants' => [
                    ['size' => '1 Pc', 'price' => 79, 'discount' => null],
                    ['size' => 'Pack of 3', 'price' => 229, 'discount' => 210],
                ]
            ],
            // Desserts
            [
                'name' => 'Fudge Walnut Brownie',
                'slug' => 'fudge-walnut-brownie',
                'sku' => 'AMP-FWB-11',
                'category_id' => $catDessert->id,
                'subcategory_id' => $dessertSubModels['brownie']->id ?? null,
                'short_description' => 'Gooey center dark chocolate brownie loaded with roasted California walnut chunks.',
                'description' => 'Rich, dense, fudgy and decadent. Warm it in the microwave for 15 seconds and serve with vanilla ice cream for bliss.',
                'base_price' => 99,
                'discount_price' => 89,
                'weight' => '100g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=700',
                'variants' => [
                    ['size' => '1 Pc', 'price' => 89, 'discount' => null],
                    ['size' => 'Box of 4', 'price' => 340, 'discount' => 319],
                ]
            ],
            [
                'name' => 'Assorted Gourmet Cupcakes (Box of 6)',
                'slug' => 'assorted-gourmet-cupcakes',
                'sku' => 'AMP-AGC-12',
                'category_id' => $catDessert->id,
                'subcategory_id' => $dessertSubModels['cup-cakes']->id ?? null,
                'short_description' => 'Box of 6 signature cupcakes: Red Velvet, Dutch Chocolate, Blueberry Swirl, Salted Caramel.',
                'description' => 'Delicately piped swirl frostings on tender cake bases. Makes an enchanting party present or celebratory gift.',
                'base_price' => 399,
                'discount_price' => 349,
                'weight' => '360g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => false,
                'is_new_arrival' => true,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=700',
                'variants' => [
                    ['size' => 'Box of 6', 'price' => 349, 'discount' => null],
                    ['size' => 'Box of 12', 'price' => 649, 'discount' => 599],
                ]
            ],
            // Chocolates
            [
                'name' => 'Artisan Handcrafted Bonbons (Box of 12)',
                'slug' => 'artisan-handcrafted-bonbons',
                'sku' => 'AMP-AHB-13',
                'category_id' => $catChocolates->id,
                'subcategory_id' => $subBonbon->id,
                'short_description' => 'Hand-painted chocolate shells filled with passion fruit ganache, hazelnut praline, and espresso caramel.',
                'description' => 'Miniature works of art. Painted with natural colored cocoa butter and filled with premium ganache.',
                'base_price' => 599,
                'discount_price' => 549,
                'weight' => '200g',
                'is_eggless' => true,
                'is_featured' => true,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=700',
                'variants' => [
                    ['size' => 'Box of 12', 'price' => 549, 'discount' => 499],
                    ['size' => 'Box of 24', 'price' => 999, 'discount' => 899],
                ]
            ],
            // Pastries & Slices
            [
                'name' => 'Dutch Truffle Pastry Slice',
                'slug' => 'dutch-truffle-pastry-slice',
                'sku' => 'AMP-DTP-14',
                'category_id' => $catPastries->id,
                'subcategory_id' => null,
                'short_description' => 'Single-portion slice of rich dark chocolate sponge smothered in silky Dutch truffle ganache.',
                'description' => 'When you crave pure chocolate decadence on a busy afternoon. 100% vegetarian and freshly sliced.',
                'base_price' => 99,
                'discount_price' => 89,
                'weight' => '110g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => true,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=700',
                'variants' => [
                    ['size' => '1 Slice', 'price' => 89, 'discount' => null],
                ]
            ],
            // Dry Fruits
            [
                'name' => 'Royal Roasted Almond & Cashew Gift Box',
                'slug' => 'roasted-almond-cashew-gift-box',
                'sku' => 'AMP-RAC-15',
                'category_id' => $catDryFruits->id,
                'subcategory_id' => null,
                'short_description' => 'Lightly salted slow-roasted California almonds and Jumbo Mangalore cashews in an embossed festive tin.',
                'description' => 'Crisp, aromatic and wholesome. A traditional festive and corporate gifting favorite.',
                'base_price' => 699,
                'discount_price' => 629,
                'weight' => '400g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => false,
                'is_new_arrival' => false,
                'is_gifting' => true,
                'image_url' => 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=700',
                'variants' => [
                    ['size' => '400g Tin', 'price' => 629, 'discount' => null],
                    ['size' => '800g Grand Tin', 'price' => 1199, 'discount' => 1099],
                ]
            ],
            // Party Items
            [
                'name' => 'Sparkling Ice Fountain Birthday Candle (Pack of 2)',
                'slug' => 'sparkling-ice-fountain-candle',
                'sku' => 'AMP-SIC-16',
                'category_id' => $catParty->id,
                'subcategory_id' => null,
                'short_description' => 'Smokeless food-safe silver sparkle cake fountain candle with 45-second duration.',
                'description' => 'Make cake cutting momentous with a shimmering shower of golden sparks. Safe for indoor celebrations.',
                'base_price' => 99,
                'discount_price' => 79,
                'weight' => '50g',
                'is_eggless' => true,
                'is_featured' => false,
                'is_popular' => false,
                'is_new_arrival' => false,
                'is_gifting' => false,
                'image_url' => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700',
                'variants' => [
                    ['size' => 'Pack of 2', 'price' => 79, 'discount' => null],
                ]
            ]
        ];

        $createdProducts = [];
        foreach ($productsData as $pData) {
            $variants = $pData['variants'] ?? [];
            unset($pData['variants']);

            $product = Product::create($pData);
            $createdProducts[$product->slug] = $product;

            // Add primary image
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $product->image_url,
                'is_primary' => true,
                'display_order' => 1,
            ]);

            // Add variants
            foreach ($variants as $v) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'size_weight' => $v['size'],
                    'price' => $v['price'],
                    'discount_price' => $v['discount'] ?? null,
                    'sku' => $product->sku . '-' . str_replace([' ', '(', ')'], '', $v['size']),
                    'stock' => 30,
                    'is_available' => true,
                ]);
            }
        }

        // 5. Banners
        $bannersData = [
            [
                'title' => 'Celebrations Taste Sweeter with Ammas Pastries',
                'subtitle' => 'Handcrafted fresh cakes, decadent desserts and warm baked treats delivered in 45-60 mins.',
                'image_url' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&auto=format&fit=crop&q=80',
                'button_text' => 'Explore Fresh Cakes',
                'button_url' => '/category/cakes-pastries',
                'display_order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Turn Your Favorite Memories Into Delicious Photo Cakes',
                'subtitle' => 'Upload any high-res photo, choose your favorite flavour and receive a pristine edible masterpiece.',
                'image_url' => 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=1600&auto=format&fit=crop&q=80',
                'button_text' => 'Create Photo Cake',
                'button_url' => '/photo-cake',
                'display_order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'The Viral 5-in-1 Belgian Dream Cake',
                'subtitle' => 'Crack through the chocolate shell to discover 5 sinful layers of velvet ganache and dark mousse.',
                'image_url' => 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=1600&auto=format&fit=crop&q=80',
                'button_text' => 'Order Dream Cake',
                'button_url' => '/cakes/signature-dream-cake',
                'display_order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($bannersData as $b) {
            Banner::create($b);
        }

        // 6. Gifting Products
        $giftingSlugs = [
            'mango-fresh-cream-cake',
            'kiwi-strawberry-bliss-cake',
            'belgian-dark-chocolate-mousse-cake',
            'new-york-blueberry-baked-cheesecake',
            'royal-red-velvet-cake',
            'signature-dream-cake',
            'artisan-handcrafted-bonbons',
        ];

        $gIdx = 1;
        foreach ($giftingSlugs as $slug) {
            if (isset($createdProducts[$slug])) {
                GiftingProduct::create([
                    'product_id' => $createdProducts[$slug]->id,
                    'display_order' => $gIdx++,
                    'is_active' => true,
                ]);
            }
        }

        // 7. Dream Cake section
        if (isset($createdProducts['signature-dream-cake'])) {
            DreamCake::create([
                'product_id' => $createdProducts['signature-dream-cake']->id,
                'title' => 'Ammas Signature 5-in-1 Belgian Dream Cake',
                'description' => 'A sensation for your palate. Layer 1: Moist Belgian chocolate sponge. Layer 2: Silky chocolate fudge. Layer 3: Melt-in-mouth dark mousse. Layer 4: Hard crack chocolate disc. Layer 5: Dutch cocoa dusting.',
                'badge' => 'Signature Viral Bestseller',
                'display_order' => 1,
                'is_active' => true,
            ]);
        }

        // 8. Countries for Gift Cake From Abroad section
        $countriesData = [
            ['name' => 'United States', 'code' => 'USA', 'flag_image' => '🇺🇸', 'currency_label' => 'USD ($)', 'display_order' => 1],
            ['name' => 'United Kingdom', 'code' => 'UK', 'flag_image' => '🇬🇧', 'currency_label' => 'GBP (£)', 'display_order' => 2],
            ['name' => 'Canada', 'code' => 'CAN', 'flag_image' => '🇨🇦', 'currency_label' => 'CAD ($)', 'display_order' => 3],
            ['name' => 'Australia', 'code' => 'AUS', 'flag_image' => '🇦🇺', 'currency_label' => 'AUD ($)', 'display_order' => 4],
            ['name' => 'United Arab Emirates', 'code' => 'UAE', 'flag_image' => '🇦🇪', 'currency_label' => 'AED (د.إ)', 'display_order' => 5],
            ['name' => 'Singapore', 'code' => 'SGP', 'flag_image' => '🇸🇬', 'currency_label' => 'SGD ($)', 'display_order' => 6],
            ['name' => 'Germany', 'code' => 'DEU', 'flag_image' => '🇩🇪', 'currency_label' => 'EUR (€)', 'display_order' => 7],
        ];

        foreach ($countriesData as $c) {
            Country::create($c);
        }

        // 9. Approved Reviews
        $reviewsData = [
            [
                'customer_name' => 'Priya Venkatesh',
                'customer_location' => 'Indiranagar, Bengaluru',
                'rating' => 5,
                'comment' => 'Ordered the Royal Red Velvet for my daughter’s 10th birthday. It arrived in exactly 45 minutes, perfectly chilled and looking straight out of a magazine. The cream cheese frosting is genuinely authentic!',
                'is_approved' => true,
                'is_featured' => true,
            ],
            [
                'customer_name' => 'Vikram Malhotra',
                'customer_location' => 'Koramangala, Bengaluru',
                'rating' => 5,
                'comment' => 'The 5-in-1 Dream Cake was the highlight of our anniversary dinner. Cracking that dark chocolate top layer and finding rich chocolate mousse inside was simply blissful.',
                'is_approved' => true,
                'is_featured' => true,
            ],
            [
                'customer_name' => 'Ananya Rao',
                'customer_location' => 'Whitefield, Bengaluru',
                'rating' => 5,
                'comment' => 'I live in California and sent a Photo Cake to my parents in Bangalore. Seamless online payment through Razorpay and delivery was on the dot at 7 PM. My parents were in tears of joy!',
                'is_approved' => true,
                'is_featured' => true,
            ],
            [
                'customer_name' => 'Karthik Subbaraj',
                'customer_location' => 'Jayanagar, Bengaluru',
                'rating' => 5,
                'comment' => 'Being 100% vegetarian, finding eggless cakes that are this light, moist, and fluffy used to be impossible. Ammas Pastries is our go-to family bakery now.',
                'is_approved' => true,
                'is_featured' => true,
            ],
        ];

        foreach ($reviewsData as $r) {
            Review::create($r);
        }

        // 10. Settings & Policies
        $settingsData = [
            'delivery_message' => 'Home Delivery Available',
            'delivery_time' => '45 Mins to 1 Hour',
            'opening_time' => '10:00 AM',
            'closing_time' => '10:00 PM',
            'contact_phone' => '+91 80 4567 8900',
            'contact_email' => 'mkumar200418@gmail.com',
            'contact_address' => 'Ammas Pastries Central Kitchen & Head Office, MG Road, Bengaluru, Karnataka 560001',
            'home_intro_title' => 'Freshly Baked. Beautifully Crafted. Made With Love.',
            'home_intro_subtitle' => 'From everyday celebrations to unforgettable milestones, Ammas Pastries brings freshly baked artisanal cakes, pastries and treats right to your doorstep across Bengaluru.',
            'razorpay_key' => 'rzp_test_demokey12345',
        ];

        foreach ($settingsData as $key => $val) {
            Setting::create(['key' => $key, 'value' => $val, 'group' => 'general']);
        }

        $policiesData = [
            [
                'slug' => 'terms-and-conditions',
                'title' => 'Terms & Conditions',
                'content' => "### Welcome to Ammas Pastries\n\nBy accessing and placing an order with Ammas Pastries, you confirm that you are in agreement with and bound by the terms of service outlined below.\n\n1. **Orders and Availability**: All cake and pastry orders are subject to acceptance and availability. Our baked goods are prepared fresh every day.\n2. **Pricing & Taxes**: All prices displayed are in Indian Rupees (INR) and inclusive of applicable GST unless explicitly stated.\n3. **Cancellations**: Custom cakes and photo cakes cannot be cancelled once preparation has begun.\n4. **Intellectual Property**: All trademarks, logos, and images are the property of Ammas Pastries."
            ],
            [
                'slug' => 'privacy-policy',
                'title' => 'Privacy Policy',
                'content' => "### Your Privacy Matters to Us\n\nAt Ammas Pastries, we respect your privacy regarding any information we may collect while operating our website.\n\n- We collect your contact name, phone number, and address strictly for processing orders and managing deliveries.\n- We do NOT store payment card credentials on our servers. All transactions are securely encrypted and processed by Razorpay.\n- Customer uploaded photos for custom photo cakes are stored on protected private disks and deleted after order fulfillment."
            ],
            [
                'slug' => 'shipping-policy',
                'title' => 'Shipping & Delivery Policy',
                'content' => "### Fresh & Fast Doorstep Delivery\n\n- **Delivery Time**: We deliver standard bakery orders in **45 Minutes to 1 Hour** from our nearest outlet.\n- **Delivery Slots**: Scheduled delivery slots can be chosen during checkout (10:00 AM to 10:00 PM).\n- **Handling Care**: All cakes are packaged in temperature-insulating premium cake boxes and transported by dedicated delivery partners with shock-absorbing cake carriers."
            ],
            [
                'slug' => 'refund-policy',
                'title' => 'Refund & Replacement Policy',
                'content' => "### 100% Quality Assurance\n\nIf you receive a damaged cake or incorrect order, please notify us within 2 hours of delivery with a photo.\n\n- In case of damage during transit, we provide an immediate fresh replacement or 100% refund.\n- Refunds are processed back to the original payment method within 3 to 5 business days via Razorpay."
            ],
            [
                'slug' => 'terms-of-use',
                'title' => 'Terms of Use',
                'content' => "### Terms of Website Use\n\nPlease read these Terms of Use carefully before using our e-commerce platform. Using the website signifies your acceptance of these terms."
            ],
        ];

        foreach ($policiesData as $p) {
            Policy::create($p);
        }

        // 11. Promotional Coupons
        Coupon::create([
            'code' => 'AMMAS100',
            'description' => 'Flat ₹100 OFF on orders above ₹500',
            'discount_type' => 'fixed',
            'discount_value' => 100,
            'min_order_amount' => 500,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'CELEBRATE15',
            'description' => '15% OFF on cakes up to ₹250',
            'discount_type' => 'percentage',
            'discount_value' => 15,
            'min_order_amount' => 600,
            'max_discount' => 250,
            'is_active' => true,
        ]);

        // 12. Seed 12 Months of Realistic Orders for the Dynamic Sales Dashboard!
        $currentYear = (int) date('Y');
        $primaryOutlet = $outlets[0];

        // Seed orders for each month of current year to populate bar charts and line graphs
        for ($month = 1; $month <= 12; $month++) {
            $orderCount = rand(4, 9);
            for ($o = 1; $o <= $orderCount; $o++) {
                $day = rand(1, 28);
                $orderDate = Carbon::create($currentYear, $month, $day, rand(10, 20), rand(0, 59));
                
                $itemsSubtotal = rand(499, 1899);
                $deliveryFee = 50;
                $tax = round($itemsSubtotal * 0.05, 2);
                $total = $itemsSubtotal + $deliveryFee + $tax;

                $orderNumber = sprintf('AMP%02d%02d%02d%d', $currentYear % 100, $month, $day, $o);

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => $demoUser->id,
                    'outlet_id' => $primaryOutlet->id,
                    'customer_name' => 'Sample Customer ' . $o,
                    'customer_email' => 'customer' . $o . '@gmail.com',
                    'customer_phone' => '98765432' . sprintf('%02d', $o),
                    'delivery_address' => 'Flat ' . ($o * 101) . ', Brigade Court, MG Road',
                    'delivery_area' => 'MG Road',
                    'delivery_city' => 'Bengaluru',
                    'delivery_pincode' => '560001',
                    'subtotal' => $itemsSubtotal,
                    'discount' => 0,
                    'delivery_fee' => $deliveryFee,
                    'tax' => $tax,
                    'total' => $total,
                    'payment_status' => 'paid',
                    'payment_method' => 'razorpay',
                    'order_status' => ($month === (int)date('n') && $day === (int)date('j')) ? 'preparing' : 'delivered',
                    'delivery_date' => $orderDate->toDateString(),
                    'delivery_time_slot' => '12:00 PM - 02:00 PM',
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                // Create order item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $createdProducts['mango-fresh-cream-cake']->id,
                    'product_name' => 'Mango Fresh Cream Cake',
                    'variant_title' => '1kg',
                    'unit_price' => $itemsSubtotal,
                    'quantity' => 1,
                    'subtotal' => $itemsSubtotal,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                // Create payment record
                Payment::create([
                    'order_id' => $order->id,
                    'transaction_id' => 'TXN_' . $orderNumber,
                    'razorpay_order_id' => 'order_rzp_' . $orderNumber,
                    'razorpay_payment_id' => 'pay_rzp_' . $orderNumber,
                    'razorpay_signature' => 'sig_' . md5($orderNumber),
                    'amount' => $total,
                    'currency' => 'INR',
                    'status' => 'captured',
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }
        }

        $this->call(ThemeCakesSeeder::class);
    }
}
