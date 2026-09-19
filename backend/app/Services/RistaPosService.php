<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Outlet;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class RistaPosService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $apiSecret;
    protected ?string $configuredToken;
    protected bool $autoSync;
    protected bool $verifySsl;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('RISTA_API_BASE_URL', 'https://api.ristaapps.com/v1'), '/');
        $this->apiKey = env('RISTA_API_KEY', '761129c2-9fa5-416b-9cb4-333741520e8e');
        $this->apiSecret = env('RISTA_API_SECRET', '38d7hjD0j9UHLHE5WilYvL3VX24l+EVP3UHMHE9dJ8Qo');
        $this->configuredToken = env('RISTA_API_TOKEN');
        $this->autoSync = filter_var(env('RISTA_AUTO_SYNC', true), FILTER_VALIDATE_BOOLEAN);
        $this->verifySsl = filter_var(env('RISTA_SSL_VERIFY', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * 1. Official Rista JWT Token Generation (HS256)
     * Every API call to Rista requires:
     * - Header 'x-api-key': Your API Key
     * - Header 'x-api-token': A signed JWT using Secret Key with HS256 algorithm.
     */
    public function generateApiToken(): string
    {
        // Use pre-configured valid token if provided in .env
        if (!empty($this->configuredToken)) {
            return trim($this->configuredToken);
        }

        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];

        $now = time();
        $payload = [
            'iss' => $this->apiKey,
            'iat' => $now,
            'jti' => 'xyz_' . $now,
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload));

        $unsignedToken = $encodedHeader . '.' . $encodedPayload;
        $rawSignature = hash_hmac('sha256', $unsignedToken, $this->apiSecret, true);
        $encodedSignature = $this->base64UrlEncode($rawSignature);

        return $unsignedToken . '.' . $encodedSignature;
    }

    /**
     * Helper to encode strings as Base64URL without padding
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * HTTP Client configured with official Rista headers: x-api-key and x-api-token
     */
    protected function client(int $timeout = 12)
    {
        $jwtToken = $this->generateApiToken();

        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'x-api-key' => $this->apiKey,
            'x-api-token' => $jwtToken,
        ];

        $client = Http::timeout($timeout)->withHeaders($headers);

        if (!$this->verifySsl) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * 2. Multi-Outlet Sync: Fetch real list of branches/outlets from Rista POS API
     */
    public function fetchOutletsFromRista(): array
    {
        try {
            // Official Rista endpoint: GET /branch/list
            $response = $this->client(15)->get("{$this->baseUrl}/branch/list");

            if ($response->successful()) {
                $data = $response->json();
                $branches = is_array($data) ? $data : ($data['branches'] ?? $data['data'] ?? []);

                return [
                    'success' => true,
                    'status_code' => $response->status(),
                    'stores' => $branches,
                ];
            }

            return [
                'success' => false,
                'status_code' => $response->status(),
                'message' => "Rista API HTTP {$response->status()}: " . $response->body(),
                'stores' => [],
            ];
        } catch (Throwable $e) {
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Network error connecting to Rista: ' . $e->getMessage(),
                'stores' => [],
            ];
        }
    }

    /**
     * Synchronize fetched Rista branches into MySQL outlets table
     */
    public function syncOutlets(): array
    {
        $result = $this->fetchOutletsFromRista();

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
                'total_in_db' => Outlet::count(),
            ];
        }

        $branches = $result['stores'];
        if (empty($branches)) {
            return [
                'success' => true,
                'message' => 'Rista API returned 0 branches. Existing database outlets remain active.',
                'synced' => 0,
                'total_in_db' => Outlet::count(),
            ];
        }

        $syncedCount = 0;
        $updatedCount = 0;

        foreach ($branches as $branch) {
            $branchCode = (string) ($branch['branchCode'] ?? $branch['code'] ?? '');
            if (!$branchCode) continue;

            $branchName = $branch['branchName'] ?? $branch['name'] ?? $branchCode;
            $name = str_starts_with($branchName, "Amma's") || str_starts_with($branchName, "Ammas")
                ? $branchName
                : "Ammas Pastries - " . $branchName;

            $addr = $branch['address'] ?? [];
            $addressLine = trim($addr['addressLine'] ?? ($branchName . ', ' . ($addr['city'] ?? 'Bengaluru')));
            $city = $addr['city'] ?? 'Bengaluru';
            $state = $addr['state'] ?? 'Karnataka';
            $pincode = $addr['zip'] ?? '560001';
            $latitude = isset($addr['latitude']) ? (float) $addr['latitude'] : null;
            $longitude = isset($addr['longitude']) ? (float) $addr['longitude'] : null;
            $isActive = (isset($branch['status']) ? strtolower($branch['status']) === 'active' : true);

            $outlet = Outlet::where('code', $branchCode)
                ->orWhere('rista_store_id', $branchCode)
                ->first();

            $outletData = [
                'name' => $name,
                'code' => $branchCode,
                'rista_store_id' => $branchCode,
                'address' => $addressLine,
                'area' => $branchName,
                'city' => $city,
                'state' => $state,
                'pincode' => $pincode,
                'phone' => '+91 98450 12345',
                'opening_time' => '09:00:00',
                'closing_time' => '22:30:00',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'rista_pos_enabled' => true,
                'is_active' => $isActive,
            ];

            if ($outlet) {
                $outlet->update($outletData);
                $updatedCount++;
            } else {
                Outlet::create($outletData);
                $syncedCount++;
            }
        }

        // Invalidate catalog cache so frontend and admin immediately load newly synced branches
        try {
            app(CacheManagerService::class)->clearCatalog();
        } catch (Throwable $e) {}

        return [
            'success' => true,
            'message' => "Successfully synchronized outlets with Rista POS! ({$syncedCount} new, {$updatedCount} updated, total: " . Outlet::count() . ")",
            'synced' => $syncedCount,
            'updated' => $updatedCount,
            'total_in_db' => Outlet::count(),
        ];
    }

    /**
     * 3. Order Routing: Push completed order to designated outlet POS terminal
     */
    public function pushOrder(Order $order): array
    {
        $order->loadMissing(['outlet', 'items.customization', 'latestPayment']);

        $outlet = $order->outlet;

        // Skip if POS integration is toggled off for this outlet
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

        // Outlet's Rista Store ID / Branch Code
        $storeId = $outlet->rista_store_id ?: $outlet->code;

        // Format items with cake customizations (name on cake, eggless, flavours)
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

        // Standard Rista POS sale payload
        $payload = [
            'merchant_order_id' => $order->order_number,
            'branch_code' => $storeId,
            'branch_id' => $storeId,
            'store_id' => $storeId,
            'outlet_name' => $outlet->name,
            'outlet_code' => $outlet->code,
            'order_type' => 'DELIVERY',
            'order_source' => "Amma's Website",
            'channel' => "Amma's Website",
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
            $response = $this->client(12)->asJson()->post("{$this->baseUrl}/sale", $payload);

            if (!$response->successful() && $response->status() === 404) {
                $response = $this->client(12)->asJson()->post("{$this->baseUrl}/orders", $payload);
            }

            if ($response->successful()) {
                $resData = $response->json();
                $posOrderId = $resData['order_id'] ?? $resData['data']['order_id'] ?? $resData['sale_id'] ?? ('RSTA_' . $order->order_number);

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
                    'message' => "Order {$order->order_number} transmitted to {$outlet->name} POS terminal",
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
        } catch (Throwable $e) {
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
     * Test connection to Rista API Gateway
     */
    public function testConnection(): array
    {
        try {
            $response = $this->client(10)->get("{$this->baseUrl}/branch/list");
            $status = $response->status();
            $isSuccess = $response->successful();

            return [
                'success' => $isSuccess,
                'status_code' => $status,
                'gateway_url' => $this->baseUrl,
                'auth_type' => 'Official JWT (x-api-key + x-api-token HS256)',
                'message' => $isSuccess
                    ? 'Connected to Rista POS Gateway successfully! (HTTP 200 OK)'
                    : "Gateway responded with status HTTP {$status}",
            ];
        } catch (Throwable $e) {
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
            'auth_method' => 'HS256 JWT Token (x-api-token header)',
        ];
    }
}
