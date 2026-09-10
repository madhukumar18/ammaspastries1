<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Outlet;

class OutletController extends Controller
{
    public function index()
    {
        $outlets = Outlet::where('is_active', true)->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $outlets,
        ]);
    }

    public function show($id)
    {
        $outlet = Outlet::where('is_active', true)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $outlet,
        ]);
    }
}
