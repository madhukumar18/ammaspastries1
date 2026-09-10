<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentWebhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'event_type',
        'payload',
        'is_processed',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'is_processed' => 'boolean',
        ];
    }
}
