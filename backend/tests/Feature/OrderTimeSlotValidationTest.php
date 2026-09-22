<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Outlet;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTimeSlotValidationTest extends TestCase
{
    use RefreshDatabase;

    protected Outlet $outlet;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::firstOrCreate(
            ['slug' => 'cakes-pastries'],
            ['name' => 'Cakes & Pastries', 'is_active' => true]
        );

        $this->outlet = Outlet::create([
            'name' => 'Indiranagar Bakery',
            'code' => 'AMMAS-IND-01',
            'address' => '100ft Road, Indiranagar',
            'area' => 'Indiranagar',
            'city' => 'Bengaluru',
            'pincode' => '560038',
            'phone' => '9876543210',
            'email' => 'indiranagar@ammaspastries.in',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'name' => 'Signature Dutch Truffle Cake',
            'slug' => 'signature-dutch-truffle-cake',
            'category_id' => $category->id,
            'base_price' => 550.00,
            'is_available' => true,
        ]);
    }

    public function test_rejects_order_for_past_date(): void
    {
        // Current date is 22nd
        Carbon::setTestNow(Carbon::parse('2026-09-22 13:00:00', 'Asia/Kolkata'));

        // Customer attempts to select 21st (yesterday)
        $response = $this->postJson('/api/orders/create', [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'John Doe',
            'customer_phone' => '9876543210',
            'delivery_address' => '42 Park Avenue',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => '2026-09-21',
            'delivery_time_slot' => '02:00:00 PM',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => "Please select today's date or a future date.",
        ]);
    }

    public function test_rejects_order_outside_operating_hours_morning(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-22 07:00:00', 'Asia/Kolkata'));

        $response = $this->postJson('/api/orders/create', [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'John Doe',
            'customer_phone' => '9876543210',
            'delivery_address' => '42 Park Avenue',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => '2026-09-22',
            'delivery_time_slot' => '08:30:00 AM',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Orders can only be placed between 9:00 AM and 10:30 PM.',
        ]);
    }

    public function test_rejects_order_outside_operating_hours_night(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-22 14:00:00', 'Asia/Kolkata'));

        $response = $this->postJson('/api/orders/create', [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'John Doe',
            'customer_phone' => '9876543210',
            'delivery_address' => '42 Park Avenue',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => '2026-09-22',
            'delivery_time_slot' => '11:00:00 PM',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Orders can only be placed between 9:00 AM and 10:30 PM.',
        ]);
    }

    public function test_rejects_order_with_less_than_45_minutes_lead_time_today(): void
    {
        // Set current time to 12:00:00 PM
        Carbon::setTestNow(Carbon::parse('2026-09-22 12:00:00', 'Asia/Kolkata'));

        // Customer selects 12:30:00 PM (only 30 mins lead time, needs >= 45 mins)
        $response = $this->postJson('/api/orders/create', [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'John Doe',
            'customer_phone' => '9876543210',
            'delivery_address' => '42 Park Avenue',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => '2026-09-22',
            'delivery_time_slot' => '12:30:00 PM',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Please select a time at least 45 minutes from now.',
        ]);
    }

    public function test_accepts_order_with_45_minutes_or_more_lead_time(): void
    {
        // Set current time to 12:00:00 PM
        Carbon::setTestNow(Carbon::parse('2026-09-22 12:00:00', 'Asia/Kolkata'));

        // Customer selects 12:45:00 PM (exactly 45 mins ahead, within operating hours)
        $response = $this->postJson('/api/orders/create', [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'John Doe',
            'customer_phone' => '9876543210',
            'delivery_address' => '42 Park Avenue',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => '2026-09-22',
            'delivery_time_slot' => '12:45:00 PM',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
        ]);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $this->assertEquals('12:45:00 PM', $response->json('data.delivery_time_slot'));
    }

    public function test_accepts_order_for_future_date_within_operating_hours(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-22 18:00:00', 'Asia/Kolkata'));

        // Customer schedules for tomorrow morning 10:00:00 AM
        $response = $this->postJson('/api/orders/create', [
            'outlet_id' => $this->outlet->id,
            'customer_name' => 'Jane Smith',
            'customer_phone' => '9876543210',
            'delivery_address' => '42 Park Avenue',
            'delivery_area' => 'Indiranagar',
            'delivery_city' => 'Bengaluru',
            'delivery_pincode' => '560038',
            'delivery_date' => '2026-09-23',
            'delivery_time_slot' => '10:00:00 AM',
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
        ]);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $this->assertEquals('10:00:00 AM', $response->json('data.delivery_time_slot'));
    }
}
