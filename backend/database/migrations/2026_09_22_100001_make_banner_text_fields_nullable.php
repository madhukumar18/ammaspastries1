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
            DB::statement('ALTER TABLE banners MODIFY COLUMN button_text VARCHAR(100) NULL DEFAULT NULL;');
            DB::statement('ALTER TABLE banners MODIFY COLUMN title VARCHAR(255) NULL DEFAULT NULL;');
            DB::statement('ALTER TABLE banners MODIFY COLUMN button_url VARCHAR(255) NULL DEFAULT NULL;');
        } else {
            Schema::table('banners', function (Blueprint $table) {
                $table->string('button_text')->nullable()->change();
                $table->string('title')->nullable()->change();
                $table->string('button_url')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE banners MODIFY COLUMN button_text VARCHAR(100) NOT NULL DEFAULT 'Order Now';");
            DB::statement("ALTER TABLE banners MODIFY COLUMN title VARCHAR(255) NOT NULL;");
            DB::statement("ALTER TABLE banners MODIFY COLUMN button_url VARCHAR(255) NOT NULL DEFAULT '/cakes';");
        } else {
            Schema::table('banners', function (Blueprint $table) {
                $table->string('button_text')->nullable(false)->default('Order Now')->change();
                $table->string('title')->nullable(false)->change();
                $table->string('button_url')->nullable(false)->default('/cakes')->change();
            });
        }
    }
};
