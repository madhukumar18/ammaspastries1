<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CakesAndPastriesSaleOptionsTest extends TestCase
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
            ['email' => 'admin_cakes@ammaspastries.in'],
            [
                'name' => 'Cakes Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
    }

    public function test_can_create_product_selling_by_kg_only(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Belgian Chocolate Truffle Cake',
            'sku' => 'CAKE-TRF-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 599,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 599,
            'sell_by_pieces' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertTrue($data['sell_by_kg']);
        $this->assertFalse($data['sell_by_pieces']);
        $this->assertEquals(0.5, (float) $data['kg_step']);
        $this->assertEquals(1.0, (float) $data['kg_default']);
        $this->assertEquals(5.0, (float) $data['kg_max']);
        $this->assertEquals(599.0, (float) $data['kg_price']);
    }

    public function test_can_create_product_selling_by_pieces_only(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Dutch Almond Pastry Slice',
            'sku' => 'PST-ALM-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 75,
            'sell_by_kg' => false,
            'sell_by_pieces' => true,
            'piece_default' => 2,
            'piece_step' => 2,
            'piece_max' => 10,
            'piece_price' => 75,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertFalse($data['sell_by_kg']);
        $this->assertTrue($data['sell_by_pieces']);
        $this->assertEquals(2, $data['piece_default']);
        $this->assertEquals(2, $data['piece_step']);
        $this->assertEquals(10, $data['piece_max']);
        $this->assertEquals(75.0, (float) $data['piece_price']);
    }

    public function test_can_create_product_selling_by_both_kg_and_pieces(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Red Velvet Signature Cake',
            'sku' => 'CAKE-RED-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 649,
            'sell_by_kg' => true,
            'kg_step' => 1.0,
            'kg_default' => 2.0,
            'kg_max' => 8.0,
            'kg_price' => 649,
            'sell_by_pieces' => true,
            'piece_default' => 4,
            'piece_step' => 2,
            'piece_max' => 16,
            'piece_price' => 90,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertTrue($data['sell_by_kg']);
        $this->assertTrue($data['sell_by_pieces']);
        $this->assertEquals(1.0, (float) $data['kg_step']);
        $this->assertEquals(2.0, (float) $data['kg_default']);
        $this->assertEquals(8.0, (float) $data['kg_max']);
        $this->assertEquals(649.0, (float) $data['kg_price']);
        $this->assertEquals(4, $data['piece_default']);
        $this->assertEquals(2, $data['piece_step']);
        $this->assertEquals(16, $data['piece_max']);
        $this->assertEquals(90.0, (float) $data['piece_price']);
    }

    public function test_fails_when_neither_sale_option_is_enabled(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Unconfigured Cake',
            'sku' => 'CAKE-NONE-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => false,
            'sell_by_pieces' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sale_options']);
    }

    public function test_fails_when_kg_default_not_multiple_of_step(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Invalid Step Cake',
            'sku' => 'CAKE-STEP-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 1.0,
            'kg_default' => 1.5, // 1.5 is not a multiple of 1.0
            'kg_max' => 5.0,
            'kg_price' => 500,
            'is_available' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['kg_default']);
    }

    public function test_fails_when_kg_default_greater_than_max(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Invalid Max Cake',
            'sku' => 'CAKE-MAX-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 1.0,
            'kg_default' => 6.0,
            'kg_max' => 5.0, // default > max
            'kg_price' => 500,
            'is_available' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['kg_default']);
    }

    public function test_fails_when_piece_default_not_multiple_of_step(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Invalid Piece Step',
            'sku' => 'CAKE-PSTP-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 50,
            'sell_by_kg' => false,
            'sell_by_pieces' => true,
            'piece_step' => 3,
            'piece_default' => 5, // 5 is not multiple of 3
            'piece_max' => 15,
            'piece_price' => 50,
            'is_available' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['piece_default']);
    }
}
