<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class AuthController extends Controller
{
    // Customer Registration
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'customer',
        ]);

        $token = $user->createToken('customer_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful! Welcome to Ammas Pastries.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ], 201);
    }

    // Customer Login (Email + Password)
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password. Please try again.',
            ], 401);
        }

        $token = $user->createToken('customer_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully!',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ]);
    }

    // Mobile + OTP - Request OTP (Supports safe local development OTP)
    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|min:10|max:15',
        ]);

        $phone = $validated['phone'];
        $otp = (string) rand(100000, 999999);

        // Find or create customer
        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => 'Customer ' . substr($phone, -4),
                'email' => null,
                'password' => null,
                'role' => 'customer',
            ]
        );

        $user->otp_code = $otp;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        // In development/local environment, return the OTP for testing
        $isLocal = config('app.env') === 'local' || config('app.debug');

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully to ' . $phone,
            'data' => [
                'phone' => $phone,
                'dev_otp' => $isLocal ? $otp : null, // visible in local development
            ]
        ]);
    }

    // Mobile + OTP - Verify OTP
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string',
        ]);

        $user = User::where('phone', $validated['phone'])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No user found with this mobile number.',
            ], 404);
        }

        if ($user->otp_code !== $validated['otp'] || ($user->otp_expires_at && now()->gt($user->otp_expires_at))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP. Please try again.',
            ], 400);
        }

        // Clear OTP on successful verification
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        $token = $user->createToken('customer_otp_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully!',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ]);
    }

    // Guest checkout session initiation
    public function guestSession()
    {
        $sessionId = 'guest_' . Str::random(24);
        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => $sessionId,
            ]
        ]);
    }

    // Customer profile
    public function profile(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'orders_count' => $user->orders()->count(),
            ]
        ]);
    }

    // Customer Logout
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
