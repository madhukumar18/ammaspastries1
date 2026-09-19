<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderCustomization;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Outlet;
use App\Models\Coupon;
use App\Models\CouponUsage;

class OrderController extends Controller
{
    // Create new order with strict server-side price recalculation
    public function create(Request $request)
    {
        $validated = $request->validate([
            'outlet_id' => 'required|exists:outlets,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'delivery_address' => 'required|string',
            'delivery_area' => 'required|string',
            'delivery_city' => 'nullable|string',
            'delivery_pincode' => 'required|string|max:10',
            'delivery_date' => 'required|date|after_or_equal:today',
            'delivery_time_slot' => 'required|string',
            'special_instructions' => 'nullable|string|max:500',
            'coupon_code' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable',
            'items.*.quantity' => 'required|integer|min:1|max:50',
            'items.*.customization' => 'nullable|array',
        ], [
            'items.*.product_id.exists' => 'One or more items in your cart are no longer available in our active catalog. Please refresh your cart or re-add the item.',
            'items.*.product_id.required' => 'Product ID is missing for an item in your cart.',
            'outlet_id.exists' => 'Selected bakery outlet is currently unavailable.',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $orderItemsData = [];

            // 1. Recalculate prices directly from database
            foreach ($validated['items'] as $itemInput) {
                $product = Product::findOrFail($itemInput['product_id']);
                $unitPrice = $product->discount_price ?: $product->base_price;
                $variantTitle = null;
                $dbVariantId = null;

                $rawVariantId = $itemInput['variant_id'] ?? null;
                if (!empty($rawVariantId) && is_numeric($rawVariantId)) {
                    $variant = ProductVariant::where('product_id', $product->id)
                        ->where('id', (int) $rawVariantId)
                        ->first();
                    if ($variant) {
                        $dbVariantId = $variant->id;
                        $unitPrice = $variant->discount_price ?: $variant->price;
                        $variantTitle = $variant->size_weight;
                    }
                }

                // If not matched to a DB variant, check customization for customized price & title (e.g. weights 1kg/2kg, snacks, cupcakes, photo cakes)
                if (!$dbVariantId) {
                    if (!empty($itemInput['customization']['unit_price'])) {
                        $unitPrice = max(1, (float) $itemInput['customization']['unit_price']);
                    } elseif (!empty($itemInput['customization']['selected_price'])) {
                        $unitPrice = max(1, (float) $itemInput['customization']['selected_price']);
                    }

                    $variantTitle = $itemInput['customization']['selected_weight_portion']
                        ?? $itemInput['customization']['portion_label']
                        ?? $itemInput['customization']['size']
                        ?? $itemInput['customization']['shape']
                        ?? $itemInput['customization']['flavour']
                        ?? $product->weight
                        ?? null;
                }

                $qty = (int) $itemInput['quantity'];
                $itemSubtotal = $unitPrice * $qty;
                $subtotal += $itemSubtotal;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'variant_id' => $dbVariantId,
                    'product_name' => $product->name,
                    'variant_title' => $variantTitle,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'customization' => $itemInput['customization'] ?? null,
                ];
            }

            // 2. Delivery fee & Coupon discount calculation
            $deliveryFee = $subtotal >= 1000 ? 0 : 50; // free delivery above 1000
            $discount = 0;
            $appliedCoupon = null;

            if (!empty($validated['coupon_code'])) {
                $coupon = Coupon::where('code', strtoupper($validated['coupon_code']))->first();
                if ($coupon) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    if ($discount > 0) {
                        $appliedCoupon = $coupon;
                    }
                }
            }

            // 3. Tax & Total calculation
            $tax = round(($subtotal - $discount) * 0.05, 2); // 5% GST on bakery items
            $total = max(0, $subtotal - $discount + $deliveryFee + $tax);

            // 4. Generate Order Number starting from 62473
            $orderNumber = Order::generateNextOrderNumber();

            // 5. Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $request->user()?->id,
                'outlet_id' => $validated['outlet_id'],
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'],
                'delivery_address' => $validated['delivery_address'],
                'delivery_area' => $validated['delivery_area'],
                'delivery_city' => $validated['delivery_city'] ?? 'Bengaluru',
                'delivery_pincode' => $validated['delivery_pincode'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'delivery_fee' => $deliveryFee,
                'tax' => $tax,
                'total' => $total,
                'coupon_code' => $appliedCoupon?->code,
                'payment_status' => 'pending',
                'payment_method' => 'razorpay',
                'order_status' => 'pending_payment',
                'delivery_date' => $validated['delivery_date'],
                'delivery_time_slot' => $validated['delivery_time_slot'],
                'special_instructions' => $validated['special_instructions'] ?? null,
            ]);

