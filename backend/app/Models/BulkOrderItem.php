<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BulkOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bulk_order_id',
        'product_name',
        'quantity',
        'preferred_date',
        'preferred_time',
        'outlet',
        'special_instructions',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'preferred_date' => 'date',
        ];
    }

    public function bulkOrder()
    {
        return $this->belongsTo(BulkOrder::class);
    }
}
