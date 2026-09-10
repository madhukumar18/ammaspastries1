<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Outlet;

class AdminOutletController extends Controller
{
    public function index()
    {
        $outlets = Outlet::orderBy('name', 'asc')->get();
        return response()->json(['success' => true, 'data' => $outlets]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:outlets',
            'address' => 'required|string',
            'area' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'pincode' => 'required|string|max:10',
            'phone' => 'required|string|max:20',
            'opening_time' => 'required|string|max:20',
            'closing_time' => 'required|string|max:20',
            'is_active' => 'boolean',
        ]);

        $outlet = Outlet::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Outlet added successfully!',
            'data' => $outlet,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $outlet = Outlet::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => "sometimes|required|string|max:50|unique:outlets,code,{$id}",
            'address' => 'sometimes|required|string',
            'area' => 'sometimes|required|string|max:100',
            'city' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'pincode' => 'sometimes|required|string|max:10',
            'phone' => 'sometimes|required|string|max:20',
            'opening_time' => 'sometimes|required|string|max:20',
            'closing_time' => 'sometimes|required|string|max:20',
            'is_active' => 'boolean',
        ]);

        $outlet->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Outlet updated successfully!',
            'data' => $outlet,
        ]);
    }

    public function destroy($id)
    {
        $outlet = Outlet::findOrFail($id);
        $outlet->delete();

        return response()->json([
            'success' => true,
            'message' => 'Outlet deleted successfully.',
        ]);
    }
}
