<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SweetsSaleOptionsTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Category $sweetsCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sweetsCategory = Category::firstOrCreate(
            ['slug' => 'sweets'],
            [
                'name' => 'Sweets',
                'description' => 'Traditional authentic sweets and mithai',
                'is_active' => true,
            ]
        );

        $this->admin = Admin::firstOrCreate(
            ['email' => 'admin_sweets@ammaspastries.in'],
            [
                'name' => 'Sweets Admin',
                'password' => bcrypt('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
    }

    public function test_can_create_sweet_selling_by_kg_only(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Kaju Katli Premium Box',
            'sku' => 'SWT-KAJU-' . rand(1000, 9999),
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 600,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 5.0,
            'kg_price' => 600,
            'sell_by_pieces' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertTrue($data['sell_by_kg']);
        $this->assertFalse($data['sell_by_pieces']);
        $this->assertEquals(0.5, (float) $data['kg_step']);
        $this->assertEquals(0.5, (float) $data['kg_default']);
        $this->assertEquals(5.0, (float) $data['kg_max']);
        $this->assertEquals(600.0, (float) $data['kg_price']);
    }

    public function test_can_create_sweet_selling_by_pieces_only(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Motichoor Laddu Individual',
            'sku' => 'SWT-LADDU-' . rand(1000, 9999),
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 35,
            'sell_by_kg' => false,
            'sell_by_pieces' => true,
            'piece_default' => 2,
            'piece_step' => 1,
            'piece_max' => 20,
            'piece_price' => 35,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertFalse($data['sell_by_kg']);
        $this->assertTrue($data['sell_by_pieces']);
        $this->assertEquals(2, $data['piece_default']);
        $this->assertEquals(1, $data['piece_step']);
        $this->assertEquals(20, $data['piece_max']);
        $this->assertEquals(35.0, (float) $data['piece_price']);
    }

    public function test_can_create_sweet_selling_by_both_kg_and_pieces(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Gulab Jamun Royal',
            'sku' => 'SWT-JAMUN-' . rand(1000, 9999),
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 500,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 5.0,
            'kg_price' => 500,
            'sell_by_pieces' => true,
            'piece_default' => 4,
            'piece_step' => 2,
            'piece_max' => 24,
            'piece_price' => 40,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertTrue($data['sell_by_kg']);
        $this->assertTrue($data['sell_by_pieces']);
        $this->assertEquals(0.5, (float) $data['kg_step']);
        $this->assertEquals(500.0, (float) $data['kg_price']);
        $this->assertEquals(4, $data['piece_default']);
        $this->assertEquals(40.0, (float) $data['piece_price']);
    }

    public function test_can_create_sweet_with_fixed_weight_pricing(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Assorted Mithai Gift Box',
            'sku' => 'SWT-MITHAI-' . rand(1000, 9999),
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 450,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 5.0,
            'kg_price' => 450,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [
                ['weight' => '500g', 'price' => 450],
                ['weight' => '1 kg', 'price' => 850],
                ['weight' => '2 kg', 'price' => 1600],
            ],
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertTrue((bool) $data['enable_fixed_weight_pricing']);
        $this->assertCount(3, $data['fixed_weight_options']);
        $this->assertEquals('500g', $data['fixed_weight_options'][0]['weight']);
        $this->assertEquals(450, $data['fixed_weight_options'][0]['price']);
        $this->assertEquals('1 kg', $data['fixed_weight_options'][1]['weight']);
        $this->assertEquals(850, $data['fixed_weight_options'][1]['price']);
        $this->assertEquals('2 kg', $data['fixed_weight_options'][2]['weight']);
        $this->assertEquals(1600, $data['fixed_weight_options'][2]['price']);
    }

    public function test_can_update_and_delete_sweet_product(): void
    {
        $product = Product::create([
            'name' => 'Besan Laddu Fresh',
            'slug' => 'besan-laddu-fresh',
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 400,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 3.0,
            'kg_price' => 400,
            'is_available' => true,
        ]);

        // Update to add fixed weight pricing
        $updateResponse = $this->actingAs($this->admin, 'sanctum')->putJson('/api/admin/products/' . $product->id, [
            'name' => 'Besan Laddu Fresh (Special)',
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 420,
            'sell_by_kg' => true,
            'kg_step' => 0.5,
            'kg_default' => 0.5,
            'kg_max' => 3.0,
            'kg_price' => 420,
            'enable_fixed_weight_pricing' => true,
            'fixed_weight_options' => [
                ['weight' => '500g', 'price' => 220],
                ['weight' => '1 kg', 'price' => 420],
            ],
            'is_available' => true,
        ]);

        $updateResponse->assertStatus(200);
        $this->assertEquals('Besan Laddu Fresh (Special)', $updateResponse->json('data.name'));
        $this->assertTrue((bool) $updateResponse->json('data.enable_fixed_weight_pricing'));

        // Delete product
        $deleteResponse = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/admin/products/' . $product->id);
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_rejects_sweet_creation_without_any_sale_option(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Invalid Sweet Product',
            'sku' => 'SWT-INV-' . rand(1000, 9999),
            'category_id' => $this->sweetsCategory->id,
            'base_price' => 500,
            'sell_by_kg' => false,
            'sell_by_pieces' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sale_options']);
    }
}
