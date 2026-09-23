<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\User;

class AdminMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@ammaspastries.in',
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_upload_valid_theme_cake_photo()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('theme_cake.jpg', 1200, 1200);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/upload', [
                'image' => $file,
                'folder' => 'theme-cakes',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => ['url', 'path', 'filename', 'size_kb', 'mime_type']
            ]);

        $path = $response->json('data.path');
        Storage::disk('public')->assertExists($path);
    }

    public function test_upload_rejects_non_image_files()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/upload', [
                'image' => $file,
                'folder' => 'theme-cakes',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    public function test_upload_rejects_dangerous_double_extension()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('malicious.php.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/media/upload', [
                'image' => $file,
                'folder' => 'theme-cakes',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'Upload Rejected',
            ]);
    }
}
