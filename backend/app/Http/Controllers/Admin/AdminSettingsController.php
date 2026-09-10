<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\Policy;

class AdminSettingsController extends Controller
{
    // Get all key-value settings
    public function getSettings()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json(['success' => true, 'data' => $settings]);
    }

    // Update settings (delivery message, hours, contact, etc.)
    public function updateSettings(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $val) {
            Setting::setVal($key, (string) $val);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully!',
            'data' => Setting::all()->pluck('value', 'key'),
        ]);
    }

    // Policy CRUD
    public function getPolicies()
    {
        $policies = Policy::all();
        return response()->json(['success' => true, 'data' => $policies]);
    }

    public function updatePolicy(Request $request, $slug)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
        ]);

        $policy = Policy::where('slug', $slug)->firstOrFail();
        $policy->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Policy updated successfully!',
            'data' => $policy,
        ]);
    }
}
