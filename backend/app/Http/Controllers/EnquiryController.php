<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FranchiseEnquiry;
use App\Models\ContactEnquiry;

class EnquiryController extends Controller
{
    // Franchise Enquiry
    public function storeFranchise(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'city' => 'nullable|string|max:100',
            'investment_budget' => 'nullable|string|max:100',
            'message' => 'required|string|min:10|max:2000',
        ]);

        $enquiry = FranchiseEnquiry::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your interest in partnering with Ammas Pastries! Our franchise expansion team will contact you.',
            'data' => $enquiry,
        ], 201);
    }

    // Contact Us Enquiry
    public function storeContact(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|min:5|max:2000',
        ]);

        $enquiry = ContactEnquiry::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for contacting Ammas Pastries. Our customer support team will reply promptly.',
            'data' => $enquiry,
        ], 201);
    }
}
