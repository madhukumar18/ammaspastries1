<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['outlet', 'items.customization.photoUpload', 'latestPayment']);

        // Search by order number, phone, customer name
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                  ->orWhere('customer_name', 'like', "%{$s}%")
                  ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        // Filter by order status
        if ($request->filled('status')) {
            $query->where('order_status', $request->input('status'));
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        // Filter by outlet
        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', $request->input('outlet_id'));
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->input('date'));
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $orders = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'pagination' => [
                'total' => $orders->total(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
            ]
        ]);
    }

    public function show($id)
    {
        $order = Order::with([
            'outlet',
            'items.product',
            'items.customization.photoUpload',
            'payments'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    // Update order tracking status
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'order_status' => 'required|in:confirmed,preparing,out_for_delivery,delivered,cancelled',
            'payment_status' => 'nullable|in:pending,paid,failed,refunded',
        ]);

        $order = Order::findOrFail($id);
        $order->order_status = $validated['order_status'];

        if (!empty($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
        }

        $order->save();

        return response()->json([
            'success' => true,
            'message' => "Order #{$order->order_number} status updated to " . ucfirst(str_replace('_', ' ', $order->order_status)),
            'data' => $order,
        ]);
    }
}
