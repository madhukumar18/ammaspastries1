<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // e.g. AMP-MGR
            $table->text('address');
            $table->string('area');
            $table->string('city');
            $table->string('state')->default('Karnataka');
            $table->string('pincode', 10);
            $table->string('phone', 20);
            $table->string('opening_time')->default('10:00 AM');
            $table->string('closing_time')->default('10:00 PM');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlets');
    }
};
