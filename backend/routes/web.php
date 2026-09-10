<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }
    return response()->json([
        'status' => 'online',
        'app' => 'Ammas Pastries API Service',
        'version' => '1.0.0',
        'api_docs' => '/api',
    ]);
});

Route::fallback(function () {
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }
    return response()->json([
        'error' => 'Not Found',
        'message' => 'The requested web route does not exist.',
    ], 404);
});

