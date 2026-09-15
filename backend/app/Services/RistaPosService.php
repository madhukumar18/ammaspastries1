<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Outlet;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RistaPosService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $apiSecret;
    protected bool $autoSync;
    protected bool $verifySsl;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('RISTA_API_BASE_URL', 'https://api-gateway.dotpe.in/api/v1'), '/');
        $this->apiKey = env('RISTA_API_KEY', '761129c2-9fa5-416b-9cb4-333741520e8e');
        $this->apiSecret = env('RISTA_API_SECRET', '38d7hjDJo9LHdEF5WiIYvc3vX24lxEVPsUHME9dz8Qo');
        $this->autoSync = filter_var(env('RISTA_AUTO_SYNC', true), FILTER_VALIDATE_BOOLEAN);
        $this->verifySsl = filter_var(env('RISTA_SSL_VERIFY', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * HTTP client configured with credentials, timeouts and SSL options
     */
    protected function client(int $timeout = 10)
    {
        $client = Http::timeout($timeout)->withHeaders([
            'x-api-key' => $this->apiKey,
            'x-api-secret' => $this->apiSecret,
            'Accept' => 'application/json',
        ]);

        if (!$this->verifySsl) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * Push verified online order to Rista POS terminal for the targeted outlet
     */
    public function pushOrder(Order $order): array
    {
        // Ensure relationships are loaded
        $order->loadMissing(['outlet', 'items.customization', 'latestPayment']);

        $outlet = $order->outlet;

        // Check if POS integration is enabled for this outlet
        if (!$outlet || !$outlet->rista_pos_enabled) {
            $order->update([
                'pos_synced' => false,
                'pos_sync_status' => 'skipped',
                'pos_error' => 'POS dispatch skipped: Rista POS is disabled for outlet ' . ($outlet?->name ?? 'Unknown'),
            ]);

            return [
                'success' => false,
                'status' => 'skipped',
                'message' => 'Rista POS is disabled for this outlet',
            ];
        }

        // Outlet's Rista Store ID fallback to outlet code
        $storeId = $outlet->rista_store_id ?: $outlet->code;

        // Format items with cake customizations
        $formattedItems = [];
        foreach ($order->items as $item) {
            $customization = $item->customization;
            $notes = [];
            if ($customization) {
                if (!empty($customization->name_on_cake)) {
                    $notes[] = "Name on Cake: {$customization->name_on_cake}";
                }
                if (!empty($customization->description)) {
                    $notes[] = "Message: {$customization->description}";
                }
                if (!empty($customization->flavour)) {
                    $notes[] = "Flavour: {$customization->flavour}";
                }
                if ($customization->is_eggless) {
                    $notes[] = "Eggless: Yes";
                }
            }

            $formattedItems[] = [
                'item_id' => $item->product_id,
                'item_name' => $item->product_name,
                'variant_title' => $item->variant_title,
                'quantity' => (int) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->subtotal,
                'instructions' => implode(' | ', $notes),
                'customization' => $customization ? [
                    'name_on_cake' => $customization->name_on_cake,
                    'message' => $customization->description,
                    'cake_size' => $customization->cake_size,
                    'flavour' => $customization->flavour,
                    'is_eggless' => (bool) $customization->is_eggless,
                ] : null,
            ];
        }

        // Prepare standard Rista POS payload
        $payload = [
            'merchant_order_id' => $order->order_number,
            'store_id' => $storeId,
            'outlet_name' => $outlet->name,
            'outlet_code' => $outlet->code,
            'order_type' => 'DELIVERY',
            'order_source' => 'AMMAS_ONLINE_STORE',
            'created_at' => $order->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'customer' => [
                'name' => $order->customer_name,
                'phone' => $order->customer_phone,
                'email' => $order->customer_email,
                'delivery_address' => [
                    'address_line' => $order->delivery_address,
                    'area' => $order->delivery_area,
                    'city' => $order->delivery_city,
                    'pincode' => $order->delivery_pincode,
                ],
            ],
            'delivery_schedule' => [
                'delivery_date' => $order->delivery_date?->format('Y-m-d'),
                'time_slot' => $order->delivery_time_slot,
                'instructions' => $order->special_instructions,
            ],
            'items' => $formattedItems,
            'bill_summary' => [
                'subtotal' => (float) $order->subtotal,
                'discount' => (float) $order->discount,
                'delivery_fee' => (float) $order->delivery_fee,
                'tax' => (float) $order->tax,
                'total_amount' => (float) $order->total,
                'coupon_code' => $order->coupon_code,
            ],
            'payment' => [
                'mode' => 'ONLINE',
                'status' => 'PAID',
                'amount' => (float) $order->total,
                'gateway' => 'RAZORPAY',
                'transaction_id' => $order->latestPayment?->transaction_id ?? $order->latestPayment?->razorpay_payment_id ?? 'ONLINE_TXN',
                'outlet_account_attributed' => $storeId,
            ],
        ];

        // Save prepared payload for audit tracking
        $order->update([
            'pos_payload' => $payload,
            'pos_sync_status' => 'pending',
        ]);

        try {
            $response = $this->client(12)->asJson()->post("{$this->baseUrl}/orders", $payload);

            if ($response->successful()) {
                $resData = $response->json();
                $posOrderId = $resData['order_id'] ?? $resData['data']['order_id'] ?? ('RSTA_' . $order->order_number);

                $order->update([
                    'pos_synced' => true,
                    'pos_sync_status' => 'synced',
                    'pos_order_id' => $posOrderId,
                    'pos_synced_at' => now(),
                    'pos_error' => null,
                    'pos_response' => $resData,
                ]);

                Log::info("Rista POS Order synced successfully: Order {$order->order_number} to Store {$storeId} (POS ID: {$posOrderId})");

                return [
                    'success' => true,
                    'status' => 'synced',
                    'pos_order_id' => $posOrderId,
                    'message' => "Order {$order->order_number} successfully transmitted to {$outlet->name} POS terminal",
                    'data' => $resData,
                ];
            } else {
                $errorMsg = "HTTP {$response->status()}: " . ($response->json('message') ?? $response->body());

                $order->update([
                    'pos_synced' => false,
                    'pos_sync_status' => 'failed',
                    'pos_error' => $errorMsg,
                    'pos_response' => $response->json() ?? ['raw' => substr($response->body(), 0, 500)],
                ]);

                Log::warning("Rista POS sync rejected for Order {$order->order_number}: {$errorMsg}");

                return [
                    'success' => false,
                    'status' => 'failed',
                    'message' => $errorMsg,
                    'response' => $response->json() ?? $response->body(),
                ];
            }
        } catch (\Exception $e) {
            $errorMsg = 'Network / Gateway error: ' . $e->getMessage();

            $order->update([
                'pos_synced' => false,
                'pos_sync_status' => 'failed',
                'pos_error' => $errorMsg,
            ]);

            Log::error("Rista POS Exception for Order {$order->order_number}: {$errorMsg}");

            return [
                'success' => false,
                'status' => 'failed',
                'message' => $errorMsg,
            ];
        }
    }

    /**
     * Test API connection with Rista DotPe Gateway
     */
    public function testConnection(): array
    {
        try {
            // Ping / health check or stores check with Rista credentials securely on server
            $response = $this->client(8)->get("{$this->baseUrl}/stores");

            $status = $response->status();
            $isSuccess = $response->successful();

            return [
                'success' => $isSuccess,
                'status_code' => $status,
                'gateway_url' => $this->baseUrl,
                'message' => $isSuccess
                    ? 'Connected to Rista POS Gateway successfully!'
                    : "Gateway responded with status HTTP {$status}",
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status_code' => 500,
                'gateway_url' => $this->baseUrl,
                'message' => 'Connection attempted: ' . $e->getMessage(),
            ];
        }
    }

    public function getConfig(): array
    {
        return [
            'base_url' => $this->baseUrl,
            'api_key' => $this->apiKey,
            'api_secret_masked' => substr($this->apiSecret, 0, 6) . '...' . substr($this->apiSecret, -4),
            'auto_sync' => $this->autoSync,
        ];
    }
}
