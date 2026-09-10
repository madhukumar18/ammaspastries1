<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BulkOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'email',
        'phone',
        'order_type',
        'message',
        'csv_filename',
        'csv_filepath',
        'total_items_count',
        'status',
        'admin_notes',
    ];

    public function items()
    {
        return $this->hasMany(BulkOrderItem::class);
    }
}