            // 6. Create Order Items & Customizations
            foreach ($orderItemsData as $itemData) {
                $customization = $itemData['customization'];
                unset($itemData['customization']);

                $orderItem = $order->items()->create($itemData);

                if (!empty($customization)) {
                    OrderCustomization::create([
                        'order_item_id' => $orderItem->id,
                        'name_on_cake' => $customization['name_on_cake'] ?? null,
                        'description' => $customization['description'] ?? null,
                        'cake_size' => $customization['cake_size'] ?? null,
                        'flavour' => $customization['flavour'] ?? null,
                        'is_eggless' => filter_var($customization['is_eggless'] ?? true, FILTER_VALIDATE_BOOLEAN),
                        'photo_cake_upload_id' => $customization['photo_cake_upload_id'] ?? null,
                    ]);
                }
            }

            if ($appliedCoupon) {
                CouponUsage::create([
                    'coupon_id' => $appliedCoupon->id,
                    'user_id' => $request->user()?->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discount,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully!',
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'subtotal' => $order->subtotal,
                    'discount' => $order->discount,
                    'delivery_fee' => $order->delivery_fee,
                    'tax' => $order->tax,
                    'total' => $order->total,
                ]
            ], 201);
        });
    }

    // Track Order by Order Number + Phone
    public function track(Request $request)
    {
        $validated = $request->validate([
            'order_number' => 'required|string',
            'phone' => 'required|string',
        ]);

        $order = Order::with(['outlet', 'items.customization'])
            ->where('order_number', trim($validated['order_number']))
            ->where('customer_phone', trim($validated['phone']))
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'No order found matching this Order Number and Mobile Number. Please verify your details.',
            ], 404);
        }

        // Determine the visual progress stage (1: Order Confirmed, 2: Preparing, 3: Out for Delivery / Delivered)
        $currentStage = 1;
        if ($order->order_status === 'preparing') {
            $currentStage = 2;
        } elseif (in_array($order->order_status, ['out_for_delivery', 'delivered'])) {
            $currentStage = 3;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order' => $order,
                'current_stage' => $currentStage,
                'is_delivered' => $order->order_status === 'delivered',
                'is_cancelled' => $order->order_status === 'cancelled',
                'stages' => [
                    [
                        'id' => 1,
                        'name' => 'Order Confirmed',
                        'description' => 'Your bakery order is verified and assigned to ' . $order->outlet->name,
                        'completed' => $currentStage >= 1,
                        'active' => $currentStage === 1,
                    ],
                    [
                        'id' => 2,
                        'name' => 'Preparing',
                        'description' => 'Our master chefs are freshly baking and decorating your treats with care',
                        'completed' => $currentStage >= 2,
                        'active' => $currentStage === 2,
                    ],
                    [
                        'id' => 3,
                        'name' => $order->order_status === 'delivered' ? 'Delivered' : 'Out for Delivery',
                        'description' => $order->order_status === 'delivered'
                            ? 'Delivered to your doorstep. Enjoy the sweetness!'
                            : 'On the way in a temperature-controlled bakery box',
                        'completed' => $order->order_status === 'delivered',
                        'active' => $currentStage === 3 && $order->order_status !== 'delivered',
                    ],
                ]
            ]
        ]);
    }

    // Customer previous orders
    public function myOrders(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $orders = Order::with(['outlet', 'items.customization', 'latestPayment'])
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    // Order detail view
    public function show($orderNumber)
    {
        $order = Order::with(['outlet', 'items.customization.photoUpload', 'latestPayment'])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }
}
