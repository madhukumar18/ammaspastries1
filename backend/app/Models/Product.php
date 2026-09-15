<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'category_id',
        'subcategory_id',
        'short_description',
        'description',
        'base_price',
        'discount_price',
        'weight',
        'portion_type',
        'portion_unit',
        'portion_step',
        'piece_price',
        'piece_limit',
        'piece_min',
        'is_eggless',
        'stock',
        'is_available',
        'is_featured',
        'is_popular',
        'is_new_arrival',
        'is_gifting',
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'float',
            'discount_price' => 'float',
            'piece_price' => 'float',
            'piece_limit' => 'integer',
            'piece_min' => 'integer',
            'is_eggless' => 'boolean',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_popular' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_gifting' => 'boolean',
            'stock' => 'integer',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('display_order', 'asc');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }
}
