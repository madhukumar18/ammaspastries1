<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Outlet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'address',
        'area',
        'city',
        'state',
        'pincode',
        'latitude',
        'longitude',
        'map_link',
        'phone',
        'opening_time',
        'closing_time',
        'is_active',
        'rista_store_id',
        'rista_pos_enabled',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_active' => 'boolean',
            'rista_pos_enabled' => 'boolean',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
