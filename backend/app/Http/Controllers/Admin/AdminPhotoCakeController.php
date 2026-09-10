<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\PhotoCakeUpload;
use App\Models\Order;

class AdminPhotoCakeController extends Controller
{
    // Authorization-protected preview endpoint for admin
    public function preview($uploadId)
    {
        $upload = PhotoCakeUpload::findOrFail($uploadId);

        if (!Storage::exists($upload->stored_path)) {
            abort(404, 'Photo file not found on disk.');
        }

        $fileContent = Storage::get($upload->stored_path);

        return response($fileContent, 200)
            ->header('Content-Type', $upload->mime_type)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Cache-Control', 'public, max-age=86400');
    }

    // Authorization-protected binary file download endpoint for admin
    public function download(Request $request, $uploadId)
    {
        $upload = PhotoCakeUpload::findOrFail($uploadId);

        if (!Storage::exists($upload->stored_path)) {
            abort(404, 'Photo file not found on disk.');
        }

        $orderNum = $request->input('order_number', 'Order');
        $nameOnCake = $request->input('name', '');
        $cleanName = $nameOnCake ? '_' . preg_replace('/[^a-zA-Z0-9]/', '', $nameOnCake) : '';
        $ext = pathinfo($upload->original_filename, PATHINFO_EXTENSION) ?: 'jpg';
        
        $downloadFilename = "AmmasPastries_PhotoCake_{$orderNum}{$cleanName}.{$ext}";

        return Storage::download($upload->stored_path, $downloadFilename, [
            'Content-Type' => $upload->mime_type,
            'Access-Control-Allow-Origin' => '*',
        ]);
    }
}
