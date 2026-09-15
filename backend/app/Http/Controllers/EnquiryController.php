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

        // Forward franchise enquiry to administrator email
        try {
            $destEmail = 'mkumar200418@gmail.com';
            $subjectLine = 'Ammas Pastries - New Franchise Enquiry from ' . $validated['name'];
            $senderEmail = $validated['email'];
            $senderName = $validated['name'];
            $phone = $validated['phone'];
            $city = $validated['city'] ?: 'Not specified';
            $budget = $validated['investment_budget'] ?: 'Not specified';
            $msgContent = $validated['message'];
            $timeNow = now()->toDayDateTimeString();

            $emailBody = "Hello Admin,\n\n"
                       . "A new franchise partnership enquiry has been submitted on Ammas Pastries.\n\n"
                       . "--------------------------------------------------\n"
                       . "PARTNER DETAILS\n"
                       . "--------------------------------------------------\n"
                       . "• Name: {$senderName}\n"
                       . "• Email: {$senderEmail}\n"
                       . "• Phone: {$phone}\n"
                       . "• City: {$city}\n"
                       . "• Budget: {$budget}\n"
                       . "• Received At: {$timeNow}\n\n"
                       . "--------------------------------------------------\n"
                       . "PROPOSAL / MESSAGE\n"
                       . "--------------------------------------------------\n"
                       . "{$msgContent}\n\n"
                       . "--------------------------------------------------\n"
                       . "You can reply directly to this email to contact {$senderName}.\n";

            \Illuminate\Support\Facades\Mail::raw($emailBody, function ($message) use ($destEmail, $subjectLine, $senderEmail, $senderName) {
                $message->to($destEmail)
                        ->replyTo($senderEmail, $senderName)
                        ->subject($subjectLine);
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Franchise enquiry email notification failed: ' . $e->getMessage());
        }

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

        // Send email notification to administrator email: mkumar200418@gmail.com
        try {
            $destEmail = 'mkumar200418@gmail.com';
            $subjectLine = 'Ammas Pastries Support - ' . ($validated['subject'] ?: 'New Customer Message');
            $senderEmail = $validated['email'];
            $senderName = $validated['name'];
            $phone = $validated['phone'] ?: 'Not specified';
            $msgContent = $validated['message'];
            $timeNow = now()->toDayDateTimeString();

            $emailBody = "Hello Admin,\n\n"
                       . "You have received a new customer support message on Ammas Pastries website.\n\n"
                       . "--------------------------------------------------\n"
                       . "CUSTOMER DETAILS\n"
                       . "--------------------------------------------------\n"
                       . "• Name: {$senderName}\n"
                       . "• Email: {$senderEmail}\n"
                       . "• Phone: {$phone}\n"
                       . "• Subject: " . ($validated['subject'] ?: 'Customer Support Enquiry') . "\n"
                       . "• Received At: {$timeNow}\n\n"
                       . "--------------------------------------------------\n"
                       . "MESSAGE\n"
                       . "--------------------------------------------------\n"
                       . "{$msgContent}\n\n"
                       . "--------------------------------------------------\n"
                       . "You can reply directly to this email to respond to {$senderName} ({$senderEmail}).\n";

            \Illuminate\Support\Facades\Mail::raw($emailBody, function ($message) use ($destEmail, $subjectLine, $senderEmail, $senderName) {
                $message->to($destEmail)
                        ->replyTo($senderEmail, $senderName)
                        ->subject($subjectLine);
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Contact support email notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for contacting Ammas Pastries. Your message has been sent to our customer care team.',
            'data' => $enquiry,
        ], 201);
    }
}
