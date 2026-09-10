<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\PhotoCakeUpload;

class PhotoCakeController extends Controller
{
    // Securely upload photo for custom photo cake
    public function upload(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,webp,jpg|max:5120', // max 5MB
        ]);

        $file = $request->file('photo');
        $originalFilename = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $fileSize = $file->getSize();

        // Generate safe unique filename and store in protected storage
        $storedName = 'photocake_' . date('Ymd_His') . '_' . Str::random(16) . '.' . $file->getClientOriginalExtension();
        $storedPath = $file->storeAs('photo_cakes', $storedName);

        $previewToken = Str::random(40);

        $upload = PhotoCakeUpload::create([
            'user_id' => $request->user()?->id,
            'session_id' => $request->input('session_id', $previewToken),
            'original_filename' => $originalFilename,
            'stored_path' => $storedPath,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'preview_token' => $previewToken,
            'uploader_ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully! Preview generated.',
            'data' => [
                'upload_id' => $upload->id,
                'preview_token' => $previewToken,
                'preview_url' => url("/api/photo-cakes/preview/{$previewToken}"),
                'original_filename' => $originalFilename,
            ]
        ]);
    }

    // Serve preview image to customer using token
    public function preview($token)
    {
        $upload = PhotoCakeUpload::where('preview_token', $token)->firstOrFail();

        if (!Storage::exists($upload->stored_path)) {
            abort(404, 'Uploaded image not found.');
        }

        $fileContent = Storage::get($upload->stored_path);
        return response($fileContent, 200)
            ->header('Content-Type', $upload->mime_type)
            ->header('Cache-Control', 'private, max-age=3600');
    }
}
