<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DessertQuantityPricingTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $dessertCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dessertCategory = Category::firstOrCreate(
            ['slug' => 'dessert'],
            [
                'name' => 'Dessert',
                'description' => 'Sweet gourmet dessert treats',
                'is_active' => true,
            ]
        );

        $this->admin = Admin::firstOrCreate(
            ['email' => 'admin_dessert@ammaspastries.in'],
            [
                'name' => 'Dessert Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
    }

    public function test_dessert_price_calculation_linear_and_overrides(): void
    {
        $dessert = new Product([
            'name' => 'Belgian Choco Mousse Cup',
            'category_id' => $this->dessertCategory->id,
            'dessert_min_quantity' => 2,
            'dessert_default_price' => 100.0,
            'dessert_step_size' => 1,
            'dessert_price_tiers' => [
                ['quantity' => 3, 'price' => 140.0],
            ],
            'base_price' => 100.0,
            'weight' => '2 Pcs',
        ]);

        $this->assertTrue($dessert->isDessert());

        // 1. Below minimum should clamp to min (2 pcs) -> ₹100
        $this->assertEquals(100.0, $dessert->calculateDessertPrice(1));

        // 2. Minimum quantity (2 pcs) -> ₹100
        $this->assertEquals(100.0, $dessert->calculateDessertPrice(2));

        // 3. Quantity with custom tier override (3 pcs = ₹140 instead of linear ₹150)
        $this->assertEquals(140.0, $dessert->calculateDessertPrice(3));

        // 4. Quantity without tier override (4 pcs -> 50 * 4 = ₹200)
        $this->assertEquals(200.0, $dessert->calculateDessertPrice(4));

        // 5. Quantity 5 pcs -> 50 * 5 = ₹250
        $this->assertEquals(250.0, $dessert->calculateDessertPrice(5));
    }

    public function test_admin_dessert_validation_and_piece_storage(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Gourmet Tiramisu Jar',
            'sku' => 'DST-TIR-' . rand(1000, 9999),
            'category_id' => $this->dessertCategory->id,
            'base_price' => 120,
            'dessert_min_quantity' => 2,
            'dessert_default_price' => 120,
            'dessert_step_size' => 1,
            'dessert_price_tiers' => [
                ['quantity' => 3, 'price' => 170],
            ],
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertEquals(2, $data['dessert_min_quantity']);
        $this->assertEquals(120.0, (float) $data['dessert_default_price']);
        $this->assertEquals(1, $data['dessert_step_size']);
        $this->assertEquals('2 Pcs', $data['weight']);
        $this->assertEquals('portion', $data['portion_type']);
        $this->assertEquals('pieces', $data['portion_unit']);
        $this->assertFalse(str_contains(strtolower($data['weight']), 'kg'));
        $this->assertFalse(str_contains(strtolower($data['weight']), 'g'));

        $this->assertDatabaseHas('products', [
            'name' => 'Gourmet Tiramisu Jar',
            'dessert_min_quantity' => 2,
            'dessert_default_price' => 120.0,
            'weight' => '2 Pcs',
        ]);
    }
}
