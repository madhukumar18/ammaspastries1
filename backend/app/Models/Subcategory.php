<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'image_url',
        'display_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
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
