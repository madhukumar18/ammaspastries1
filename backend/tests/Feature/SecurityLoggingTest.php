<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Services\SecurityLoggerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityLoggingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear log file before each test
        SecurityLoggerService::clearLogs();
    }

    public function test_normal_request_is_not_blocked()
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(200);
    }

    public function test_sqli_attack_is_blocked_and_logged()
    {
        $response = $this->getJson('/api/search?q=' . urlencode("' UNION SELECT username, password FROM users--"));

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'status' => 403,
        ]);
        $response->assertJsonStructure(['incident_id']);

        // Check that it was written to security.log
        $logContent = File::get(SecurityLoggerService::getLogPath());
        $this->assertStringContainsString('SQL_INJECTION', $logContent);
        $this->assertStringContainsString('CRITICAL', $logContent);
    }

    public function test_sensitive_file_probe_is_blocked_and_logged()
    {
        $response = $this->getJson('/.env');

        $response->assertStatus(403);
        $logContent = File::get(SecurityLoggerService::getLogPath());
        $this->assertStringContainsString('SENSITIVE_FILE_SCAN', $logContent);
    }

    public function test_scanner_user_agent_is_blocked_and_logged()
    {
        $response = $this->withHeaders([
            'User-Agent' => 'sqlmap/1.6.12#stable (https://sqlmap.org)',
        ])->getJson('/api/products');

        $response->assertStatus(403);
        $logContent = File::get(SecurityLoggerService::getLogPath());
        $this->assertStringContainsString('SUSPICIOUS_SCANNER', $logContent);
    }

    public function test_admin_can_retrieve_security_logs_and_stats()
    {
        $admin = Admin::first() ?? Admin::create([
            'name' => 'Sec Admin',
            'email' => 'secadmin@ammaspastries.in',
            'password' => bcrypt('password123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin, ['admin']);

        // Trigger a test alert
        $alertRes = $this->postJson('/api/admin/security-logs/test-alert');
        $alertRes->assertStatus(200);
        $alertRes->assertJson(['success' => true]);

        // Get logs list
        $logsRes = $this->getJson('/api/admin/security-logs');
        $logsRes->assertStatus(200);
        $logsRes->assertJsonStructure([
            'success',
            'data' => [
                'data',
                'current_page',
                'total',
            ]
        ]);

        // Get stats
        $statsRes = $this->getJson('/api/admin/security-logs/stats');
        $statsRes->assertStatus(200);
        $statsRes->assertJson(['success' => true]);
        $statsRes->assertJsonStructure([
            'data' => [
                'total_incidents',
                'critical_threats',
                'file_size_formatted',
            ]
        ]);

        // Delete the incident
        $incidentId = $alertRes->json('data.incident_id');
        $deleteRes = $this->deleteJson("/api/admin/security-logs/{$incidentId}");
        $deleteRes->assertStatus(200);
        $deleteRes->assertJson(['success' => true]);

        // Verify it was removed from log file
        $logContent = File::get(SecurityLoggerService::getLogPath());
        $this->assertStringNotContainsString($incidentId, $logContent);
    }
}
