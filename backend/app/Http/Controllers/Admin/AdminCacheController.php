<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\CacheManagerService;
use Illuminate\Http\Request;

class AdminCacheController extends Controller
{
    protected CacheManagerService $cacheService;

    public function __construct(CacheManagerService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Get Cache & Redis status.
     */
    public function status()
    {
        $status = $this->cacheService->getStatus();

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    /**
     * Clear Cache by scope: 'catalog', 'all', or 'system'.
     */
    public function clear(Request $request)
    {
        $scope = $request->input('scope', 'catalog');

        switch ($scope) {
            case 'all':
                $result = $this->cacheService->clearAll();
                break;
            case 'system':
                $result = $this->cacheService->clearSystem();
                break;
            case 'catalog':
            default:
                $result = $this->cacheService->clearCatalog();
                break;
        }

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }
}
