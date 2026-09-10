<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhook;

class PaymentController extends Controller
{
    // Create Razorpay Order from server-calculated total
    public function createRazorpayOrder(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        // Prevent paying for already paid orders
        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid successfully.',
            ], 400);
        }

        $keyId = env('RAZORPAY_KEY_ID', 'rzp_test_demokey12345');
        $keySecret = env('RAZORPAY_KEY_SECRET', 'test_secret_12345');

        // Amount in paise (1 INR = 100 paise)
        $amountInPaise = (int) round($order->total * 100);

        // Attempt official Razorpay API call if valid live or real test keys are provided
        $isDemoKey = str_contains($keyId, 'demokey') || empty($keySecret) || $keySecret === 'test_secret_12345';
        $razorpayOrderId = null;

        if (!$isDemoKey) {
            try {
                $response = Http::withBasicAuth($keyId, $keySecret)
                    ->post('https://api.razorpay.com/v1/orders', [
                        'amount' => $amountInPaise,
                        'currency' => 'INR',
                        'receipt' => $order->order_number,
                        'notes' => [
                            'order_number' => $order->order_number,
                            'customer_name' => $order->customer_name,
                            'customer_phone' => $order->customer_phone,
                        ]
                    ]);

                if ($response->successful()) {
                    $razorpayOrderId = $response->json('id');
                } else {
                    Log::warning('Razorpay API order creation failed, using sandbox order ID: ' . $response->body());
                }
            } catch (\Exception $e) {
                Log::warning('Razorpay network exception: ' . $e->getMessage());
            }
        }

        // Local development / fallback order ID if keys are sandbox defaults
        if (!$razorpayOrderId) {
            $razorpayOrderId = 'order_test_' . $order->order_number . '_' . time();
        }

        // Record initial payment record
        Payment::updateOrCreate(
            ['order_id' => $order->id, 'status' => 'created'],
            [
                'razorpay_order_id' => $razorpayOrderId,
                'amount' => $order->total,
                'currency' => 'INR',
                'status' => 'created',
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'key_id' => $keyId,
                'razorpay_order_id' => $razorpayOrderId,
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
                'is_test_mode' => $isDemoKey || config('app.env') === 'local',
            ]
        ]);
    }

    // Verify Razorpay Payment Signature
    public function verifyPayment(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $order = Order::findOrFail($validated['order_id']);
        $keySecret = env('RAZORPAY_KEY_SECRET', 'test_secret_12345');

        $isDemoKey = str_contains(env('RAZORPAY_KEY_ID', ''), 'demokey') || $keySecret === 'test_secret_12345';
        $verified = false;

        if ($isDemoKey) {
            // Safe local development verification
            $verified = true;
        } else {
            // HMAC SHA256 verification
            $generatedSignature = hash_hmac(
                'sha256',
                $validated['razorpay_order_id'] . '|' . $validated['razorpay_payment_id'],
                $keySecret
            );
            $verified = hash_equals($generatedSignature, $validated['razorpay_signature']);
        }

        if (!$verified) {
            $order->update(['payment_status' => 'failed']);
            Payment::create([
                'order_id' => $order->id,
                'razorpay_order_id' => $validated['razorpay_order_id'],
                'razorpay_payment_id' => $validated['razorpay_payment_id'],
                'razorpay_signature' => $validated['razorpay_signature'],
                'amount' => $order->total,
                'currency' => 'INR',
                'status' => 'failed',
                'gateway_response' => ['error' => 'Signature verification mismatch'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. Please check with your bank.',
            ], 400);
        }

        // Mark payment and order as successful
        $order->update([
            'payment_status' => 'paid',
            'order_status' => 'confirmed',
        ]);

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'transaction_id' => 'TXN_' . $validated['razorpay_payment_id'],
                'razorpay_order_id' => $validated['razorpay_order_id'],
                'razorpay_payment_id' => $validated['razorpay_payment_id'],
                'razorpay_signature' => $validated['razorpay_signature'],
                'amount' => $order->total,
                'currency' => 'INR',
                'status' => 'captured',
                'gateway_response' => $request->all(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully! Your cake order is confirmed.',
            'data' => [
                'order_number' => $order->order_number,
                'status' => 'paid',
            ]
        ]);
    }

    // Razorpay Webhook Handler
    public function webhook(Request $request)
    {
        $webhookSecret = env('RAZORPAY_WEBHOOK_SECRET');
        $payload = $request->getContent();
        $signature = $request->header('X-Razorpay-Signature');

        if ($webhookSecret && $signature) {
            $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);
            if (!hash_equals($expectedSignature, $signature)) {
                return response()->json(['status' => 'invalid_signature'], 400);
            }
        }

        $data = json_decode($payload, true);
        $event = $data['event'] ?? 'unknown';

        PaymentWebhook::create([
            'event_id' => $data['id'] ?? null,
            'event_type' => $event,
            'payload' => $data,
            'is_processed' => true,
        ]);

        // Process payment captured or failed events
        if ($event === 'payment.captured') {
            $paymentEntity = $data['payload']['payment']['entity'] ?? [];
            $razorpayOrderId = $paymentEntity['order_id'] ?? null;

            if ($razorpayOrderId) {
                $payment = Payment::where('razorpay_order_id', $razorpayOrderId)->first();
                if ($payment && $payment->order) {
                    $payment->order->update(['payment_status' => 'paid']);
                    $payment->update(['status' => 'captured']);
                }
            }
        }

        return response()->json(['status' => 'success'], 200);
    }
}
