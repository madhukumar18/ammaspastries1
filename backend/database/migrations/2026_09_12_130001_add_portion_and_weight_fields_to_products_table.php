<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'portion_type')) {
                $table->string('portion_type', 20)->default('weight')->after('weight');
            }
            if (!Schema::hasColumn('products', 'portion_unit')) {
                $table->string('portion_unit', 50)->default('grams')->after('portion_type');
            }
            if (!Schema::hasColumn('products', 'portion_step')) {
                $table->string('portion_step', 50)->default('500g')->after('portion_unit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['portion_type', 'portion_unit', 'portion_step']);
        });
    }
};
