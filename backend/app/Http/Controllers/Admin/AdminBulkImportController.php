<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BulkOrder;
use App\Models\BulkImport;

class AdminBulkImportController extends Controller
{
    // List bulk orders & CSV imports
    public function index()
    {
        $orders = BulkOrder::with(['items'])->orderBy('id', 'desc')->paginate(15);
        $imports = BulkImport::orderBy('id', 'desc')->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'bulk_orders' => $orders->items(),
                'imports' => $imports,
                'pagination' => [
                    'total' => $orders->total(),
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                ]
            ]
        ]);
    }

    public function show($id)
    {
        $order = BulkOrder::with(['items'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $order]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,reviewed,in_progress,completed,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $order = BulkOrder::findOrFail($id);
        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bulk order status updated.',
            'data' => $order,
        ]);
    }

    public function destroy($id)
    {
        $order = BulkOrder::findOrFail($id);
        $order->delete();

        return response()->json(['success' => true, 'message' => 'Record deleted.']);
    }
}
