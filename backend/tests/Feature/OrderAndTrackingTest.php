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

    public function test_order_remains_pending_until_online_payment_verification_is_successful(): void
    {
        $payload = [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'Priya Nair',
            'customer_phone' => '9999988888',
            'customer_email' => 'priya@example.com',
            'delivery_address' => '45 Residency Road',
            'delivery_area' => 'Residency Road',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560025',
            'delivery_date' => date('Y-m-d'),
            'delivery_time_slot' => '05:00 PM - 08:00 PM',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                ]
            ]
        ];

        $response = $this->postJson('/api/orders/create', $payload);
        $response->assertStatus(201);

        $orderId = $response->json('data.order_id');
        $order = \App\Models\Order::findOrFail($orderId);

        $this->assertSame('pending', $order->payment_status);
        $this->assertSame('pending_payment', $order->order_status);

        $paymentResponse = $this->postJson('/api/payments/razorpay/verify', [
            'order_id' => $orderId,
            'razorpay_order_id' => 'order_test_' . $order->order_number,
            'razorpay_payment_id' => 'pay_test_123456',
            'razorpay_signature' => 'sig_test_sandbox_verified',
        ]);

        $paymentResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('confirmed', $order->order_status);
    }

    public function test_can_create_order_with_synthetic_or_null_variant_id(): void
    {
        $payload = [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'Synthetic Variant Test',
            'customer_phone' => '9876543210',
            'customer_email' => 'test_variant@example.com',
            'delivery_address' => '456 Brigade Road',
            'delivery_area' => 'MG Road',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560001',
            'delivery_date' => date('Y-m-d'),
            'delivery_time_slot' => '12:00 PM - 02:00 PM',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => 'default-0',
                    'quantity' => 1,
                    'customization' => [
                        'selected_weight_portion' => '1kg',
                        'unit_price' => 899,
                    ],
                ]
            ]
        ];

        $response = $this->postJson('/api/orders/create', $payload);
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $orderId = $response->json('data.order_id');
        $order = \App\Models\Order::with('items')->findOrFail($orderId);
        $this->assertCount(1, $order->items);
        $this->assertNull($order->items[0]->variant_id);
        $this->assertEquals(899.0, (float) $order->items[0]->unit_price);
        $this->assertEquals('1kg', $order->items[0]->variant_title);
    }
}
