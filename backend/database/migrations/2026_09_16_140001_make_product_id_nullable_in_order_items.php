<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // Drop existing foreign key constraint if present
            try {
                Schema::table('order_items', function (Blueprint $table) {
                    $table->dropForeign(['product_id']);
                });
            } catch (\Throwable $e) {
                // Ignore if constraint name differs or already dropped
            }

            // Make product_id nullable and set null on delete
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('product_id')->nullable()->change();
                $table->foreign('product_id')
                    ->references('id')
                    ->on('products')
                    ->nullOnDelete();
            });
        } elseif ($driver === 'sqlite') {
            // SQLite table modification
            try {
                Schema::table('order_items', function (Blueprint $table) {
                    $table->unsignedBigInteger('product_id')->nullable()->change();
                });
            } catch (\Throwable $e) {
                // Ignore SQLite limitations
            }
        }
    }

    public function down(): void
    {
        // Reversible if needed
    }
};
