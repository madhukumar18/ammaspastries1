<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Outlet;
use App\Services\RistaPosService;
use Illuminate\Http\Request;

class AdminRistaPosController extends Controller
{
    protected RistaPosService $ristaService;

    public function __construct(RistaPosService $ristaService)
    {
        $this->ristaService = $ristaService;
    }

    /**
     * Get Rista API settings and status
     */
    public function getConfig()
    {
        $config = $this->ristaService->getConfig();

        // Overall stats
        $totalOrders = Order::count();
        $totalRevenue = (float) Order::where('payment_status', 'paid')->sum('total');
        $syncedOrders = Order::where('pos_synced', true)->count();
        $failedOrders = Order::where('pos_sync_status', 'failed')->count();
        $pendingOrders = Order::whereIn('pos_sync_status', ['pending', 'created'])->where('payment_status', 'paid')->count();
        $mappedOutlets = Outlet::whereNotNull('rista_store_id')->where('rista_store_id', '!=', '')->count();
        $totalOutlets = Outlet::count();

        // Outlet specific order counts & revenue
        $outletStats = Outlet::withCount(['orders', 'orders as synced_orders_count' => function ($q) {
            $q->where('pos_synced', true);
        }])->get()->map(function ($o) {
            return [
                'id' => $o->id,
                'name' => $o->name,
                'code' => $o->code,
                'rista_store_id' => $o->rista_store_id ?: $o->code,
                'total_orders' => $o->orders_count,
                'total_revenue' => (float) $o->orders()->where('payment_status', 'paid')->sum('total'),
                'synced_orders' => $o->synced_orders_count,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'config' => $config,
                'stats' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                    'synced_orders' => $syncedOrders,
                    'failed_orders' => $failedOrders,
                    'pending_orders' => $pendingOrders,
                    'mapped_outlets' => $mappedOutlets,
                    'total_outlets' => $totalOutlets,
                    'outlet_stats' => $outletStats,
                ]
            ]
        ]);
    }

    /**
     * Test connection to Rista POS API Gateway
     */
    public function testConnection()
    {
        $result = $this->ristaService->testConnection();

        return response()->json([
            'success' => $result['success'],
            'data' => $result,
        ]);
    }

    /**
     * List all outlets with their Rista Store ID mappings
     */
    public function getOutlets()
    {
        $outlets = Outlet::orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $outlets,
        ]);
    }

    /**
     * Update an outlet's Rista Store ID and POS sync toggle
     */
    public function updateOutlet(Request $request, $id)
    {
        $outlet = Outlet::findOrFail($id);

        $validated = $request->validate([
            'rista_store_id' => 'nullable|string|max:100',
            'rista_pos_enabled' => 'nullable|boolean',
        ]);

        $outlet->update([
            'rista_store_id' => $validated['rista_store_id'] ?? null,
            'rista_pos_enabled' => $validated['rista_pos_enabled'] ?? $outlet->rista_pos_enabled,
        ]);

        return response()->json([
            'success' => true,
            'message' => "POS configuration for {$outlet->name} updated successfully!",
            'data' => $outlet,
        ]);
    }

    /**
     * Fetch and sync all outlets directly from Rista POS
     */
    public function syncOutlets()
    {
        $result = $this->ristaService->syncOutlets();

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'] ?? 'Outlets sync complete',
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }

    /**
     * List orders with POS synchronization status & payloads
     */
    public function getOrders(Request $request)
    {
        $query = Order::with(['outlet', 'items.customization', 'latestPayment'])
            ->latest();

        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', $request->input('outlet_id'));
        }

        if ($request->filled('pos_sync_status')) {
            $query->where('pos_sync_status', $request->input('pos_sync_status'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('pos_order_id', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Trigger manual sync / retry for a specific order to Rista POS
     */
    public function syncOrder($id)
    {
        $order = Order::with(['outlet', 'items.customization', 'latestPayment'])->findOrFail($id);

        $result = $this->ristaService->pushOrder($order);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => [
                'order' => $order->fresh(),
                'result' => $result,
            ],
        ]);
    }
}
