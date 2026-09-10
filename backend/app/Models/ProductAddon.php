<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'image_url',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'is_available' => 'boolean',
        ];
    }
}
