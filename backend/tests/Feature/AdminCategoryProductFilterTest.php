<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCategoryProductFilterTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $cakesCategory;
    protected Category $dessertCategory;
    protected Category $emptyCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cakesCategory = Category::firstOrCreate(
            ['slug' => 'cakes-pastries'],
            ['name' => 'Cakes & Pastries', 'description' => 'Cakes category', 'is_active' => true]
        );

        $this->dessertCategory = Category::firstOrCreate(
            ['slug' => 'dessert'],
            ['name' => 'Dessert', 'description' => 'Dessert category', 'is_active' => true]
        );

        $this->emptyCategory = Category::firstOrCreate(
            ['slug' => 'empty-cat'],
            ['name' => 'Empty Category', 'description' => 'Has no products', 'is_active' => true]
        );

        $this->admin = Admin::firstOrCreate(
            ['email' => 'admin_filter@ammaspastries.in'],
            [
                'name' => 'Filter Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        // Seed sample products
        Product::create([
            'name' => 'Black Forest Cake',
            'slug' => 'black-forest-cake',
            'sku' => 'CK-BF-001',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 450,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 10,
            'kg_price' => 450,
            'is_available' => true,
        ]);

        Product::create([
            'name' => 'Dutch Truffle Cake',
            'slug' => 'dutch-truffle-cake',
            'sku' => 'CK-DT-002',
            'category_id' => $this->cakesCategory->id,
            'base_price' => 550,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 10,
            'kg_price' => 550,
            'is_available' => true,
        ]);

        Product::create([
            'name' => 'Chocolate Lava Dessert',
            'slug' => 'chocolate-lava-dessert',
            'sku' => 'DS-CL-001',
            'category_id' => $this->dessertCategory->id,
            'base_price' => 90,
            'dessert_min_quantity' => 2,
            'dessert_default_price' => 90,
            'is_available' => true,
        ]);
    }

    public function test_all_option_returns_every_product(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(3, count($data));
        $this->assertGreaterThanOrEqual(3, $response->json('pagination.total'));
    }

    public function test_selecting_cakes_and_pastries_shows_only_cakes(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->cakesCategory->id);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertEquals(2, $response->json('pagination.total'));

        foreach ($data as $product) {
            $this->assertEquals($this->cakesCategory->id, $product['category_id']);
        }
    }

    public function test_selecting_desserts_shows_only_desserts(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->dessertCategory->id);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals(1, $response->json('pagination.total'));
        $this->assertEquals('Chocolate Lava Dessert', $data[0]['name']);
    }

    public function test_filter_works_together_with_search(): void
    {
        // Search "Truffle" within Cakes category
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->cakesCategory->id . '&search=Truffle');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Dutch Truffle Cake', $data[0]['name']);

        // Search "Truffle" within Desserts category -> should return 0
        $emptyResponse = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->dessertCategory->id . '&search=Truffle');
        $emptyResponse->assertStatus(200);
        $this->assertCount(0, $emptyResponse->json('data'));
        $this->assertEquals(0, $emptyResponse->json('pagination.total'));
    }

    public function test_category_with_no_products_returns_empty(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->emptyCategory->id);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(0, $data);
        $this->assertEquals(0, $response->json('pagination.total'));
    }

    public function test_pagination_with_category_filter(): void
    {
        // 2 cakes, requested with per_page=1
        $page1 = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->cakesCategory->id . '&page=1&per_page=1');
        $page1->assertStatus(200);
        $this->assertCount(1, $page1->json('data'));
        $this->assertEquals(2, $page1->json('pagination.total'));
        $this->assertEquals(1, $page1->json('pagination.current_page'));
        $this->assertEquals(2, $page1->json('pagination.last_page'));

        $page2 = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/products?category_id=' . $this->cakesCategory->id . '&page=2&per_page=1');
        $page2->assertStatus(200);
        $this->assertCount(1, $page2->json('data'));
        $this->assertEquals(2, $page2->json('pagination.current_page'));
        $this->assertNotEquals($page1->json('data.0.id'), $page2->json('data.0.id'));
    }
}
