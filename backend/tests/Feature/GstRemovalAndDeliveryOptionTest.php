<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Product;
use App\Models\Category;
use App\Models\Outlet;
use App\Models\User;

class GstRemovalAndDeliveryOptionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Run migrations
        $this->artisan('migrate');
    }

    public function test_home_delivery_adds_flat_100_fee_and_zero_gst()
    {
        $category = Category::create([
            'name' => 'Cakes & Pastries',
            'slug' => 'cakes-pastries',
            'is_active' => true,
        ]);

        $product = Product::create([
            'name' => 'Chocolate Truffle Cake',
            'slug' => 'chocolate-truffle-cake',
            'sku' => 'CAKE-TRUFFLE-1',
            'category_id' => $category->id,
            'base_price' => 500.00,
            'is_available' => true,
        ]);

        $outlet = Outlet::create([
            'name' => 'Indiranagar Ammas Pastries',
            'code' => 'AMP-IND',
            'address' => '100ft Road, Indiranagar',
            'area' => 'Indiranagar',
            'city' => 'Bengaluru',
            'pincode' => '560038',
            'phone' => '9876543210',
            'is_active' => true,
        ]);

        $payload = [
            'outlet_id' => $outlet->id,
            'customer_name' => 'Aditi Rao',
            'customer_phone' => '9876543210',
            'customer_email' => 'aditi@example.com',
            'delivery_method' => 'home_delivery',
            'delivery_address' => 'Flat 402, Sunshine Apartments, 12th Main',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => now('Asia/Kolkata')->addDays(1)->format('Y-m-d'),
            'delivery_time_slot' => '12:00 PM - 02:00 PM',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ]
            ],
        ];

        $response = $this->postJson('/api/orders/create', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $order = \App\Models\Order::first();
        $this->assertNotNull($order);
        $this->assertEquals('home_delivery', $order->delivery_method);
        $this->assertEquals(500.00, (float) $order->subtotal);
        $this->assertEquals(100.00, (float) $order->delivery_fee);
        // Tax (GST) must be strictly 0.00
        $this->assertEquals(0.00, (float) $order->tax);
        // Total = 500 + 100 = 600
        $this->assertEquals(600.00, (float) $order->total);
    }

    public function test_outlet_pickup_adds_zero_fee_and_zero_gst()
    {
        $category = Category::create([
            'name' => 'Cakes & Pastries',
            'slug' => 'cakes-pastries',
            'is_active' => true,
        ]);

        $product = Product::create([
            'name' => 'Red Velvet Heart Cake',
            'slug' => 'red-velvet-heart-cake',
            'sku' => 'CAKE-RED-2',
            'category_id' => $category->id,
            'base_price' => 750.00,
            'is_available' => true,
        ]);

        $outlet = Outlet::create([
            'name' => 'Koramangala Ammas Pastries',
            'code' => 'AMP-KOR',
            'address' => '5th Block, Koramangala',
            'area' => 'Koramangala',
            'city' => 'Bengaluru',
            'pincode' => '560034',
            'phone' => '9876543211',
            'is_active' => true,
        ]);

        $payload = [
            'outlet_id' => $outlet->id,
            'customer_name' => 'Karan Mehta',
            'customer_phone' => '9876543211',
            'delivery_method' => 'pickup',
            'delivery_date' => now('Asia/Kolkata')->addDays(1)->format('Y-m-d'),
            'delivery_time_slot' => '04:00 PM - 06:00 PM',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2, // 750 * 2 = 1500
                ]
            ],
        ];

        $response = $this->postJson('/api/orders/create', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $order = \App\Models\Order::where('customer_name', 'Karan Mehta')->first();
        $this->assertNotNull($order);
        $this->assertEquals('pickup', $order->delivery_method);
        $this->assertEquals(1500.00, (float) $order->subtotal);
        $this->assertEquals(0.00, (float) $order->delivery_fee);
        // Tax (GST) must be strictly 0.00
        $this->assertEquals(0.00, (float) $order->tax);
        // Total = 1500 + 0 = 1500
        $this->assertEquals(1500.00, (float) $order->total);
    }
}
