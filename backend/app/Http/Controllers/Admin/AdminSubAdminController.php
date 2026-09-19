<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;
use App\Services\SecurityLoggerService;

class AdminSubAdminController extends Controller
{
    /**
     * Module definitions with metadata for RBAC UI.
     */
    public const AVAILABLE_MODULES = [
        [
            'key' => 'dashboard',
            'name' => 'Dashboard & Analytics',
            'category' => 'Overview',
            'description' => 'View total sales, revenue metrics, orders summaries, and visual analytics.',
            'icon' => 'LayoutDashboard',
        ],
        [
            'key' => 'products',
            'name' => 'Products & Inventory',
            'category' => 'Catalog Management',
            'description' => 'Manage cake listings, pricing, weights, flavours, and in-stock toggles.',
            'icon' => 'Cake',
        ],
        [
            'key' => 'bulk_products',
            'name' => 'Bulk Products (CSV/Excel)',
            'category' => 'Catalog Management',
            'description' => 'Batch export and import product catalogs via spreadsheet templates.',
            'icon' => 'FileSpreadsheet',
        ],
        [
            'key' => 'photo_cakes',
            'name' => 'Photo Cake Studio',
            'category' => 'Customization Studios',
            'description' => 'Manage custom photo cake print specs, 2D/3D shapes, and customer image submissions.',
            'icon' => 'Camera',
        ],
        [
            'key' => 'theme_cakes',
            'name' => 'Theme Cake Studio',
            'category' => 'Customization Studios',
            'description' => 'Curate designer theme cakes, kids specials, occasions, and tier configs.',
            'icon' => 'Crown',
        ],
        [
            'key' => 'categories',
            'name' => 'Categories & Showcase',
            'category' => 'Catalog Management',
            'description' => 'Organize cake categories, subcategories, display hierarchies, and showcase images.',
            'icon' => 'FolderTree',
        ],
        [
            'key' => 'banners',
            'name' => 'Banners & Hero Carousel',
            'category' => 'Marketing & Storefront',
            'description' => 'Update home page sliders, promotional hero banners, and promotional links.',
            'icon' => 'Images',
        ],
        [
            'key' => 'outlets',
            'name' => 'Outlets & Store Locations',
            'category' => 'Store Operations',
            'description' => 'Manage physical bakery branches, Google Map links, coordinates, and operating hours.',
            'icon' => 'Store',
        ],
        [
            'key' => 'orders',
            'name' => 'Orders & Tracking',
            'category' => 'Store Operations',
            'description' => 'Monitor customer orders, update delivery status, and inspect order line items.',
            'icon' => 'ShoppingBag',
        ],
        [
            'key' => 'rista_pos',
            'name' => 'Rista POS Integration',
            'category' => 'Store Operations',
            'description' => 'DotPe/Rista point-of-sale store mapping, inventory sync, and webhook logs.',
            'icon' => 'MonitorSmartphone',
        ],
        [
            'key' => 'security_logs',
            'name' => 'Security & Threat Logs',
            'category' => 'Administration',
            'description' => 'Audit security events, unauthorized access attempts, and system alerts.',
            'icon' => 'ShieldAlert',
        ],
        [
            'key' => 'gifting',
            'name' => 'Gifting & Dream Cakes',
            'category' => 'Marketing & Storefront',
            'description' => 'Curate festive hampers, gift products, and trending dream cake spotlights.',
            'icon' => 'Gift',
        ],
        [
            'key' => 'reviews',
            'name' => 'Customer Reviews Moderation',
            'category' => 'Customer Relations',
            'description' => 'Moderate customer ratings, approve testimonials, and spotlight featured reviews.',
            'icon' => 'Star',
        ],
        [
            'key' => 'bulk_orders',
            'name' => 'Corporate B2B Orders',
            'category' => 'Corporate Orders',
            'description' => 'Process bulk corporate cake spreadsheets, custom branding enquiries, and invoices.',
            'icon' => 'Handshake',
        ],
        [
            'key' => 'franchise_enquiries',
            'name' => 'Franchise Enquiries',
            'category' => 'Business Enquiries',
            'description' => 'Review business partnership inquiries, franchise leads, and investor submissions.',
            'icon' => 'Building2',
        ],
        [
            'key' => 'contact_enquiries',
            'name' => 'Contact Enquiries',
            'category' => 'Customer Relations',
            'description' => 'Handle general inquiries, feedback, and customer support messages.',
            'icon' => 'MessageSquare',
        ],
        [
            'key' => 'settings',
            'name' => 'Content & Settings',
            'category' => 'Administration',
            'description' => 'Manage top delivery announcement bar, store policies, and official contact metadata.',
            'icon' => 'Settings',
        ],
    ];

