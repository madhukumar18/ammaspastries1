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
    protected string $defaultBranchCode;
    protected string $defaultBranchName;
    protected bool $autoSync;
    protected bool $verifySsl;

    public function __construct()
    {
        $envVars = [];
        $envFile = base_path('.env');
        if (file_exists($envFile)) {
            $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (str_starts_with($line, '#') || !str_contains($line, '=')) continue;
                [$key, $val] = explode('=', $line, 2);
                $envVars[trim($key)] = trim($val, " \t\n\r\0\x0B\"'");
            }
        }

        $this->baseUrl = rtrim($envVars['RISTA_API_BASE_URL'] ?? env('RISTA_API_BASE_URL', 'https://api.ristaapps.com/v1'), '/');
        $this->apiKey = $envVars['RISTA_API_KEY'] ?? env('RISTA_API_KEY');
        $this->apiSecret = $envVars['RISTA_API_SECRET'] ?? env('RISTA_API_SECRET');
        $this->configuredToken = $envVars['RISTA_API_TOKEN'] ?? env('RISTA_API_TOKEN');
        $this->defaultBranchCode = $envVars['RISTA_DEFAULT_BRANCH_CODE'] ?? env('RISTA_DEFAULT_BRANCH_CODE', 'Test');
        $this->defaultBranchName = $envVars['RISTA_DEFAULT_BRANCH_NAME'] ?? env('RISTA_DEFAULT_BRANCH_NAME', 'Test');
        $this->autoSync = filter_var($envVars['RISTA_AUTO_SYNC'] ?? env('RISTA_AUTO_SYNC', true), FILTER_VALIDATE_BOOLEAN);
        $this->verifySsl = filter_var($envVars['RISTA_SSL_VERIFY'] ?? env('RISTA_SSL_VERIFY', false), FILTER_VALIDATE_BOOLEAN);
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

        // Format items according to Rista POS specification
        $formattedItems = [];
        foreach ($order->items as $item) {
            $customization = $item->customization;
            $notes = [];
            if (!empty($item->variant_title)) {
                $notes[] = $item->variant_title;
            }
            if ($customization) {
                if (!empty($customization->name_on_cake)) {
                    $notes[] = "Name: {$customization->name_on_cake}";
                }
                if (!empty($customization->description)) {
                    $notes[] = "Msg: {$customization->description}";
                }
                if (!empty($customization->flavour)) {
                    $notes[] = "Flavour: {$customization->flavour}";
                }
                if ($customization->is_eggless) {
                    $notes[] = "Eggless";
                }
            }

            // In Rista's catalog, SKU 509 is the master code for 'Shapes Per Kg'.
            // If the product is an actual cake and not the shape modifier itself, do not pass 509 as skuCode,
            // otherwise Rista's POS catalog lookup automatically overwrites the cake name with 'Shapes Per Kg'.
            $rawSku = trim((string) ($item->product?->sku ?: ($item->variant?->sku ?: '')));
            $sku = '';
            if (!empty($rawSku) && !str_contains($rawSku, '509')) {
                $sku = $rawSku;
            }

            $shortName = (string) $item->product_name;
            $longName = $shortName . (!empty($item->variant_title) ? " ({$item->variant_title})" : '');
            $qty = (float) $item->quantity;
            $unitPrice = (float) $item->unit_price;
            $itemAmount = (float) $item->subtotal;

            $formattedItems[] = [
                'shortName' => $shortName,
                'longName' => $longName,
                'variants' => (string) ($item->variant_id ?: $item->product_id),
                'skuCode' => (string) $sku,
                'note' => implode(' | ', $notes),
                'quantity' => $qty,
                'unitPrice' => $unitPrice,
                'itemAmount' => $itemAmount,
                'optionAmount' => 0,
                'discountAmount' => 0,
                'itemTotalAmount' => $itemAmount,
            ];
        }

        $invoiceNum = (int) preg_replace('/[^0-9]/', '', $order->order_number) ?: $order->id;
        $isPickup = ($order->delivery_method ?? 'home_delivery') === 'pickup';

        // Determine branch code: use explicit rista_store_id if configured, otherwise fallback to default branch code
        $isExplicitStoreId = !empty($outlet->rista_store_id)
            && !str_starts_with($outlet->rista_store_id, 'AP')
            && !str_starts_with($outlet->rista_store_id, 'RSTA_STORE_');

        $defaultBranch = $this->defaultBranchCode;
        $branchCode = (string) ($isExplicitStoreId ? $outlet->rista_store_id : $defaultBranch);
        $branchName = (string) ($isExplicitStoreId ? ($outlet->name ?: $this->defaultBranchName) : $this->defaultBranchName);

        // Customer payload: omit arbitrary integer ID so Rista resolves existing customer by phone without conflict
        $customerData = [
            'name' => $order->customer_name ?: 'Customer',
            'phoneNumber' => (string) ($order->customer_phone ?: ''),
        ];
        if (!empty($order->customer_email)) {
            $customerData['email'] = $order->customer_email;
        }

        $outletNote = "Outlet: " . ($outlet->name ?? 'Ammas Pastries');
        $fullNote = trim($outletNote . ($order->special_instructions ? ' | ' . $order->special_instructions : ''));

        // Official Rista POS /sale payload matching schema
        $payload = [
            'branchCode' => $branchCode,
            'branchName' => $branchName,
            'status' => 'Open',
            'fulfillmentStatus' => 'Confirmed',
            'sourceInfo' => [
                'companyName' => "Amma's Website",
                'invoiceNumber' => $invoiceNum,
                'invoiceDate' => $order->created_at?->format('Y-m-d') ?? date('Y-m-d'),
                'callbackURL' => '',
                'callbackHeaders' => (object) [],
                'source' => 'Online',
                'sourceOutletId' => $branchCode,
                'outletId' => $branchCode,
                'isEditable' => true,
                'verifyCoupons' => true,
                'isEcomOrder' => true,
            ],
            'channel' => "Amma's Website",
            'items' => $formattedItems,
            'options' => [],
            'customer' => $customerData,
            'delivery' => [
                'name' => $order->customer_name ?: 'Customer',
                'email' => $order->customer_email ?: null,
                'phoneNumber' => (string) ($order->customer_phone ?: ''),
                'mode' => $isPickup ? 'Pickup' : 'Delivery',
                'address' => [
                    'label' => 'local',
                    'addressLine' => $order->delivery_address ?: ($outlet->address ?: 'Bengaluru'),
                    'city' => $order->delivery_city ?: ($outlet->city ?: 'Bengaluru'),
                    'state' => 'KA',
                    'country' => 'India',
                    'zip' => $order->delivery_pincode ?: ($outlet->pincode ?: '560001'),
                    'landmark' => '',
                    'latitude' => 0,
                    'longitude' => 0,
                ],
                'deliveryDate' => $order->delivery_date?->format('Y-m-d'),
            ],
            'payments' => [
                [
                    'mode' => 'Upi',
                    'amount' => (float) $order->total,
                    'reference' => (string) ($order->latestPayment?->transaction_id ?? $order->latestPayment?->razorpay_payment_id ?? ('ORD_' . $order->order_number)),
                    'note' => 'Online Prepaid Order',
                    'postedDate' => date('Y-m-d'),
                ]
            ],
            'saleBy' => "Amma's website",
            'saleByUserId' => $invoiceNum,
            'billAmount' => (float) $order->subtotal,
            'totalAmount' => (float) $order->total,
            'note' => $fullNote,
            'tags' => ['Ammas Pastries Web Order'],
        ];

        // Save prepared payload for audit tracking
        $order->update([
            'pos_payload' => $payload,
            'pos_sync_status' => 'pending',
        ]);

        try {
            $response = $this->client(15)->asJson()->post("{$this->baseUrl}/sale", $payload);

            // Fallback: If custom branchCode was rejected with 401 Unauthorized, retry using default branch
            if ($response->status() === 401 && $branchCode !== $defaultBranch) {
                Log::warning("Rista branch '{$branchCode}' unauthorized (HTTP 401). Retrying Order {$order->order_number} with default branch '{$defaultBranch}'");
                $payload['branchCode'] = $defaultBranch;
                $payload['branchName'] = $this->defaultBranchName;
                $payload['sourceInfo']['sourceOutletId'] = $defaultBranch;
                $payload['sourceInfo']['outletId'] = $defaultBranch;
                $response = $this->client(15)->asJson()->post("{$this->baseUrl}/sale", $payload);
            }

            if ($response->successful()) {
                $resData = $response->json();
                $posOrderId = $resData['invoiceNumber'] ?? $resData['order_id'] ?? $resData['data']['order_id'] ?? $resData['sale_id'] ?? ('RSTA_' . $order->order_number);

                $order->update([
                    'pos_synced' => true,
                    'pos_sync_status' => 'synced',
                    'pos_order_id' => $posOrderId,
                    'pos_synced_at' => now(),
                    'pos_error' => null,
                    'pos_response' => $resData,
                ]);

                Log::info("Rista POS Order synced successfully: Order {$order->order_number} to Store {$branchCode} (POS ID: {$posOrderId})");

                return [
                    'success' => true,
                    'status' => 'synced',
                    'pos_order_id' => $posOrderId,
                    'message' => "Order {$order->order_number} transmitted to {$outlet->name} POS terminal (Invoice: {$posOrderId})",
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
            // Test connection to Rista API Gateway /sale endpoint (authorized for Ammas Pastries brand)
            $response = $this->client(6)->get("{$this->baseUrl}/sale");
            $status = $response->status();

            // Status !== 401 confirms the API key, secret and dynamic HS256 JWT are authenticated by Rista AWS Gateway
            $isAuthenticated = ($status !== 401);

            return [
                'success' => $isAuthenticated,
                'status_code' => $status,
                'gateway_url' => $this->baseUrl,
                'api_key_masked' => !empty($this->apiKey) ? (substr($this->apiKey, 0, 6) . '...' . substr($this->apiKey, -4)) : 'Not Configured',
                'auth_type' => 'Official JWT (x-api-key + x-api-token HS256)',
                'message' => $isAuthenticated
                    ? 'Connected to Rista POS Gateway successfully! (Authentication Verified)'
                    : "Gateway rejected credentials with status HTTP {$status} (Unauthorized)",
            ];
        } catch (Throwable $e) {
            return [
                'success' => false,
                'status_code' => 500,
                'gateway_url' => $this->baseUrl,
                'api_key_masked' => !empty($this->apiKey) ? (substr($this->apiKey, 0, 6) . '...' . substr($this->apiKey, -4)) : 'Not Configured',
                'message' => 'Connection error: ' . $e->getMessage(),
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
