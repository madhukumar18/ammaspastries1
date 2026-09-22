<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChocolatePackagingTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $chocolateCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->chocolateCategory = Category::firstOrCreate(
            ['slug' => 'chocolates'],
            [
                'name' => 'Chocolates',
                'description' => 'Artisanal chocolates and pralines',
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

    public function test_chocolate_model_helpers_and_pack_price_calculation(): void
    {
        $product = Product::create([
            'name' => 'Artisanal Dark Truffles',
            'slug' => 'artisanal-dark-truffles',
            'category_id' => $this->chocolateCategory->id,
            'base_price' => 180.00,
            'weight' => '100g',
            'is_available' => true,
            'chocolate_pricing_type' => 'both',
            'chocolate_pack_options' => [
                ['weight' => 100, 'unit' => 'g', 'price' => 180.00],
                ['weight' => 250, 'unit' => 'g', 'price' => 420.00],
                ['weight' => 500, 'unit' => 'g', 'price' => 800.00],
            ],
            'sell_by_pieces' => true,
            'piece_price' => 40.00,
            'piece_min' => 1,
            'piece_step' => 1,
            'piece_default' => 1,
        ]);

        $this->assertTrue($product->isChocolate());

        $packs = $product->getChocolatePacks();
        $this->assertCount(3, $packs);
        $this->assertEquals('100g', $packs[0]['label']);
        $this->assertEquals(180.00, $packs[0]['price']);
        $this->assertEquals('250g', $packs[1]['label']);
        $this->assertEquals(420.00, $packs[1]['price']);
        $this->assertEquals('500g', $packs[2]['label']);
        $this->assertEquals(800.00, $packs[2]['price']);

        // Test pack count multiplication
        $this->assertEquals(180.00, $product->calculateChocolatePrice(100, 'g', 1));
        $this->assertEquals(360.00, $product->calculateChocolatePrice(100, 'g', 2));
        $this->assertEquals(840.00, $product->calculateChocolatePrice(250, 'g', 2));
        $this->assertEquals(1600.00, $product->calculateChocolatePrice(500, 'g', 2));

        // Test piece calculation
        $this->assertEquals(40.00, $product->calculateChocolatePiecePrice(1));
        $this->assertEquals(120.00, $product->calculateChocolatePiecePrice(3));
        $this->assertEquals(200.00, $product->calculateChocolatePiecePrice(5));
    }

    public function test_admin_product_controller_stores_and_updates_chocolate_packs(): void
    {
        // 1. Success when valid weight pack options are provided
        $responseWeight = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Handcrafted Pralines',
            'category_id' => $this->chocolateCategory->id,
            'base_price' => 200,
            'chocolate_pricing_type' => 'weight',
            'chocolate_pack_options' => [
                ['weight' => 150, 'unit' => 'g', 'price' => 220.00],
                ['weight' => 300, 'unit' => 'g', 'price' => 430.00],
            ],
        ]);

        $responseWeight->assertStatus(201);
        $productId = $responseWeight->json('data.id');

        $savedProduct = Product::find($productId);
        $this->assertNotNull($savedProduct);
        $this->assertTrue($savedProduct->isChocolate());
        $this->assertEquals(220.00, $savedProduct->base_price);
        $this->assertEquals('150g', $savedProduct->weight);

        $packs = $savedProduct->getChocolatePacks();
        $this->assertCount(2, $packs);
        $this->assertEquals(220.00, $packs[0]['price']);
        $this->assertEquals(430.00, $packs[1]['price']);

        // 2. Update to Piece Count pricing type
        $responsePiece = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/products/{$productId}", [
            'name' => 'Handcrafted Pralines (Single Piece)',
            'category_id' => $this->chocolateCategory->id,
            'chocolate_pricing_type' => 'piece',
            'piece_price' => 45.00,
            'piece_min' => 1,
            'piece_step' => 1,
            'piece_default' => 1,
        ]);

        $responsePiece->assertStatus(200);
        $updatedProduct = Product::find($productId);
        $this->assertEquals('piece', $updatedProduct->chocolate_pricing_type);
        $this->assertEquals(45.00, $updatedProduct->piece_price);
        $this->assertEquals(45.00, $updatedProduct->base_price);
        $this->assertEquals('1 Pc', $updatedProduct->weight);
        $this->assertEquals(1, $updatedProduct->piece_min);
        $this->assertEquals(1, $updatedProduct->piece_step);
    }
}
