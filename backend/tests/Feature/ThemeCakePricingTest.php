<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemeCakePricingTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $themeCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->themeCategory = Category::firstOrCreate(
            ['slug' => 'theme-cakes'],
            [
                'name' => 'Theme Cakes',
                'description' => 'Custom 3D designer cakes',
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

    public function test_theme_cake_pricing_proportional_and_override_calculation(): void
    {
        $cake = new Product([
            'name' => 'Superhero Fortress Cake',
            'category_id' => $this->themeCategory->id,
            'theme_cake_default_weight' => 5.0,
            'theme_cake_default_price' => 2000.0,
            'theme_cake_step_size' => 1.0,
            'theme_cake_price_tiers' => [
                ['weight' => 6.0, 'price' => 2300.0], // Custom non-linear discount tier
            ],
        ]);

        // 5kg (default base) -> 2000
        $this->assertEquals(2000.0, $cake->calculateThemeCakePrice(5.0));

        // 6kg has custom tier override -> 2300 (instead of proportional 2400)
        $this->assertEquals(2300.0, $cake->calculateThemeCakePrice(6.0));

        // 7kg has no override -> proportional (2000 / 5) * 7 = 2800
        $this->assertEquals(2800.0, $cake->calculateThemeCakePrice(7.0));

        // 8kg -> proportional (2000 / 5) * 8 = 3200
        $this->assertEquals(3200.0, $cake->calculateThemeCakePrice(8.0));
    }

    public function test_admin_can_create_theme_cake_with_pricing_rules(): void
    {
        $payload = [
            'name' => 'Royal Tier Wedding Cake',
            'sku' => 'THM-TEST-' . rand(1000, 9999),
            'category_id' => $this->themeCategory->id,
            'description' => 'Grand custom artisan cake',
            'base_price' => 2000,
            'theme_cake_default_weight' => 5.0,
            'theme_cake_default_price' => 2000.0,
            'theme_cake_step_size' => 1.0,
            'theme_cake_price_tiers' => [
                ['weight' => 6.0, 'price' => 2300.0],
                ['weight' => 8.0, 'price' => 3000.0],
            ],
            'is_available' => true,
            'is_eggless' => false,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.theme_cake_default_weight', 5)
            ->assertJsonPath('data.theme_cake_default_price', 2000)
            ->assertJsonPath('data.theme_cake_step_size', 1)
            ->assertJsonPath('data.weight', '5kg');

        $this->assertDatabaseHas('products', [
            'name' => 'Royal Tier Wedding Cake',
            'theme_cake_default_weight' => 5.0,
            'theme_cake_default_price' => 2000.0,
            'weight' => '5kg',
        ]);
    }
}
