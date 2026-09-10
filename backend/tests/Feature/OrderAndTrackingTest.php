<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Product;
use App\Models\Category;
use App\Models\Outlet;

class OrderAndTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected $outlet;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->outlet = Outlet::create([
            'name' => 'Ammas Pastries - MG Road',
            'code' => 'AMP-MGR',
            'address' => 'MG Road',
            'area' => 'MG Road',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '560001',
            'phone' => '080-25580011',
            'opening_time' => '10:00 AM',
            'closing_time' => '10:00 PM',
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Cakes & Pastries',
            'slug' => 'cakes-pastries',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'name' => 'Belgian Dark Chocolate Cake',
            'slug' => 'belgian-dark-chocolate-cake',
            'sku' => 'AMP-BDC-01',
            'category_id' => $category->id,
            'base_price' => 599,
            'discount_price' => 549,
            'is_available' => true,
        ]);
    }

    public function test_can_create_order_and_server_calculates_total(): void
    {
        $payload = [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'Rahul Sharma',
            'customer_phone' => '9876543210',
            'customer_email' => 'rahul@example.com',
            'delivery_address' => '123 MG Road',
            'delivery_area' => 'MG Road',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560001',
            'delivery_date' => date('Y-m-d'),
            'delivery_time_slot' => '12:00 PM - 02:00 PM',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ]
            ]
        ];

        $response = $this->postJson('/api/orders/create', $payload);
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'subtotal' => 1098.0, // 549 * 2
                ]
            ]);

        $orderNumber = $response->json('data.order_number');

        // Test track order
        $trackResponse = $this->postJson('/api/orders/track', [
            'order_number' => $orderNumber,
            'phone' => '9876543210',
        ]);

        $trackResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'current_stage' => 1,
                    'stages' => [
                        ['name' => 'Order Confirmed', 'completed' => true],
                    ]
                ]
            ]);
    }
}
