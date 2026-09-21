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
            $table->decimal('theme_cake_default_weight', 8, 2)->nullable()->after('weight');
            $table->decimal('theme_cake_default_price', 10, 2)->nullable()->after('theme_cake_default_weight');
            $table->decimal('theme_cake_step_size', 8, 2)->default(1.00)->nullable()->after('theme_cake_default_price');
            $table->json('theme_cake_price_tiers')->nullable()->after('theme_cake_step_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'theme_cake_default_weight',
                'theme_cake_default_price',
                'theme_cake_step_size',
                'theme_cake_price_tiers',
            ]);
        });
    }
};
