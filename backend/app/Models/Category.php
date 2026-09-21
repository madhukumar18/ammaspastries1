<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image',
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

    public function subcategories()
    {
        return $this->hasMany(Subcategory::class)->orderBy('display_order', 'asc');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Always normalize image to relative /storage/... so it loads over tunnels & mobile
     */
    public function getImageAttribute($value)
    {
        if (empty($value)) return $value;
        if (str_contains($value, '/storage/')) {
            return substr($value, strpos($value, '/storage/'));
        }
        return $value;
    }
}
