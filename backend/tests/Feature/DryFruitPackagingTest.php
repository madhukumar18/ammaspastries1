<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DryFruitPackagingTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $dryFruitCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dryFruitCategory = Category::firstOrCreate(
            ['slug' => 'dry-fruits'],
            [
                'name' => 'Dry Fruits',
                'description' => 'Premium healthy roasted dry fruits',
                'is_active' => true,
            ]
        );

        $this->admin = Admin::firstOrCreate(
            ['email' => 'admin_test@ammaspastries.in'],
            [
                'name' => 'Test Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
    }

    public function test_dry_fruit_model_helpers_and_pack_price_calculation(): void
    {
        $product = Product::create([
            'name' => 'Premium Roasted Almonds',
            'slug' => 'premium-roasted-almonds',
            'category_id' => $this->dryFruitCategory->id,
            'base_price' => 150.00,
            'weight' => '200g',
            'is_available' => true,
            'dry_fruit_pack_options' => [
                ['weight' => 200, 'unit' => 'g', 'price' => 150.00],
                ['weight' => 500, 'unit' => 'g', 'price' => 350.00],
                ['weight' => 1, 'unit' => 'kg', 'price' => 650.00],
            ],
        ]);

        $this->assertTrue($product->isDryFruit());

        $packs = $product->getDryFruitPacks();
        $this->assertCount(3, $packs);
        $this->assertEquals('200g', $packs[0]['label']);
        $this->assertEquals(150.00, $packs[0]['price']);
        $this->assertEquals('500g', $packs[1]['label']);
        $this->assertEquals(350.00, $packs[1]['price']);
        $this->assertEquals('1kg', $packs[2]['label']);
        $this->assertEquals(650.00, $packs[2]['price']);

        // Test pack count multiplication (pack_price * numberOfPacks)
        // 1 pack of 200g = 150
        $this->assertEquals(150.00, $product->calculateDryFruitPrice(200, 'g', 1));
        // 2 packs of 200g = 300
        $this->assertEquals(300.00, $product->calculateDryFruitPrice(200, 'g', 2));
        // 3 packs of 500g = 1050
        $this->assertEquals(1050.00, $product->calculateDryFruitPrice(500, 'g', 3));
        // 2 packs of 1kg = 1300
        $this->assertEquals(1300.00, $product->calculateDryFruitPrice(1, 'kg', 2));

        // Invalid / unlisted pack size returns null (no auto-generated intermediate weights)
        $this->assertNull($product->calculateDryFruitPrice(300, 'g', 1));
        $this->assertNull($product->calculateDryFruitPrice(400, 'g', 1));
    }

    public function test_admin_product_controller_stores_and_validates_dry_fruit_packs(): void
    {
        // 1. Validation fails if no pack options are provided for Dry Fruits
        $responseFail = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Bad Dry Fruit',
            'category_id' => $this->dryFruitCategory->id,
            'base_price' => 100,
            'dry_fruit_pack_options' => [],
        ]);
        $responseFail->assertStatus(422);

        // 2. Success when valid pack options are provided
        $responseSuccess = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Premium Cashew Pack',
            'category_id' => $this->dryFruitCategory->id,
            'base_price' => 200,
            'dry_fruit_pack_options' => [
                ['weight' => 250, 'unit' => 'g', 'price' => 240.00],
                ['weight' => 500, 'unit' => 'g', 'price' => 460.00],
                ['weight' => 1, 'unit' => 'kg', 'price' => 890.00],
            ],
        ]);

        $responseSuccess->assertStatus(201);
        $productId = $responseSuccess->json('data.id');

        $savedProduct = Product::find($productId);
        $this->assertNotNull($savedProduct);
        $this->assertTrue($savedProduct->isDryFruit());
        // Base price synced to lowest pack price (240)
        $this->assertEquals(240.00, $savedProduct->base_price);
        // Weight label synced to first pack (250g)
        $this->assertEquals('250g', $savedProduct->weight);

        $packs = $savedProduct->getDryFruitPacks();
        $this->assertCount(3, $packs);
        $this->assertEquals(240.00, $packs[0]['price']);
        $this->assertEquals(460.00, $packs[1]['price']);
        $this->assertEquals(890.00, $packs[2]['price']);
    }
}
