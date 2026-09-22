<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FixedWeightPricingTest extends TestCase
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
            ['email' => 'admin_fixed_weight@ammaspastries.in'],
            [
                'name' => 'Fixed Weight Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
    }

    public function test_can_create_product_with_fixed_weight_pricing(): void
    {
        $payload = [
            'name' => 'Signature Dutch Truffle Cake',
            'sku' => 'CAKE-FX-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 500,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [
                ['weight' => '1 kg', 'price' => 500],
                ['weight' => '2 kg', 'price' => 940],
                ['weight' => '3 kg', 'price' => 1350],
            ],
            'is_available' => true,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', $payload);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertTrue((bool) $data['enable_fixed_weight_pricing']);
        $this->assertCount(3, $data['fixed_weight_options']);
        $this->assertEquals('1 kg', $data['fixed_weight_options'][0]['weight']);
        $this->assertEquals(500, $data['fixed_weight_options'][0]['price']);
        $this->assertEquals('2 kg', $data['fixed_weight_options'][1]['weight']);
        $this->assertEquals(940, $data['fixed_weight_options'][1]['price']);
        $this->assertEquals('3 kg', $data['fixed_weight_options'][2]['weight']);
        $this->assertEquals(1350, $data['fixed_weight_options'][2]['price']);
    }

    public function test_public_product_detail_returns_fixed_weight_pricing(): void
    {
        $product = Product::create([
            'name' => 'Belgian Chocolate Cake',
            'slug' => 'belgian-chocolate-cake-fixed',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 500,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [
                ['weight' => '1 kg', 'price' => 500],
                ['weight' => '2 kg', 'price' => 940],
            ],
            'is_available' => true,
        ]);

        $response = $this->getJson('/api/products/' . $product->slug);

        $response->assertStatus(200);
        $prodData = $response->json('data.product');

        $this->assertTrue((bool) $prodData['enable_fixed_weight_pricing']);
        $this->assertCount(2, $prodData['fixed_weight_options']);
        $this->assertEquals('1 kg', $prodData['fixed_weight_options'][0]['weight']);
        $this->assertEquals(500, $prodData['fixed_weight_options'][0]['price']);
    }

    public function test_can_toggle_fixed_weight_pricing_off_and_on(): void
    {
        $product = Product::create([
            'name' => 'Black Forest Cake',
            'slug' => 'black-forest-cake-toggle',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 450,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 4.0,
            'kg_price' => 450,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [
                ['weight' => '1 kg', 'price' => 450],
                ['weight' => '2 kg', 'price' => 850],
            ],
            'is_available' => true,
        ]);

        // Toggle OFF
        $updateResponse = $this->actingAs($this->admin, 'sanctum')->putJson('/api/admin/products/' . $product->id, [
            'name' => 'Black Forest Cake',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 450,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 4.0,
            'kg_price' => 450,
            'enable_fixed_weight_pricing' => false,
            'fixed_weight_options' => null,
            'is_available' => true,
        ]);

        $updateResponse->assertStatus(200);
        $updatedData = $updateResponse->json('data');
        $this->assertFalse((bool) $updatedData['enable_fixed_weight_pricing']);

        // Toggle back ON with new pairs
        $reToggleResponse = $this->actingAs($this->admin, 'sanctum')->putJson('/api/admin/products/' . $product->id, [
            'name' => 'Black Forest Cake',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 450,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 4.0,
            'kg_price' => 450,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [
                ['weight' => '0.5 kg', 'price' => 250],
                ['weight' => '1 kg', 'price' => 450],
                ['weight' => '2 kg', 'price' => 850],
            ],
            'is_available' => true,
        ]);

        $reToggleResponse->assertStatus(200);
        $reToggledData = $reToggleResponse->json('data');
        $this->assertTrue((bool) $reToggledData['enable_fixed_weight_pricing']);
        $this->assertCount(3, $reToggledData['fixed_weight_options']);
    }

    public function test_rejects_fixed_weight_pricing_when_enabled_with_empty_options(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Invalid Fixed Weight Cake',
            'sku' => 'CAKE-INV-' . rand(1000, 9999),
            'category_id' => $this->cakesCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 1.0,
            'kg_max' => 5.0,
            'kg_price' => 500,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [],
            'is_available' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['fixed_weight_options']);
    }
}
