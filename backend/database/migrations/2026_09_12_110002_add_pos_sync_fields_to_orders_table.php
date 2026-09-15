<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'pos_synced')) {
                $table->boolean('pos_synced')->default(false)->after('order_status');
            }
            if (!Schema::hasColumn('orders', 'pos_sync_status')) {
                $table->string('pos_sync_status')->default('pending')->after('pos_synced'); // pending, synced, failed, skipped
            }
            if (!Schema::hasColumn('orders', 'pos_order_id')) {
                $table->string('pos_order_id')->nullable()->after('pos_sync_status');
            }
            if (!Schema::hasColumn('orders', 'pos_synced_at')) {
                $table->timestamp('pos_synced_at')->nullable()->after('pos_order_id');
            }
            if (!Schema::hasColumn('orders', 'pos_error')) {
                $table->text('pos_error')->nullable()->after('pos_synced_at');
            }
            if (!Schema::hasColumn('orders', 'pos_payload')) {
                $table->json('pos_payload')->nullable()->after('pos_error');
            }
            if (!Schema::hasColumn('orders', 'pos_response')) {
                $table->json('pos_response')->nullable()->after('pos_payload');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = [
                'pos_synced',
                'pos_sync_status',
                'pos_order_id',
                'pos_synced_at',
                'pos_error',
                'pos_payload',
                'pos_response',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
