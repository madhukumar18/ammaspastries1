<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            if (!Schema::hasColumn('outlets', 'rista_store_id')) {
                $table->string('rista_store_id')->nullable()->after('code');
            }
            if (!Schema::hasColumn('outlets', 'rista_pos_enabled')) {
                $table->boolean('rista_pos_enabled')->default(true)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            if (Schema::hasColumn('outlets', 'rista_store_id')) {
                $table->dropColumn('rista_store_id');
            }
            if (Schema::hasColumn('outlets', 'rista_pos_enabled')) {
                $table->dropColumn('rista_pos_enabled');
            }
        });
    }
};
