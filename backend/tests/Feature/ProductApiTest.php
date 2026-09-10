<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Product;
use App\Models\Category;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create([
            'name' => 'Cakes & Pastries',
            'slug' => 'cakes-pastries',
            'is_active' => true,
        ]);

        Product::create([
            'name' => 'Mango Fresh Cream Cake',
            'slug' => 'mango-fresh-cream-cake',
            'sku' => 'AMP-MNG-01',
            'category_id' => $category->id,
            'base_price' => 499,
            'is_available' => true,
        ]);
    }

    public function test_can_fetch_active_categories(): void
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'subcategories']
                ]
            ]);
    }

    public function test_can_fetch_products_list_with_pagination(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'base_price', 'category']
                ],
                'pagination' => ['total', 'current_page', 'last_page']
            ]);
    }

    public function test_live_search_endpoint_returns_suggestions(): void
    {
        $response = $this->getJson('/api/search?q=cake');
        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }
}
