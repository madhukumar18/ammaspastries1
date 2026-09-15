<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            // Drop existing restrictive foreign key
            try {
                DB::statement('ALTER TABLE orders DROP FOREIGN KEY orders_outlet_id_foreign;');
            } catch (\Throwable $e) {
                // Ignore if already dropped
            }

            // Modify column to be nullable
            DB::statement('ALTER TABLE orders MODIFY COLUMN outlet_id BIGINT UNSIGNED NULL;');

            // Re-add foreign key with ON DELETE SET NULL
            DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_outlet_id_foreign FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE SET NULL;');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['outlet_id']);
                $table->unsignedBigInteger('outlet_id')->nullable()->change();
                $table->foreign('outlet_id')->references('id')->on('outlets')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            try {
                DB::statement('ALTER TABLE orders DROP FOREIGN KEY orders_outlet_id_foreign;');
            } catch (\Throwable $e) {
                // Ignore
            }

            DB::statement('ALTER TABLE orders MODIFY COLUMN outlet_id BIGINT UNSIGNED NOT NULL;');
            DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_outlet_id_foreign FOREIGN KEY (outlet_id) REFERENCES outlets(id);');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['outlet_id']);
                $table->unsignedBigInteger('outlet_id')->nullable(false)->change();
                $table->foreign('outlet_id')->references('id')->on('outlets');
            });
        }
    }
};
