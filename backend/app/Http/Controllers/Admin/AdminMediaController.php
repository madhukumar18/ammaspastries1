<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminMediaController extends Controller
{
    /**
     * Upload an image from local gallery/device for cakes, banners, etc.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,jpg,gif|max:30720', // max 30MB
            'folder' => 'nullable|string|in:products,banners,general,theme-cakes,categories',
        ]);

        $folder = $request->input('folder', 'products');
        $file = $request->file('image');

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $cleanName = Str::slug($originalName);
        $extension = $file->getClientOriginalExtension();
        $fileName = $cleanName . '_' . time() . '_' . Str::random(6) . '.' . $extension;

        // Store in storage/app/public/uploads/{folder}
        $path = $file->storeAs("uploads/{$folder}", $fileName, 'public');

        $url = asset("storage/{$path}");

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully from local gallery!',
            'data' => [
                'url' => $url,
                'path' => $path,
                'filename' => $file->getClientOriginalName(),
                'size_kb' => round($file->getSize() / 1024, 2),
                'mime_type' => $file->getMimeType(),
            ]
        ]);
    }
}
