<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GiftingProduct;
use App\Models\DreamCake;
use App\Models\Product;

class AdminGiftingController extends Controller
{
    // Gifting Products
    public function getGifting()
    {
        $items = GiftingProduct::with(['product'])->orderBy('display_order', 'asc')->get();
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function addGifting(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id|unique:gifting_products,product_id',
            'display_order' => 'integer',
        ]);

        $item = GiftingProduct::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product added to Popular in Gifting!',
            'data' => $item->load('product'),
        ], 201);
    }

    public function removeGifting($id)
    {
        $item = GiftingProduct::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product removed from gifting.',
        ]);
    }

    // Dream Cake
    public function getDreamCake()
    {
        $item = DreamCake::with(['product'])->first();
        return response()->json(['success' => true, 'data' => $item]);
    }

    public function updateDreamCake(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'badge' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $item = DreamCake::first();
        if ($item) {
            $item->update($validated);
        } else {
            $item = DreamCake::create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Dream Cake feature updated successfully!',
            'data' => $item->load('product'),
        ]);
    }
}
