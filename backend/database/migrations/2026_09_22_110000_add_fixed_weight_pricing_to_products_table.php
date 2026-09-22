<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('enable_fixed_weight_pricing')->nullable()->default(false)->after('piece_max');
            $table->json('fixed_weight_options')->nullable()->after('enable_fixed_weight_pricing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'enable_fixed_weight_pricing',
                'fixed_weight_options',
            ]);
        });
    }
};
