<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class AdminSessionTimeoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_admin_login_issues_valid_token()
    {
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
                'admin' => [
                    'id',
                    'name',
                    'email',
                    'role',
                ],
            ],
        ]);
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_admin_request_succeeds_with_valid_token()
    {
        $admin = Admin::firstOrCreate(
            ['email' => 'mkumar200418@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('secret123'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        $token = $admin->createToken('admin_token', ['admin'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/me');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_admin_request_fails_with_401_when_unauthenticated()
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid_or_expired_token')
            ->getJson('/api/admin/me');

        $response->assertStatus(401);
    }
}
