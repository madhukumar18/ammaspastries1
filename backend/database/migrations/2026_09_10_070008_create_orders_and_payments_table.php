<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // e.g. AMP1001
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets');

            // Customer contact & shipping snapshot
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone', 20);
            $table->text('delivery_address');
            $table->string('delivery_area');
            $table->string('delivery_city')->default('Bengaluru');
            $table->string('delivery_pincode', 10);

            // Financial calculations (strictly database verified)
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('coupon_code')->nullable();

            // Status tracking
            // Payment status: pending, paid, failed, refunded
            $table->string('payment_status')->default('pending');
            $table->string('payment_method')->default('razorpay');

            // Order status: pending_payment, confirmed, preparing, out_for_delivery, delivered, cancelled
            $table->string('order_status')->default('pending_payment');

            // Delivery schedule
            $table->date('delivery_date');
            $table->string('delivery_time_slot'); // e.g. "10:00 AM - 12:00 PM"
            $table->text('special_instructions')->nullable();

            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_title')->nullable(); // e.g. "1kg"
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity')->default(1);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });

        Schema::create('order_customizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->string('name_on_cake')->nullable();
            $table->text('description')->nullable();
            $table->string('cake_size')->nullable();
            $table->string('flavour')->nullable();
            $table->boolean('is_eggless')->default(true);
            $table->foreignId('photo_cake_upload_id')->nullable()->constrained('photo_cake_uploads')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('transaction_id')->nullable();
            $table->string('razorpay_order_id')->nullable()->index();
            $table->string('razorpay_payment_id')->nullable()->index();
            $table->string('razorpay_signature')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default('INR');
            $table->string('status')->default('created'); // created, authorized, captured, failed, refunded
            $table->json('gateway_response')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('event_id')->nullable();
            $table->string('event_type');
            $table->json('payload');
            $table->boolean('is_processed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhooks');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_customizations');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