    /**
     * Check if caller is super admin.
     */
    private function verifySuperAdmin(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in again.',
            ], 401);
        }

        $isSuper = (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin());

        if (!$isSuper) {
            SecurityLoggerService::logThreat(
                type: 'UNAUTHORIZED_SUBADMIN_MGMT_ATTEMPT',
                severity: 'HIGH',
                message: "Non-super admin ({$user->email}) attempted to access Sub-Admin management API",
                request: $request,
                context: ['admin_id' => $user->id, 'email' => $user->email, 'role' => $user->role]
            );

            return response()->json([
                'success' => false,
                'message' => 'Access Denied: Only Super Administrators can manage administrative accounts.',
            ], 403);
        }
        return null;
    }

    /**
     * Return available modules metadata list.
     */
    public function modulesList(Request $request)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'modules' => self::AVAILABLE_MODULES,
            ]
        ]);
    }

    /**
     * List all sub-admins with filters.
     */
    public function index(Request $request)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        $query = Admin::query()->orderBy('created_at', 'desc');

        // Search by name or email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by role
        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $admins = $query->get()->map(function ($admin) {
            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'role' => $admin->role,
                'is_super_admin' => $admin->isSuperAdmin(),
                'is_active' => (bool) $admin->is_active,
                'permissions' => $admin->isSuperAdmin() ? ['*'] : ($admin->permissions ?? []),
                'profile_photo' => $admin->profile_photo,
                'profile_photo_url' => $admin->profile_photo_url,
                'created_at' => $admin->created_at?->toIso8601String(),
                'updated_at' => $admin->updated_at?->toIso8601String(),
            ];
        });

        $stats = [
            'total' => Admin::count(),
            'active' => Admin::where('is_active', true)->count(),
            'inactive' => Admin::where('is_active', false)->count(),
            'super_admins' => Admin::where('role', 'super_admin')->orWhere('email', 'mkumar200418@gmail.com')->count(),
            'sub_admins' => Admin::where('role', '!=', 'super_admin')->where('email', '!=', 'mkumar200418@gmail.com')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'admins' => $admins,
                'stats' => $stats,
                'available_modules' => self::AVAILABLE_MODULES,
            ]
        ]);
    }

    /**
     * Create a new sub-admin account.
     */
    public function store(Request $request)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:admin,store_manager,operations,editor,sub_admin',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
            'is_active' => 'nullable|boolean',
        ]);

        $email = strtolower(trim($validated['email']));

        $admin = Admin::create([
            'name' => trim($validated['name']),
            'email' => $email,
            'phone' => isset($validated['phone']) ? trim($validated['phone']) : null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'admin',
            'permissions' => array_values(array_unique($validated['permissions'])),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Sub-Admin '{$admin->name}' created successfully with assigned module permissions.",
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'role' => $admin->role,
                    'is_super_admin' => $admin->isSuperAdmin(),
                    'is_active' => (bool) $admin->is_active,
                    'permissions' => $admin->permissions,
                    'profile_photo_url' => $admin->profile_photo_url,
                    'created_at' => $admin->created_at?->toIso8601String(),
                ]
            ]
        ], 201);
    }

    /**
     * Get single sub-admin.
     */
    public function show(Request $request, $id)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        $admin = Admin::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'role' => $admin->role,
                    'is_super_admin' => $admin->isSuperAdmin(),
                    'is_active' => (bool) $admin->is_active,
                    'permissions' => $admin->isSuperAdmin() ? ['*'] : ($admin->permissions ?? []),
                    'profile_photo_url' => $admin->profile_photo_url,
                    'created_at' => $admin->created_at?->toIso8601String(),
                ]
            ]
        ]);
    }

    /**
     * Update an existing sub-admin account.
     */
    public function update(Request $request, $id)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        $admin = Admin::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email,' . $admin->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'is_active' => 'nullable|boolean',
        ]);

        $admin->name = trim($validated['name']);

        // Don't change super admin primary email
        if (!$admin->isSuperAdmin()) {
            $admin->email = strtolower(trim($validated['email']));
        }

        $admin->phone = isset($validated['phone']) ? trim($validated['phone']) : $admin->phone;

        if (!empty($validated['password'])) {
            $admin->password = Hash::make($validated['password']);
            // Revoke active tokens on password change
            $admin->tokens()->delete();
        }

        if (!$admin->isSuperAdmin()) {
            if (isset($validated['role'])) {
                $admin->role = $validated['role'];
            }
            if (isset($validated['permissions'])) {
                $admin->permissions = array_values(array_unique($validated['permissions']));
            }
            if (isset($validated['is_active'])) {
                $admin->is_active = (bool) $validated['is_active'];
            }
        }

        $admin->save();

        return response()->json([
            'success' => true,
            'message' => "Sub-Admin '{$admin->name}' updated successfully.",
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'role' => $admin->role,
                    'is_super_admin' => $admin->isSuperAdmin(),
                    'is_active' => (bool) $admin->is_active,
                    'permissions' => $admin->isSuperAdmin() ? ['*'] : ($admin->permissions ?? []),
                    'profile_photo_url' => $admin->profile_photo_url,
                    'updated_at' => $admin->updated_at?->toIso8601String(),
                ]
            ]
        ]);
    }

    /**
     * Toggle active/inactive status.
     */
    public function toggleStatus(Request $request, $id)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        $admin = Admin::findOrFail($id);

        if ($admin->isSuperAdmin() || $admin->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Super Administrator account cannot be deactivated.',
            ], 422);
        }

        $admin->is_active = !$admin->is_active;
        $admin->save();

        if (!$admin->is_active) {
            $admin->tokens()->delete();
        }

        $statusStr = $admin->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'success' => true,
            'message' => "Sub-Admin '{$admin->name}' has been {$statusStr}.",
            'data' => [
                'id' => $admin->id,
                'is_active' => (bool) $admin->is_active,
            ]
        ]);
    }

    /**
     * Delete a sub-admin.
     */
    public function destroy(Request $request, $id)
    {
        if ($guard = $this->verifySuperAdmin($request)) {
            return $guard;
        }

        $admin = Admin::findOrFail($id);

        if ($admin->isSuperAdmin() || $admin->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Super Administrator account cannot be deleted.',
            ], 422);
        }

        $adminName = $admin->name;
        $admin->tokens()->delete();
        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => "Sub-Admin '{$adminName}' deleted successfully.",
        ]);
    }
}
