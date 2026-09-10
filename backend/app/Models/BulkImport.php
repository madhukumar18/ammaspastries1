<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BulkImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'filename',
        'customer_name',
        'customer_phone',
        'total_rows',
        'valid_rows',
        'status',
        'validation_errors',
    ];

    protected function casts(): array
    {
        return [
            'total_rows' => 'integer',
            'valid_rows' => 'integer',
            'validation_errors' => 'array',
        ];
    }
}
