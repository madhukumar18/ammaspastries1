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
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
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
}
