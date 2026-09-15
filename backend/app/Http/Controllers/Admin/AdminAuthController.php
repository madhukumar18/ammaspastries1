<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;

class AdminAuthController extends Controller
{
    public const AUTHORIZED_ADMIN_EMAIL = 'mkumar200418@gmail.com';

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($validated['email']));

        if ($email !== self::AUTHORIZED_ADMIN_EMAIL) {
            \App\Services\SecurityLoggerService::logThreat(
                type: 'UNAUTHORIZED_ADMIN_REGISTRATION_ATTEMPT',
                severity: 'CRITICAL',
                message: "Unauthorized admin registration attempt with email: '{$email}'",
                request: $request,
                context: ['attempted_email' => $email]
            );

            return response()->json([
                'success' => false,
                'message' => 'Access denied: You are not authorized to create an administrator account.',
            ], 403);
        }

        // Check if admin account already exists
        $existingAdmin = Admin::where('email', $email)->first();
        if ($existingAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'This account already exists. Please sign in or use forgot password to reset your credentials.',
            ], 409);
        }

        // Ensure super_admin role exists
        $superRole = \App\Models\Role::firstOrCreate(
            ['slug' => 'super_admin'],
            ['name' => 'Super Administrator', 'description' => 'Full access to all operations']
        );

        $admin = Admin::create([
            'name' => $validated['name'] ?: 'Administrator',
            'email' => self::AUTHORIZED_ADMIN_EMAIL,
            'password' => Hash::make($validated['password']),
            'role_id' => $superRole->id,
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $token = $admin->createToken('admin_token', ['admin'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Administrator account created successfully! Welcome to Ammas Pastries Admin.',
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                ],
                'token' => $token,
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($validated['email']));

        // Restrict admin portal login exclusively to mkumar200418@gmail.com
        if ($email !== self::AUTHORIZED_ADMIN_EMAIL) {
            \App\Services\SecurityLoggerService::logThreat(
                type: 'UNAUTHORIZED_ADMIN_LOGIN_ATTEMPT',
                severity: 'HIGH',
                message: "Unauthorized email attempted admin login: '{$email}'",
                request: $request,
                context: ['attempted_email' => $email]
            );

            return response()->json([
                'success' => false,
                'message' => 'Access denied: Invalid administrative credentials.',
            ], 403);
        }

        $admin = Admin::where('email', $email)->first();

        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            \App\Services\SecurityLoggerService::logThreat(
                type: 'ADMIN_LOGIN_FAILURE',
                severity: 'HIGH',
                message: "Failed administrator login attempt for '{$email}'",
                request: $request,
                context: ['attempted_email' => $email]
            );

            return response()->json([
                'success' => false,
                'message' => 'Invalid administrative credentials.',
            ], 401);
        }

        if (!$admin->is_active) {
            \App\Services\SecurityLoggerService::logThreat(
                type: 'DEACTIVATED_ADMIN_LOGIN',
                severity: 'HIGH',
                message: "Deactivated administrator attempted login: '{$email}'",
                request: $request,
                context: ['admin_id' => $admin->id, 'email' => $admin->email]
            );

            return response()->json([
                'success' => false,
                'message' => 'Your administrator account has been deactivated.',
            ], 403);
        }

        $token = $admin->createToken('admin_token', ['admin'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authenticated to Ammas Admin Dashboard.',
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                ],
                'token' => $token,
            ]
        ]);
    }

    public function me(Request $request)
    {
        $admin = $request->user();
        return response()->json([
            'success' => true,
            'data' => [
                'admin' => $admin,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Admin signed out successfully.',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($validated['email']));

        if ($email !== self::AUTHORIZED_ADMIN_EMAIL) {
            \App\Services\SecurityLoggerService::logThreat(
                type: 'UNAUTHORIZED_ADMIN_FORGOT_PASSWORD',
                severity: 'MEDIUM',
                message: "Unauthorized forgot password attempt for: '{$email}'",
                request: $request,
                context: ['attempted_email' => $email]
            );

            return response()->json([
                'success' => false,
                'message' => 'Access denied: You are not authorized to reset password for this email.',
            ], 403);
        }

        $admin = Admin::where('email', $email)->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'No administrator account found for this email. Please create your account first.',
            ], 404);
        }

        $otp = (string) rand(100000, 999999);
        $admin->otp_code = $otp;
        $admin->otp_expires_at = now()->addMinutes(15);
        $admin->save();

        // Send OTP email
        try {
            \Illuminate\Support\Facades\Mail::raw(
                "Hello {$admin->name},\n\nYour Ammas Pastries Administrator password reset OTP is: {$otp}\n\nThis OTP is valid for 15 minutes.\nIf you did not request this password reset, please ignore this email.\n\nWarm regards,\nAmmas Pastries Security Team",
                function ($message) use ($admin) {
                    $message->to($admin->email)
                            ->subject('Ammas Pastries Admin - Password Reset OTP');
                }
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Admin OTP Mailer exception: ' . $e->getMessage());
        }

        $isLocal = config('app.env') === 'local' || config('app.debug');

        return response()->json([
            'success' => true,
            'message' => 'A 6-digit OTP has been sent to your email address.',
            'data' => [
                'email' => $email,
                'dev_otp' => $isLocal ? $otp : null,
            ]
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($validated['email']));

        if ($email !== self::AUTHORIZED_ADMIN_EMAIL) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied: Invalid administrative request.',
            ], 403);
        }

        $admin = Admin::where('email', $email)->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'No administrator account found.',
            ], 404);
        }

        if ($admin->otp_code !== $validated['otp'] || ($admin->otp_expires_at && now()->gt($admin->otp_expires_at))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP. Please request a new code.',
            ], 400);
        }

        // Reset password and clear OTP
        $admin->password = Hash::make($validated['password']);
        $admin->otp_code = null;
        $admin->otp_expires_at = null;
        $admin->save();

        // Revoke all existing tokens for security
        $admin->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully! You can now sign in with your new password.',
        ]);
    }
}
