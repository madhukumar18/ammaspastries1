<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'float',
            'min_order_amount' => 'float',
            'max_discount' => 'float',
            'is_active' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function calculateDiscount($subtotal)
    {
        if (!$this->is_active) return 0;
        if ($this->min_order_amount > 0 && $subtotal < $this->min_order_amount) return 0;

        $now = now();
        if ($this->valid_from && $now->lt($this->valid_from)) return 0;
        if ($this->valid_until && $now->gt($this->valid_until)) return 0;

        $discount = 0;
        if ($this->discount_type === 'percentage') {
            $discount = ($subtotal * $this->discount_value) / 100;
            if ($this->max_discount && $discount > $this->max_discount) {
                $discount = $this->max_discount;
            }
        } else {
            $discount = min($this->discount_value, $subtotal);
        }

        return round($discount, 2);
    }
}
