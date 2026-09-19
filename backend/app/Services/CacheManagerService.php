<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Throwable;

class CacheManagerService
{
    const CACHE_CLEARED_KEY = 'app_cache_last_cleared_at';
    const CACHE_CATALOG_TAGS = ['products', 'categories', 'catalog'];

    /**
     * Get detailed status of Cache and Redis.
     */
    public function getStatus(): array
    {
        $defaultStore = config('cache.default', 'file');
        $redisClient = config('database.redis.client', 'phpredis');
        $redisHost = config('database.redis.default.host', '127.0.0.1');
        $redisPort = config('database.redis.default.port', '6379');

        $redisConnected = false;
        $redisError = null;
        $redisInfo = [];

        try {
            if (class_exists(\Redis::class) || class_exists(\Predis\Client::class)) {
                $connection = Redis::connection();
                $ping = $connection->ping();

                if ($ping === true || $ping === 'PONG' || $ping === '+PONG' || str_contains((string) $ping, 'PONG')) {
                    $redisConnected = true;
                    try {
                        $rawInfo = $connection->info();
                        $redisInfo = [
                            'version' => $rawInfo['redis_version'] ?? ($rawInfo['Server']['redis_version'] ?? 'Unknown'),
                            'memory_used' => $rawInfo['used_memory_human'] ?? ($rawInfo['Memory']['used_memory_human'] ?? 'Unknown'),
                            'memory_peak' => $rawInfo['used_memory_peak_human'] ?? ($rawInfo['Memory']['used_memory_peak_human'] ?? 'Unknown'),
                            'connected_clients' => $rawInfo['connected_clients'] ?? ($rawInfo['Clients']['connected_clients'] ?? 1),
                            'uptime_days' => $rawInfo['uptime_in_days'] ?? ($rawInfo['Server']['uptime_in_days'] ?? 0),
                            'total_commands' => $rawInfo['total_commands_processed'] ?? ($rawInfo['Stats']['total_commands_processed'] ?? 0),
                        ];
                    } catch (Throwable $e) {
                        // Info command might fail with restricted Redis setups
                        $redisInfo = ['status' => 'PONG received'];
                    }
                }
            } else {
                $redisError = 'PHP Redis extension (phpredis) is not installed in the current PHP environment.';
            }
        } catch (Throwable $e) {
            $redisConnected = false;
            $redisError = $e->getMessage();
        }

        $lastCleared = Cache::get(self::CACHE_CLEARED_KEY);
        if (!$lastCleared && file_exists(storage_path('framework/cache/last_cleared.txt'))) {
            $lastCleared = trim(@file_get_contents(storage_path('framework/cache/last_cleared.txt')));
        }

        return [
            'cache_driver' => $defaultStore,
            'is_redis_active_driver' => ($defaultStore === 'redis'),
            'redis' => [
                'connected' => $redisConnected,
                'client' => $redisClient,
                'host' => $redisHost,
                'port' => $redisPort,
                'error' => $redisError,
                'info' => $redisInfo,
            ],
            'last_cleared_at' => $lastCleared ?: 'Never (or Cache Empty)',
            'server_time' => now()->toIso8601String(),
        ];
    }

    /**
     * Clear catalog cache (products, categories, filters).
     */
    public function clearCatalog(): array
    {
        try {
            // If cache supports tags (Redis, Memcached)
            if (Cache::supportsTags()) {
                Cache::tags(self::CACHE_CATALOG_TAGS)->flush();
            } else {
                // For file / database cache stores, flush application cache
                Cache::flush();
            }

            $timestamp = now()->format('Y-m-d H:i:s');
            Cache::forever(self::CACHE_CLEARED_KEY, $timestamp);
            @file_put_contents(storage_path('framework/cache/last_cleared.txt'), $timestamp);

            return [
                'success' => true,
                'message' => 'Product and category catalog cache cleared successfully.',
                'cleared_at' => $timestamp,
            ];
        } catch (Throwable $e) {
            Log::error('Catalog cache clear failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to clear catalog cache: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Clear all application data cache.
     */
    public function clearAll(): array
    {
        try {
            Cache::flush();

            $timestamp = now()->format('Y-m-d H:i:s');
            Cache::forever(self::CACHE_CLEARED_KEY, $timestamp);
            @file_put_contents(storage_path('framework/cache/last_cleared.txt'), $timestamp);

            return [
                'success' => true,
                'message' => 'All application and memory caches have been completely cleared.',
                'cleared_at' => $timestamp,
            ];
        } catch (Throwable $e) {
            Log::error('All cache clear failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to clear all cache: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Clear framework system optimization caches (routes, config, views).
     */
    public function clearSystem(): array
    {
        try {
            Artisan::call('optimize:clear');
            $output = trim(Artisan::output());

            return [
                'success' => true,
                'message' => 'System configuration, route, and compiled view caches cleared.',
                'details' => $output,
            ];
        } catch (Throwable $e) {
            return [
                'success' => false,
                'message' => 'Failed to clear system cache: ' . $e->getMessage(),
            ];
        }
    }
}
