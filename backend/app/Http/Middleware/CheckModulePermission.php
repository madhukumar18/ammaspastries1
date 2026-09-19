<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\SecurityLoggerService;

class CheckModulePermission
{
    /**
     * Handle an incoming request to verify per-module administrative permission.
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        // If Super Admin or Admin user, bypass all checks
        if ((method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) || in_array($user->role ?? '', ['admin', 'super_admin'])) {
            return $next($request);
        }

        // Check if user has permission for any of the allowed modules (supports pipe-delimited list like 'products|theme_cakes')
        $allowedModules = preg_split('/[|,]/', $module);
        if (method_exists($user, 'hasPermission')) {
            foreach ($allowedModules as $mod) {
                $mod = trim($mod);
                if ($mod && $user->hasPermission($mod)) {
                    return $next($request);
                }
            }
        }

        SecurityLoggerService::logThreat(
            type: 'UNAUTHORIZED_MODULE_ACCESS_ATTEMPT',
            severity: 'MEDIUM',
            message: "User '{$user->email}' attempted unauthorized access to module '{$module}' at '{$request->path()}'",
            request: $request,
            context: [
                'user_id' => $user->id,
                'module' => $module,
                'permissions' => $user->permissions ?? [],
            ]
        );

        return response()->json([
            'success' => false,
            'message' => "Access Denied: You do not have permission to access the '{$module}' module. Please contact your Super Administrator.",
        ], 403);
    }
}
