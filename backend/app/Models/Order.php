<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'outlet_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'delivery_address',
        'delivery_area',
        'delivery_city',
        'delivery_pincode',
        'subtotal',
        'discount',
        'delivery_fee',
        'tax',
        'total',
        'coupon_code',
        'payment_status',
        'payment_method',
        'order_status',
        'delivery_date',
        'delivery_time_slot',
        'special_instructions',
        'pos_synced',
        'pos_sync_status',
        'pos_order_id',
        'pos_synced_at',
        'pos_error',
        'pos_payload',
        'pos_response',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'float',
            'discount' => 'float',
            'delivery_fee' => 'float',
            'tax' => 'float',
            'total' => 'float',
            'delivery_date' => 'date',
            'pos_synced' => 'boolean',
            'pos_synced_at' => 'datetime',
            'pos_payload' => 'array',
            'pos_response' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class)->withTrashed();
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment()
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    /**
     * Generate the next sequential customer order number starting from 62473
     */
    public static function generateNextOrderNumber(): string
    {
        $startNumber = 62473;

        try {
            $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
            if ($driver === 'mysql' || $driver === 'mariadb') {
                $maxOrder = \Illuminate\Support\Facades\DB::table('orders')
                    ->whereRaw("order_number REGEXP '^[0-9]+$'")
                    ->max(\Illuminate\Support\Facades\DB::raw("CAST(order_number AS UNSIGNED)"));
            } else {
                $maxOrder = \Illuminate\Support\Facades\DB::table('orders')
                    ->whereRaw("order_number GLOB '[0-9]*'")
                    ->max(\Illuminate\Support\Facades\DB::raw("CAST(order_number AS INTEGER)"));
            }

            $nextNumber = ($maxOrder && (int)$maxOrder >= $startNumber) ? ((int)$maxOrder + 1) : $startNumber;
        } catch (\Throwable $e) {
            $orders = static::pluck('order_number');
            $maxOrder = 0;
            foreach ($orders as $on) {
                if (is_numeric($on) && (int)$on > $maxOrder) {
                    $maxOrder = (int)$on;
                }
            }
            $nextNumber = ($maxOrder >= $startNumber) ? ($maxOrder + 1) : $startNumber;
        }

        while (static::where('order_number', (string)$nextNumber)->exists()) {
            $nextNumber++;
        }

        return (string)$nextNumber;
    }
}
