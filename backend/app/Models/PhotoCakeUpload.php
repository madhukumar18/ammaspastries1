<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PhotoCakeUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'original_filename',
        'stored_path',
        'mime_type',
        'file_size',
        'preview_token',
        'uploader_ip',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
