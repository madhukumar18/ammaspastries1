<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class AdminSessionTimeoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_admin_login_issues_token_with_11_hour_expiry()
    {
        Carbon::setTestNow(Carbon::parse('2026-09-18 10:00:00'));

        $admin = Admin::firstOrCreate(
            ['email' => 'mkumar200418@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );
        $admin->password = Hash::make('secret123');
        $admin->save();

        $response = $this->postJson('/api/admin/login', [
            'email' => 'mkumar200418@gmail.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'token',
                'session' => [
                    'expires_at',
                    'expires_in_seconds',
                    'lifetime_hours',
                ],
            ],
        ]);

        $this->assertEquals(11, $response->json('data.session.lifetime_hours'));
        $this->assertEquals(39600, $response->json('data.session.expires_in_seconds'));

        // Expected expiry is 2026-09-18 21:00:00 UTC
        $expectedExpiry = Carbon::parse('2026-09-18 21:00:00')->toIso8601String();
        $this->assertEquals($expectedExpiry, Carbon::parse($response->json('data.session.expires_at'))->toIso8601String());

        Carbon::setTestNow();
    }

    public function test_admin_request_succeeds_within_11_hours()
    {
        $loginTime = Carbon::parse('2026-09-18 10:00:00');
        Carbon::setTestNow($loginTime);

        $admin = Admin::firstOrCreate(
            ['email' => 'mkumar200418@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        $token = $admin->createToken('admin_token', ['admin'], $loginTime->copy()->addHours(11))->plainTextToken;

        // Travel 10 hours and 59 minutes forward (within 11 hours)
        Carbon::setTestNow($loginTime->copy()->addHours(10)->addMinutes(59));

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/me');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        Carbon::setTestNow();
    }

    public function test_admin_request_fails_with_401_session_expired_after_11_hours()
    {
        $loginTime = Carbon::parse('2026-09-18 10:00:00');
        Carbon::setTestNow($loginTime);

        $admin = Admin::firstOrCreate(
            ['email' => 'mkumar200418@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        $token = $admin->createToken('admin_token', ['admin'], $loginTime->copy()->addHours(11))->plainTextToken;

        // Travel 11 hours and 1 minute forward (past 11 hours)
        Carbon::setTestNow($loginTime->copy()->addHours(11)->addMinute());

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/me');

        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
            'error' => 'SESSION_EXPIRED',
            'message' => 'Your session has expired. Please log in again.',
        ]);

        // Verify that the token has expired
        $storedToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        $this->assertTrue(Carbon::now()->greaterThan($storedToken->expires_at));

        Carbon::setTestNow();
    }
}
