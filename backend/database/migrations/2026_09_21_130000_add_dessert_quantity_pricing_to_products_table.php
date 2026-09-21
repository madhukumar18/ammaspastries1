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
            $table->unsignedInteger('dessert_min_quantity')->nullable()->default(1)->after('theme_cake_price_tiers');
            $table->decimal('dessert_default_price', 10, 2)->nullable()->after('dessert_min_quantity');
            $table->unsignedInteger('dessert_step_size')->default(1)->after('dessert_default_price');
            $table->json('dessert_price_tiers')->nullable()->after('dessert_step_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'dessert_min_quantity',
                'dessert_default_price',
                'dessert_step_size',
                'dessert_price_tiers',
            ]);
        });
    }
};
