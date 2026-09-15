<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\PhotoCakeUpload;
use App\Models\Setting;
use App\Http\Controllers\PhotoCakeController;

class AdminPhotoCakeController extends Controller
{
    /**
     * Get complete Photo Cake Studio configuration for Admin Management
     */
    public function getManagementConfig()
    {
        $defaults = PhotoCakeController::getDefaultConfig();

        $shapesRaw = Setting::getVal('photo_cake_shapes');
        $shapes = $shapesRaw ? json_decode($shapesRaw, true) : $defaults['shapes'];

        $dietaryRaw = Setting::getVal('photo_cake_dietary');
        $dietary = $dietaryRaw ? json_decode($dietaryRaw, true) : $defaults['dietary'];

        $flavoursRaw = Setting::getVal('photo_cake_flavours');
        $flavours = $flavoursRaw ? json_decode($flavoursRaw, true) : $defaults['flavours'];

        $flavours = array_map(function ($f) {
            if (!empty($f['weights']) && is_array($f['weights'])) {
                $f['weights'] = PhotoCakeController::sortWeightsAscending($f['weights']);
            }
            if (empty($f['min_order_weight']) && !empty($f['weights'])) {
                $f['min_order_weight'] = $f['weights'][0]['weight'] ?? '0.5kg (500g)';
            }
            return $f;
        }, $flavours);

        return response()->json([
            'success' => true,
            'data' => [
                'shapes' => $shapes,
                'dietary' => $dietary,
                'flavours' => $flavours,
            ]
        ]);
    }

    /**
     * Save Photo Cake Studio configuration (shapes, dietary, flavours, weights & prices)
     */
    public function saveManagementConfig(Request $request)
    {
        $request->validate([
            'shapes' => 'required|array',
            'dietary' => 'nullable|array',
            'flavours' => 'required|array',
        ]);

        $shapes = $request->input('shapes');
        $dietary = $request->input('dietary', []);
        $flavours = $request->input('flavours');

        // Always sort weights ascending from min to max kg
        $flavours = array_map(function ($f) {
            if (!empty($f['weights']) && is_array($f['weights'])) {
                $f['weights'] = PhotoCakeController::sortWeightsAscending($f['weights']);
            }
            if (empty($f['min_order_weight']) && !empty($f['weights'])) {
                $f['min_order_weight'] = $f['weights'][0]['weight'] ?? '0.5kg (500g)';
            }
            return $f;
        }, $flavours);

        Setting::setVal('photo_cake_shapes', json_encode($shapes), 'photo_cake');
        Setting::setVal('photo_cake_dietary', json_encode($dietary), 'photo_cake');
        Setting::setVal('photo_cake_flavours', json_encode($flavours), 'photo_cake');

        return response()->json([
            'success' => true,
            'message' => 'Photo cake configuration updated successfully!',
            'data' => [
                'shapes' => $shapes,
                'dietary' => $dietary,
                'flavours' => $flavours,
            ]
        ]);
    }

    /**
     * Upload a shape photo from local device storage
     */
    public function uploadShapeImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp,jpg|max:15360', // max 15MB
        ]);

        $file = $request->file('image');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $cleanName = Str::slug($originalName);
        $extension = $file->getClientOriginalExtension();
        $fileName = 'shape_' . $cleanName . '_' . time() . '_' . Str::random(6) . '.' . $extension;

        $path = $file->storeAs('uploads/photocakes', $fileName, 'public');
        $url = asset("storage/{$path}");

        return response()->json([
            'success' => true,
            'message' => 'Shape photo uploaded successfully from local device storage!',
            'data' => [
                'url' => $url,
                'path' => $path,
                'filename' => $file->getClientOriginalName(),
            ]
        ]);
    }

    /**
     * Authorization-protected preview endpoint for admin
     */
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

    /**
     * Authorization-protected binary file download endpoint for admin
     */
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
