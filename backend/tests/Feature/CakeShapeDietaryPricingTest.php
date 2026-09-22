<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CakeShapeDietaryPricingTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $cakesCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cakesCategory = Category::firstOrCreate(
            ['slug' => 'cakes-pastries'],
            [
                'name' => 'Cakes & Pastries',
                'description' => 'Freshly baked premium cakes and pastries',
                'is_active' => true,
            ]
        );

        $this->admin = Admin::firstOrCreate(
            ['email' => 'admin_cakes_shapes@ammaspastries.in'],
            [
                'name' => 'Cakes Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
    }

    public function test_can_create_cake_with_separate_egg_and_eggless_shape_prices(): void
    {
        $shapesPayload = [
            [
                'id' => 'heart',
                'shape' => 'Heart',
                'name' => 'Heart Shape',
                'egg_price' => 650,
                'eggless_price' => 700,
                'image' => 'https://example.com/heart.jpg',
                'is_active' => true,
            ],
            [
                'id' => 'round',
                'shape' => 'Round',
                'name' => 'Round Shape',
                'egg_price' => 500,
                'eggless_price' => 550,
                'image' => 'https://example.com/round.jpg',
                'is_active' => true,
            ],
            [
                'id' => 'square',
                'shape' => 'Square',
                'name' => 'Square Shape',
                'egg_price' => 600,
                'eggless_price' => 650,
                'image' => '',
                'is_active' => true,
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Belgian Chocolate Delight Cake',
            'sku' => 'CAKE-SHP-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 500,
            'sell_by_pieces' => false,
            'is_available' => true,
            'shapes' => $shapesPayload,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertIsArray($data['shapes']);
        $this->assertCount(3, $data['shapes']);

        $heart = $data['shapes'][0];
        $this->assertEquals('Heart', $heart['shape']);
        $this->assertEquals('Heart Shape', $heart['name']);
        $this->assertEquals(650.0, (float) $heart['egg_price']);
        $this->assertEquals(700.0, (float) $heart['eggless_price']);

        $round = $data['shapes'][1];
        $this->assertEquals('Round', $round['shape']);
        $this->assertEquals(500.0, (float) $round['egg_price']);
        $this->assertEquals(550.0, (float) $round['eggless_price']);
    }

    public function test_can_update_and_delete_shapes_with_crud_control(): void
    {
        $product = Product::create([
            'name' => 'Red Velvet Royale',
            'slug' => 'red-velvet-royale-' . rand(1000, 9999),
            'sku' => 'CAKE-RED-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 600,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 600,
            'sell_by_pieces' => false,
            'is_available' => true,
            'shapes' => [
                [
                    'id' => 'heart',
                    'shape' => 'Heart',
                    'name' => 'Heart Shape',
                    'egg_price' => 650,
                    'eggless_price' => 700,
                    'is_active' => true,
                ],
                [
                    'id' => 'round',
                    'shape' => 'Round',
                    'name' => 'Round Shape',
                    'egg_price' => 500,
                    'eggless_price' => 550,
                    'is_active' => true,
                ],
            ],
        ]);

        // Update: Delete 'round', update 'heart' prices, and add new 'Custom Star Shape'
        $updatedShapesPayload = [
            [
                'id' => 'heart',
                'shape' => 'Heart',
                'name' => 'Heart Shape (Updated)',
                'egg_price' => 680,
                'eggless_price' => 730,
                'is_active' => true,
            ],
            [
                'id' => 'star',
                'shape' => 'Custom',
                'name' => 'Star Shape',
                'egg_price' => 800,
                'eggless_price' => 850,
                'is_active' => true,
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'name' => 'Red Velvet Royale',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 600,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 600,
            'sell_by_pieces' => false,
            'is_available' => true,
            'shapes' => $updatedShapesPayload,
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(2, $data['shapes']);

        // Verify Heart prices were updated
        $heart = $data['shapes'][0];
        $this->assertEquals('Heart Shape (Updated)', $heart['name']);
        $this->assertEquals(680.0, (float) $heart['egg_price']);
        $this->assertEquals(730.0, (float) $heart['eggless_price']);

        // Verify Star Shape was added
        $star = $data['shapes'][1];
        $this->assertEquals('Star Shape', $star['name']);
        $this->assertEquals(800.0, (float) $star['egg_price']);
        $this->assertEquals(850.0, (float) $star['eggless_price']);

        // Verify Round was deleted (not present in updated shapes)
        $shapesNames = array_column($data['shapes'], 'name');
        $this->assertNotContains('Round Shape', $shapesNames);

        // Verify public API returns updated shapes
        $publicResponse = $this->getJson("/api/products/{$product->slug}");
        $publicResponse->assertStatus(200);
        $publicProduct = $publicResponse->json('data.product');
        $this->assertCount(2, $publicProduct['shapes']);
        $this->assertEquals(680.0, (float) $publicProduct['shapes'][0]['egg_price']);
        $this->assertEquals(730.0, (float) $publicProduct['shapes'][0]['eggless_price']);
    }
}
