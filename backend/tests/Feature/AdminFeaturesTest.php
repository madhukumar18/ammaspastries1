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
}
