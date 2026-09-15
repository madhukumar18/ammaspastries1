<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CategoryImage;
use App\Models\Setting;
use Illuminate\Support\Str;

class AdminCategoryImageController extends Controller
{
    /**
     * Display a listing of all category images.
     */
    public function index()
    {
        $categoryImages = CategoryImage::orderBy('display_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categoryImages,
        ]);
    }

    /**
     * Store a newly created category image.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'image_url' => 'required|string',
            'target_url' => 'required|string|max:255',
            'badge_text' => 'nullable|string|max:100',
            'display_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (!isset($validated['display_order'])) {
            $maxOrder = CategoryImage::max('display_order') ?? 0;
            $validated['display_order'] = $maxOrder + 1;
        }

        $validated['is_active'] = $request->has('is_active') ? (bool)$request->is_active : true;

        $categoryImage = CategoryImage::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category image created successfully!',
            'data' => $categoryImage,
        ], 201);
    }

    /**
     * Update the specified category image.
     */
    public function update(Request $request, $id)
    {
        $categoryImage = CategoryImage::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'image_url' => 'sometimes|required|string',
            'target_url' => 'sometimes|required|string|max:255',
            'badge_text' => 'nullable|string|max:100',
            'display_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if (!empty($validated['name']) && empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $categoryImage->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category image updated successfully!',
            'data' => $categoryImage,
        ]);
    }

    /**
     * Remove the specified category image.
     */
    public function destroy($id)
    {
        $categoryImage = CategoryImage::findOrFail($id);
        $categoryImage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category image deleted successfully.',
        ]);
    }

    /**
     * Toggle active status.
     */
    public function toggleStatus($id)
    {
        $categoryImage = CategoryImage::findOrFail($id);
        $categoryImage->is_active = !$categoryImage->is_active;
        $categoryImage->save();

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully.',
            'data' => $categoryImage,
        ]);
    }

    /**
     * Reset to navbar default categories.
     */
    public function resetDefaults()
    {
        CategoryImage::truncate();

        foreach (CategoryImage::getDefaultCategories() as $cat) {
            CategoryImage::create($cat);
        }

        $fresh = CategoryImage::orderBy('display_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Restored all secondary navbar categories with default imagery!',
            'data' => $fresh,
        ]);
    }

    /**
     * Get carousel behavior & display settings.
     */
    public function getSettings()
    {
        $settings = [
            'badge_text' => Setting::getVal('category_carousel_badge', 'Explore Bakery Specialties'),
            'title' => Setting::getVal('category_carousel_title', 'Fresh Confectionery Categories'),
            'subtitle' => Setting::getVal('category_carousel_subtitle', 'Click any category to order fresh artisan creations'),
            'auto_scroll' => filter_var(Setting::getVal('category_carousel_auto_scroll', 'true'), FILTER_VALIDATE_BOOLEAN),
            'scroll_speed' => (float) Setting::getVal('category_carousel_speed', 0.85),
            'pause_on_hover' => filter_var(Setting::getVal('category_carousel_pause_on_hover', 'true'), FILTER_VALIDATE_BOOLEAN),
            'show_arrows' => filter_var(Setting::getVal('category_carousel_show_arrows', 'true'), FILTER_VALIDATE_BOOLEAN),
            'show_bottom_hint' => filter_var(Setting::getVal('category_carousel_show_hint', 'true'), FILTER_VALIDATE_BOOLEAN),
            'bottom_hint' => Setting::getVal('category_carousel_hint_text', 'Click any category circle to browse full catalog'),
        ];

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update carousel behavior & display settings.
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'badge_text' => 'nullable|string|max:100',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'auto_scroll' => 'required|boolean',
            'scroll_speed' => 'required|numeric|min:0.2|max:3.0',
            'pause_on_hover' => 'required|boolean',
            'show_arrows' => 'required|boolean',
            'show_bottom_hint' => 'required|boolean',
            'bottom_hint' => 'nullable|string|max:255',
        ]);

        Setting::setVal('category_carousel_badge', $validated['badge_text'] ?? '', 'category_carousel');
        Setting::setVal('category_carousel_title', $validated['title'], 'category_carousel');
        Setting::setVal('category_carousel_subtitle', $validated['subtitle'] ?? '', 'category_carousel');
        Setting::setVal('category_carousel_auto_scroll', $validated['auto_scroll'] ? 'true' : 'false', 'category_carousel');
        Setting::setVal('category_carousel_speed', (string)$validated['scroll_speed'], 'category_carousel');
        Setting::setVal('category_carousel_pause_on_hover', $validated['pause_on_hover'] ? 'true' : 'false', 'category_carousel');
        Setting::setVal('category_carousel_show_arrows', $validated['show_arrows'] ? 'true' : 'false', 'category_carousel');
        Setting::setVal('category_carousel_show_hint', $validated['show_bottom_hint'] ? 'true' : 'false', 'category_carousel');
        Setting::setVal('category_carousel_hint_text', $validated['bottom_hint'] ?? '', 'category_carousel');

        return response()->json([
            'success' => true,
            'message' => 'Carousel display & behavior settings saved successfully!',
            'data' => $validated,
        ]);
    }
}
