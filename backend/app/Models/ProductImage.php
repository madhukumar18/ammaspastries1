<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'image_url',
        'is_primary',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Always normalize image_url to relative /storage/... so it loads over tunnels & mobile
     */
    public function getImageUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (str_contains($value, '/storage/')) {
            return substr($value, strpos($value, '/storage/'));
        }
        return $value;
    }
}
