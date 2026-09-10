<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulk_orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('email');
            $table->string('phone', 20);
            $table->string('order_type')->default('message'); // 'csv' or 'message'
            $table->text('message')->nullable();
            $table->string('csv_filename')->nullable();
            $table->string('csv_filepath')->nullable();
            $table->integer('total_items_count')->default(0);
            $table->string('status')->default('pending'); // pending, reviewed, in_progress, completed, rejected
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('bulk_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_order_id')->constrained('bulk_orders')->cascadeOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            $table->date('preferred_date')->nullable();
            $table->string('preferred_time')->nullable();
            $table->string('outlet')->nullable();
            $table->text('special_instructions')->nullable();
            $table->timestamps();
        });

        Schema::create('bulk_imports', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->integer('total_rows')->default(0);
            $table->integer('valid_rows')->default(0);
            $table->string('status')->default('uploaded');
            $table->json('validation_errors')->nullable();
            $table->timestamps();
        });

        Schema::create('franchise_enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 20);
            $table->string('city')->nullable();
            $table->string('investment_budget')->nullable();
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->string('status')->default('new'); // new, contacted, closed
            $table->timestamps();
        });

        Schema::create('contact_enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 20)->nullable();
            $table->string('subject')->nullable();
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->string('status')->default('new');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_enquiries');
        Schema::dropIfExists('franchise_enquiries');
        Schema::dropIfExists('bulk_imports');
        Schema::dropIfExists('bulk_order_items');
        Schema::dropIfExists('bulk_orders');
    }
};
