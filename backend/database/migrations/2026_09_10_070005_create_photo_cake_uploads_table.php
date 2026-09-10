<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photo_cake_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_id')->nullable()->index();
            $table->string('original_filename');
            $table->string('stored_path'); // stored securely in storage/app/photo_cakes
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('preview_token')->unique(); // temporary token for customer browser preview
            $table->string('uploader_ip', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photo_cake_uploads');
    }
};
