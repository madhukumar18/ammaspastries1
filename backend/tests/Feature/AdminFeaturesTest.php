<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\User;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\PhotoCakeUpload;
use App\Models\Product;
use App\Models\ProductVariant;

class AdminFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $category;
    protected $subcategory;

    protected function setUp(): void
    {
        parent::setUp();

        // Create admin user
        $this->admin = User::factory()->create([
            'email' => 'admin@ammaspastries.in',
            'role' => 'admin',
        ]);

        // Create category and subcategory
        $this->category = Category::create([
            'name' => 'Cakes & Pastries',
            'slug' => 'cakes-pastries',
            'display_order' => 1,
            'is_active' => true,
        ]);

        $this->subcategory = Subcategory::create([
            'category_id' => $this->category->id,
            'name' => 'Exotic Fruitz',
            'slug' => 'exotic-fruitz',
            'display_order' => 1,
        ]);
    }

    public function test_admin_can_upload_local_gallery_image(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('my_delicious_cake.jpg', 800, 800);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/media/upload', [
                'image' => $file,
                'folder' => 'products',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data['url']);
        $this->assertStringContainsString('uploads/products', $data['path']);
    }

    public function test_admin_can_create_cake_with_subcategory(): void
    {
        $payload = [
            'name' => 'Fresh Kiwi Exotic Delight',
            'category_id' => $this->category->id,
            'subcategory_id' => $this->subcategory->id,
            'base_price' => 599,
            'weight' => '500g',
            'is_eggless' => true,
            'image_url' => 'https://example.com/kiwi.jpg',
            'variants' => [
                ['size_weight' => '500g', 'price' => 599],
                ['size_weight' => '1kg', 'price' => 1099],
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Fresh Kiwi Exotic Delight',
            'category_id' => $this->category->id,
            'subcategory_id' => $this->subcategory->id,
        ]);
    }

    public function test_admin_can_create_product_with_both_pieces_and_grams(): void
    {
        $payload = [
            'name' => 'Signature Truffle Fusion Cake',
            'category_id' => $this->category->id,
            'subcategory_id' => $this->subcategory->id,
            'base_price' => 649,
            'weight' => '500g',
            'portion_type' => 'both',
            'portion_unit' => 'grams',
            'portion_step' => '500g',
            'piece_price' => 120,
            'piece_limit' => 12,
            'piece_min' => 1,
            'is_eggless' => true,
            'image_url' => 'https://example.com/truffle.jpg',
            'variants' => [
                ['size_weight' => '500g', 'price' => 649],
                ['size_weight' => '1kg', 'price' => 1199],
                ['size_weight' => '1.5kg', 'price' => 1699],
                ['size_weight' => '2kg', 'price' => 2199],
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'portion_type' => 'both',
                    'weight' => '500g',
                    'piece_price' => 120,
                    'piece_limit' => 12,
                ]
            ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Signature Truffle Fusion Cake',
            'portion_type' => 'both',
            'weight' => '500g',
            'piece_price' => 120,
            'piece_limit' => 12,
        ]);

        $this->assertDatabaseHas('product_variants', [
            'size_weight' => '500g',
            'price' => 649,
        ]);

        $this->assertDatabaseHas('product_variants', [
            'size_weight' => '1kg',
            'price' => 1199,
        ]);

        // Verify public API returns the product with portion_type 'both' and piece controls
        $slug = $response->json('data.slug');
        $publicRes = $this->getJson("/api/products/{$slug}");
        $publicRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'product' => [
                        'portion_type' => 'both',
                        'weight' => '500g',
                        'piece_price' => 120,
                        'piece_limit' => 12,
                        'piece_min' => 1,
                    ]
                ]
            ]);

        $variants = $publicRes->json('data.product.variants');
        $this->assertCount(4, $variants);
        $this->assertEquals('500g', $variants[0]['size_weight']);
        $this->assertEquals('1kg', $variants[1]['size_weight']);
    }

    public function test_admin_can_create_banner_with_desktop_and_mobile_images(): void
    {
        $payload = [
            'title' => 'Fresh Seasonal Mango Pastries',
            'subtitle' => 'Handcrafted every morning with Alphonso mangoes',
            'image_url' => 'https://example.com/desktop-1920x600.jpg',
            'mobile_image_url' => 'https://example.com/mobile-800x800.jpg',
            'button_text' => 'Order Now',
            'button_url' => '/category/cakes-pastries',
            'display_order' => 1,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/banners', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('banners', [
            'title' => 'Fresh Seasonal Mango Pastries',
            'mobile_image_url' => 'https://example.com/mobile-800x800.jpg',
        ]);
    }

    public function test_admin_can_preview_and_download_photo_cake_for_kitchen(): void
    {
        Storage::fake('local');

        $storedPath = 'photo_cakes/test_cake_photo.jpg';
        Storage::put($storedPath, 'fake-binary-image-content');

        $upload = PhotoCakeUpload::create([
            'original_filename' => 'birthday_aarav.jpg',
            'stored_path' => $storedPath,
            'mime_type' => 'image/jpeg',
            'file_size' => 1024,
            'preview_token' => 'test-token-12345',
        ]);

        // Test Preview
        $previewResponse = $this->actingAs($this->admin, 'sanctum')
            ->get("/api/admin/photo-cake/{$upload->id}/preview");

        $previewResponse->assertStatus(200)
            ->assertHeader('Content-Type', 'image/jpeg');

        // Test Download
        $downloadResponse = $this->actingAs($this->admin, 'sanctum')
            ->get("/api/admin/photo-cake/{$upload->id}/download?order_number=AMP260901&name=Aarav");

        $downloadResponse->assertStatus(200);
        $this->assertTrue(str_contains(
            $downloadResponse->headers->get('content-disposition'),
            'AmmasPastries_PhotoCake_AMP260901_Aarav.jpg'
        ));
    }

    public function test_admin_can_manage_photo_cake_shapes_flavours_and_pricing(): void
    {
        Storage::fake('public');

        // 1. Check public config
        $publicRes = $this->getJson('/api/photo-cakes/config');
        $publicRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['shapes', 'dietary', 'flavours']]);

        // 2. Admin retrieves management config
        $adminGetRes = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/photo-cake/management');
        $adminGetRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Admin uploads shape image from device storage
        $fakeImg = UploadedFile::fake()->image('heart_device_cake.jpg', 600, 600);
        $uploadRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/photo-cake/shape-image', [
                'image' => $fakeImg,
            ]);
        $uploadRes->assertStatus(200)
            ->assertJsonPath('success', true);
        $uploadedUrl = $uploadRes->json('data.url');
        $this->assertNotEmpty($uploadedUrl);

        // 4. Admin saves updated shapes, dietary, and flavours with weights
        $payload = [
            'shapes' => [
                [
                    'id' => 'heart',
                    'name' => 'Heart Shaped Romantic Cake',
                    'shape' => 'Heart Shape',
                    'tag' => 'Anniversary Special',
                    'icon' => '❤️',
                    'image' => $uploadedUrl,
                    'description' => 'Heart shape cake updated via admin upload',
                    'is_active' => true,
                ],
                [
                    'id' => 'round',
                    'name' => 'Round Classic Cake',
                    'shape' => 'Round Shape',
                    'tag' => 'Bestseller',
                    'icon' => '⭕',
                    'image' => 'https://example.com/round-link.jpg',
                    'description' => 'Round cake updated via web link',
                    'is_active' => true,
                ],
            ],
            'dietary' => [
                'allow_eggless' => true,
                'allow_egg' => true,
                'default_dietary' => 'eggless',
                'eggless_label' => '100% Pure Vegetarian Eggless',
                'egg_label' => 'Classic Farm Egg Sponge',
            ],
            'flavours' => [
                [
                    'id' => 'lotus-biscoff',
                    'name' => 'Lotus Biscoff Speculoos',
                    'description' => 'Belgian spiced cookie butter glaze',
                    'is_eggless_available' => true,
                    'is_egg_available' => true,
                    'is_active' => true,
                    'weights' => [
                        ['weight' => '0.5kg', 'price' => 749, 'is_min' => true],
                        ['weight' => '1.0kg', 'price' => 1349, 'is_min' => false],
                        ['weight' => '2.0kg', 'price' => 2499, 'is_min' => false],
                    ],
                ],
            ],
        ];

        $saveRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/photo-cake/management', $payload);
        $saveRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 5. Verify customer public config now returns the admin-configured data
        $updatedPublic = $this->getJson('/api/photo-cakes/config');
        $updatedPublic->assertStatus(200)
            ->assertJsonPath('data.shapes.0.name', 'Heart Shaped Romantic Cake')
            ->assertJsonPath('data.shapes.0.image', $uploadedUrl)
            ->assertJsonPath('data.flavours.0.name', 'Lotus Biscoff Speculoos')
            ->assertJsonPath('data.flavours.0.weights.0.weight', '0.5kg')
            ->assertJsonPath('data.flavours.0.weights.0.price', 749);
    }

    public function test_admin_can_export_products_csv(): void
    {
        Product::create([
            'name' => 'Royal Mango Passion Cake',
            'sku' => 'AMP-MNG-99',
            'slug' => 'royal-mango-passion-cake',
            'category_id' => $this->category->id,
            'base_price' => 799,
            'weight' => '1kg',
            'is_eggless' => true,
            'stock' => 25,
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/admin/products/export-csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        
        $streamedContent = $response->streamedContent();
        $this->assertStringContainsString('Royal Mango Passion Cake', $streamedContent);
        $this->assertStringContainsString('AMP-MNG-99', $streamedContent);
        $this->assertStringContainsString('799', $streamedContent);
    }

    public function test_admin_can_download_csv_template(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/admin/products/csv-template');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $streamedContent = $response->streamedContent();
        $this->assertStringContainsString('Blueberry Velveteen Cake', $streamedContent);
        $this->assertStringContainsString('Vintage Car Racer Theme Cake', $streamedContent);
    }

    public function test_admin_can_bulk_import_and_update_products(): void
    {
        // 1. Existing product that should be updated
        $existing = Product::create([
            'name' => 'Old Butterscotch Cake',
            'sku' => 'AMP-BSC-01',
            'slug' => 'old-butterscotch-cake',
            'category_id' => $this->category->id,
            'base_price' => 450,
            'weight' => '500g',
            'is_eggless' => true,
            'stock' => 10,
            'is_available' => true,
        ]);

        // 2. CSV content: Row 1 updates existing (by SKU), Row 2 creates new product with variants
        $columns = [
            'ID', 'SKU', 'Name', 'Slug', 'Category', 'Subcategory',
            'Base Price', 'Discount Price', 'Weight', 'Is Eggless',
            'Stock', 'Is Available', 'Is Featured', 'Is Popular',
            'Is New Arrival', 'Is Gifting', 'Image URL',
            'Short Description', 'Description', 'Variants'
        ];

        $rowUpdate = [
            $existing->id,
            'AMP-BSC-01',
            'Updated Butterscotch Deluxe Cake',
            'updated-butterscotch-deluxe-cake',
            'Cakes & Pastries',
            'Exotic Fruitz',
            '699',
            '649',
            '1kg',
            'no', // Changed to egg
            '75',
            'yes',
            'yes',
            'yes',
            'yes',
            'no',
            'https://example.com/updated-bsc.jpg',
            'Updated short summary',
            'Updated long description for butterscotch cake',
            '1kg:699:649|2kg:1299:1199'
        ];

        $rowNew = [
            '',
            'AMP-RVT-02',
            'Velvet Symphony Red Cake',
            'velvet-symphony-red-cake',
            'Cakes & Pastries',
            'Exotic Fruitz',
            '850',
            '799',
            '750g',
            'yes',
            '40',
            'yes',
            'yes',
            'no',
            'yes',
            'yes',
            'https://example.com/red-velvet.jpg',
            'Decadent crimson velvet cake',
            'Velvety smooth layers with creamy mascarpone frosting',
            '750g:850:799|1.5kg:1550:1450'
        ];

        $csvHandle = fopen('php://temp', 'r+');
        fputcsv($csvHandle, $columns);
        fputcsv($csvHandle, $rowUpdate);
        fputcsv($csvHandle, $rowNew);
        rewind($csvHandle);
        $csvString = stream_get_contents($csvHandle);
        fclose($csvHandle);

        $fakeFile = UploadedFile::fake()->createWithContent('products.csv', $csvString);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->post('/api/admin/products/bulk-upload', [
                'file' => $fakeFile,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.created_count', 1)
            ->assertJsonPath('data.updated_count', 1)
            ->assertJsonPath('data.failed_count', 0);

        // 3. Verify existing product was updated in database
        $this->assertDatabaseHas('products', [
            'id' => $existing->id,
            'name' => 'Updated Butterscotch Deluxe Cake',
            'base_price' => 699,
            'discount_price' => 649,
            'weight' => '1kg',
            'is_eggless' => false,
            'stock' => 75,
        ]);

        // Verify variants were synced for updated product
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $existing->id,
            'size_weight' => '1kg',
            'price' => 699,
        ]);

        // 4. Verify new product was created in database
        $this->assertDatabaseHas('products', [
            'name' => 'Velvet Symphony Red Cake',
            'sku' => 'AMP-RVT-02',
            'base_price' => 850,
            'is_eggless' => true,
        ]);

        $newProduct = Product::where('sku', 'AMP-RVT-02')->first();
        $this->assertNotNull($newProduct);
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $newProduct->id,
            'size_weight' => '750g',
            'price' => 850,
        ]);
    }

    public function test_admin_can_manage_category_images(): void
    {
        // 1. Create a category image
        $createRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/category-images', [
                'name' => 'Artisan Cupcakes',
                'subtitle' => 'Frosting Swirls & Sprinkles',
                'image_url' => 'https://images.unsplash.com/cupcake.jpg',
                'target_url' => '/category/dessert?sub=cup-cakes',
                'badge_text' => 'Handmade',
                'display_order' => 1,
                'is_active' => true,
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Artisan Cupcakes');

        $id = $createRes->json('data.id');

        // 2. Public API includes the active category image
        $publicRes = $this->getJson('/api/category-images');
        $publicRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Update the category image
        $updateRes = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/admin/category-images/{$id}", [
                'name' => 'Gourmet Cupcakes',
                'subtitle' => 'Velvet Cream Frosting',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.name', 'Gourmet Cupcakes');

        // 4. Toggle active status
        $toggleRes = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/admin/category-images/{$id}/toggle-status");
        $toggleRes->assertStatus(200)
            ->assertJsonPath('data.is_active', false);

        // 5. Delete category image
        $deleteRes = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/category-images/{$id}");
        $deleteRes->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
