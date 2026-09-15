<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Product;
use App\Services\RistaPosService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RistaPosIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $adminToken;
    protected Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@ammaspastries.in',
            'role' => 'admin',
        ]);
        $this->adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        $this->outlet = Outlet::create([
            'name' => 'Ammas Pastries - Indiranagar',
            'code' => 'AMP-IND',
            'rista_store_id' => 'RSTA_STORE_101',
            'rista_pos_enabled' => true,
            'address' => '100ft Road, Indiranagar',
            'area' => 'Indiranagar',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '560038',
            'phone' => '080-25210011',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_get_rista_pos_config_and_stats(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/rista-pos/config');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.config.api_key', '761129c2-9fa5-416b-9cb4-333741520e8e')
            ->assertJsonStructure([
                'data' => [
                    'config' => ['base_url', 'api_key', 'api_secret_masked', 'auto_sync'],
                    'stats' => ['total_orders', 'synced_orders', 'failed_orders', 'pending_orders', 'mapped_outlets', 'total_outlets'],
                ]
            ]);
    }

    public function test_admin_can_update_outlet_rista_store_id(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson('/api/admin/rista-pos/outlets/' . $this->outlet->id, [
                'rista_store_id' => 'STORE_CUSTOM_999',
                'rista_pos_enabled' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.rista_store_id', 'STORE_CUSTOM_999');

        $this->assertDatabaseHas('outlets', [
            'id' => $this->outlet->id,
            'rista_store_id' => 'STORE_CUSTOM_999',
        ]);
    }

    public function test_rista_pos_service_pushes_order_and_records_payload(): void
    {
        Http::fake([
            '*/orders' => Http::response([
                'success' => true,
                'order_id' => 'RSTA_ORD_98765',
                'message' => 'Order created in POS terminal',
            ], 200),
        ]);

        $order = Order::create([
            'order_number' => 'AMP260912001',
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'Aditi Sharma',
            'customer_email' => 'aditi@example.com',
            'customer_phone' => '9876543210',
            'delivery_address' => 'Flat 402, Lotus Residency',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'subtotal' => 650.00,
            'discount' => 0.00,
            'delivery_fee' => 50.00,
            'tax' => 32.50,
            'total' => 732.50,
            'payment_status' => 'paid',
            'order_status' => 'confirmed',
            'delivery_date' => now()->addDay()->toDateString(),
            'delivery_time_slot' => '12:00 PM - 02:00 PM',
        ]);

        $service = app(RistaPosService::class);
        $result = $service->pushOrder($order);

        $this->assertTrue($result['success']);
        $this->assertEquals('RSTA_ORD_98765', $result['pos_order_id']);

        $order->refresh();
        $this->assertTrue($order->pos_synced);
        $this->assertEquals('synced', $order->pos_sync_status);
        $this->assertEquals('RSTA_ORD_98765', $order->pos_order_id);
        $this->assertNotNull($order->pos_synced_at);
        $this->assertEquals('RSTA_STORE_101', $order->pos_payload['store_id']);
        $this->assertEquals('Aditi Sharma', $order->pos_payload['customer']['name']);
        $this->assertEquals(732.50, $order->pos_payload['payment']['amount']);
    }

    public function test_admin_can_trigger_manual_order_sync(): void
    {
        Http::fake([
            '*/orders' => Http::response([
                'success' => true,
                'order_id' => 'RSTA_MANUAL_123',
            ], 200),
        ]);

        $order = Order::create([
            'order_number' => 'AMP260912002',
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'Rahul Verma',
            'customer_phone' => '9123456780',
            'delivery_address' => '12, 5th Cross',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'subtotal' => 500,
            'total' => 550,
            'payment_status' => 'paid',
            'order_status' => 'confirmed',
            'delivery_date' => now()->toDateString(),
            'delivery_time_slot' => '04:00 PM - 06:00 PM',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/rista-pos/orders/{$order->id}/sync");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.pos_order_id', 'RSTA_MANUAL_123')
            ->assertJsonPath('data.order.pos_sync_status', 'synced');
    }
}
