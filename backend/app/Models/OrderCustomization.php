<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderCustomization extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_id',
        'name_on_cake',
        'description',
        'cake_size',
        'flavour',
        'is_eggless',
        'photo_cake_upload_id',
    ];

    protected function casts(): array
    {
        return [
            'is_eggless' => 'boolean',
        ];
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function photoUpload()
    {
        return $this->belongsTo(PhotoCakeUpload::class, 'photo_cake_upload_id');
    }
}
