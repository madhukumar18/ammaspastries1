<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Outlet;
use App\Models\BulkOrder;
use App\Models\FranchiseEnquiry;
use App\Models\ContactEnquiry;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    // High-level sales metrics & summary
    public function summary()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfYear = Carbon::now()->startOfYear();

        // Strictly calculate from paid/completed orders
        $dailySales = Order::where('payment_status', 'paid')
            ->whereDate('created_at', $today)
            ->sum('total');

        $monthlySales = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('total');

        $yearlySales = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $startOfYear)
            ->sum('total');

        $totalSalesAllTime = Order::where('payment_status', 'paid')->sum('total');

        $counts = [
            'total_orders' => Order::count(),
            'pending_orders' => Order::whereIn('order_status', ['pending_payment', 'confirmed', 'preparing'])->count(),
            'completed_orders' => Order::where('order_status', 'delivered')->count(),
            'cancelled_orders' => Order::where('order_status', 'cancelled')->count(),
            'customers' => User::where('role', 'customer')->count(),
            'products' => Product::count(),
            'outlets' => Outlet::count(),
            'bulk_orders' => BulkOrder::count(),
            'franchise_enquiries' => FranchiseEnquiry::count(),
            'contact_enquiries' => ContactEnquiry::count(),
        ];

        // Recent 5 orders
        $recentOrders = Order::with(['outlet'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'sales' => [
                    'daily' => (float) $dailySales,
                    'monthly' => (float) $monthlySales,
                    'yearly' => (float) $yearlySales,
                    'all_time' => (float) $totalSalesAllTime,
                ],
                'counts' => $counts,
                'recent_orders' => $recentOrders,
            ]
        ]);
    }

    // Dynamic Sales Bar Chart by Year (Calculates Jan to Dec from database)
    public function salesBarChart(Request $request)
    {
        $year = (int) $request->input('year', date('Y'));

        // Prepare 12 months template
        $monthsData = [];
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for ($m = 1; $m <= 12; $m++) {
            $monthsData[$m] = [
                'month_num' => $m,
                'month_name' => $monthNames[$m - 1],
                'sales' => 0.0,
                'order_count' => 0,
            ];
        }

        // Aggregate actual paid orders
        $orders = Order::where('payment_status', 'paid')
            ->whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month_num, SUM(total) as total_sales, COUNT(*) as total_orders')
            ->groupBy('month_num')
            ->get();

        foreach ($orders as $record) {
            $mNum = (int) $record->month_num;
            if (isset($monthsData[$mNum])) {
                $monthsData[$mNum]['sales'] = (float) $record->total_sales;
                $monthsData[$mNum]['order_count'] = (int) $record->total_orders;
            }
        }

        // Available years for dropdown
        $availableYears = Order::selectRaw('YEAR(created_at) as yr')
            ->distinct()
            ->orderBy('yr', 'desc')
            ->pluck('yr')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [(int) date('Y')];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $year,
                'available_years' => $availableYears,
                'chart_data' => array_values($monthsData),
            ]
        ]);
    }

    // Monthly Sales Line Graph
    public function salesLineGraph(Request $request)
    {
        $year = (int) $request->input('year', date('Y'));

        $data = $this->salesBarChart($request)->getData(true);

        return response()->json([
            'success' => true,
            'data' => $data['data'],
        ]);
    }
}
