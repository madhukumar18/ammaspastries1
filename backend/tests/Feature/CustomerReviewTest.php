<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Admin;
use App\Models\Role;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CustomerReviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Review Admin',
            'email' => 'reviewadmin@ammaspastries.in',
            'password' => bcrypt('AdminSecret123!'),
            'role' => 'admin',
        ]);
    }

    public function test_customer_can_submit_review_and_it_saves_and_publishes_directly(): void
    {
        $payload = [
            'customer_name' => 'Kavitha Ramesh',
            'customer_location' => 'Jayanagar, Bengaluru',
            'rating' => 5,
            'comment' => 'The Dutch Truffle cake was extraordinarily fresh and decadent! Delivered in 40 mins.',
        ];

        $response = $this->postJson('/api/reviews/submit', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Thank you for your feedback! Your review is now published.',
            ]);

        $this->assertDatabaseHas('reviews', [
            'customer_name' => 'Kavitha Ramesh',
            'rating' => 5,
            'is_approved' => true,
        ]);
    }

    public function test_customer_can_fetch_all_reviews_with_aggregate_stats(): void
    {
        Review::create([
            'customer_name' => 'Aarav Kumar',
            'customer_location' => 'Indiranagar',
            'rating' => 5,
            'comment' => 'Loved the Belgian Chocolate Dream Cake!',
            'is_approved' => true,
        ]);

        Review::create([
            'customer_name' => 'Sneha Patil',
            'customer_location' => 'Whitefield',
            'rating' => 4,
            'comment' => 'Fresh red velvet pastry, timely delivery.',
            'is_approved' => true,
        ]);

        $response = $this->getJson('/api/reviews?all=1');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'stats' => [
                    'total',
                    'average_rating',
                    'breakdown',
                ],
            ]);

        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(4.5, $response->json('stats.average_rating'));
    }

    public function test_customer_cannot_delete_reviews(): void
    {
        $review = Review::create([
            'customer_name' => 'Test Customer',
            'customer_location' => 'Bengaluru',
            'rating' => 5,
            'comment' => 'Great taste.',
            'is_approved' => true,
        ]);

        // 1. Regular customer attempting to delete via public route (does not exist)
        $publicDelete = $this->deleteJson("/api/reviews/{$review->id}");
        $publicDelete->assertStatus(405); // Method Not Allowed (no public delete route)

        // 2. Unauthenticated user attempting to delete via admin route
        $unauthDelete = $this->deleteJson("/api/admin/reviews/{$review->id}");
        $unauthDelete->assertStatus(401);

        // 3. Regular customer (non-admin) attempting to delete via admin route
        $customer = User::create([
            'name' => 'Normal Customer',
            'email' => 'customer@example.com',
            'password' => bcrypt('password'),
        ]);

        $customerDelete = $this->actingAs($customer, 'sanctum')
            ->deleteJson("/api/admin/reviews/{$review->id}");
        $customerDelete->assertStatus(403); // Forbidden

        // Review must still exist
        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
        ]);
    }

    public function test_only_authorized_admin_can_delete_reviews(): void
    {
        $review = Review::create([
            'customer_name' => 'Spam Customer',
            'customer_location' => 'Unknown',
            'rating' => 1,
            'comment' => 'Spam comment',
            'is_approved' => true,
        ]);

        $adminDelete = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/reviews/{$review->id}");

        $adminDelete->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('reviews', [
            'id' => $review->id,
        ]);
    }
}
