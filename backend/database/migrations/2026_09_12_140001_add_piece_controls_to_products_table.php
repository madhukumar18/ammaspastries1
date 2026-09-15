<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'piece_price')) {
                $table->decimal('piece_price', 10, 2)->nullable()->after('portion_step');
            }
            if (!Schema::hasColumn('products', 'piece_limit')) {
                $table->integer('piece_limit')->nullable()->default(20)->after('piece_price');
            }
            if (!Schema::hasColumn('products', 'piece_min')) {
                $table->integer('piece_min')->nullable()->default(1)->after('piece_limit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['piece_price', 'piece_limit', 'piece_min']);
        });
    }
};
