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
            // Cakes & Pastries Sale Options: Sell by kg
            $table->boolean('sell_by_kg')->nullable()->default(true)->after('weight');
            $table->decimal('kg_step', 4, 2)->nullable()->default(0.50)->after('sell_by_kg');
            $table->decimal('kg_default', 4, 2)->nullable()->default(0.50)->after('kg_step');
            $table->decimal('kg_max', 4, 2)->nullable()->default(10.00)->after('kg_default');
            $table->decimal('kg_price', 10, 2)->nullable()->after('kg_max');

            // Cakes & Pastries Sale Options: Sell by pieces
            $table->boolean('sell_by_pieces')->nullable()->default(false)->after('kg_price');
            $table->integer('piece_default')->nullable()->default(1)->after('sell_by_pieces');
            $table->integer('piece_step')->nullable()->default(1)->after('piece_default');
            $table->integer('piece_max')->nullable()->default(20)->after('piece_step');
            // piece_price already exists on products table
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'sell_by_kg',
                'kg_step',
                'kg_default',
                'kg_max',
                'kg_price',
                'sell_by_pieces',
                'piece_default',
                'piece_step',
                'piece_max',
            ]);
        });
    }
};
