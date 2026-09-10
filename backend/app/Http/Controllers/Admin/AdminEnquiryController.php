<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FranchiseEnquiry;
use App\Models\ContactEnquiry;

class AdminEnquiryController extends Controller
{
    // Franchise enquiries
    public function getFranchise()
    {
        $enquiries = FranchiseEnquiry::orderBy('id', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $enquiries->items(),
            'pagination' => [
                'total' => $enquiries->total(),
                'current_page' => $enquiries->currentPage(),
                'last_page' => $enquiries->lastPage(),
            ]
        ]);
    }

    public function toggleFranchiseRead($id)
    {
        $enquiry = FranchiseEnquiry::findOrFail($id);
        $enquiry->is_read = !$enquiry->is_read;
        $enquiry->save();

        return response()->json([
            'success' => true,
            'message' => 'Status updated.',
            'data' => $enquiry,
        ]);
    }

    public function deleteFranchise($id)
    {
        $enquiry = FranchiseEnquiry::findOrFail($id);
        $enquiry->delete();
        return response()->json(['success' => true, 'message' => 'Franchise enquiry deleted.']);
    }

    // Contact enquiries
    public function getContact()
    {
        $enquiries = ContactEnquiry::orderBy('id', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $enquiries->items(),
            'pagination' => [
                'total' => $enquiries->total(),
                'current_page' => $enquiries->currentPage(),
                'last_page' => $enquiries->lastPage(),
            ]
        ]);
    }

    public function toggleContactRead($id)
    {
        $enquiry = ContactEnquiry::findOrFail($id);
        $enquiry->is_read = !$enquiry->is_read;
        $enquiry->save();

        return response()->json([
            'success' => true,
            'message' => 'Status updated.',
            'data' => $enquiry,
        ]);
    }

    public function deleteContact($id)
    {
        $enquiry = ContactEnquiry::findOrFail($id);
        $enquiry->delete();
        return response()->json(['success' => true, 'message' => 'Contact enquiry deleted.']);
    }
}
