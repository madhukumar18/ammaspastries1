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
            if (!Schema::hasColumn('products', 'chocolate_pack_options')) {
                $table->json('chocolate_pack_options')->nullable()->after('dry_fruit_pack_options');
            }
            if (!Schema::hasColumn('products', 'chocolate_pricing_type')) {
                $table->string('chocolate_pricing_type', 20)->nullable()->default('weight')->after('chocolate_pack_options');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'chocolate_pricing_type')) {
                $table->dropColumn('chocolate_pricing_type');
            }
            if (Schema::hasColumn('products', 'chocolate_pack_options')) {
                $table->dropColumn('chocolate_pack_options');
            }
        });
    }
};
