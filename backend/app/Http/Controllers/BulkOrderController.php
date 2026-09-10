<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\BulkOrder;
use App\Models\BulkOrderItem;
use App\Models\BulkImport;

class BulkOrderController extends Controller
{
    // Stream downloadable CSV template
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="Ammas_Pastries_Bulk_Order_Template.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'Customer Name',
            'Phone',
            'Email',
            'Product Name',
            'Quantity',
            'Preferred Date',
            'Preferred Time',
            'Outlet',
            'Special Instructions'
        ];

        $sampleRows = [
            ['Infosys Corporate Team', '9876543210', 'events@infosys.com', 'Mango Fresh Cream Cake', '15', '2026-10-15', '03:00 PM', 'MG Road', 'Individual celebration boxes with company logo'],
            ['Wipro HR Dept', '9812345678', 'hr@wipro.com', 'Fudge Walnut Brownie', '50', '2026-10-20', '11:00 AM', 'Indiranagar', 'Eggless only please'],
        ];

        $callback = function () use ($columns, $sampleRows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            foreach ($sampleRows as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // Process & validate uploaded CSV
    public function uploadCsv(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
            'customer_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $file = $request->file('csv_file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');

        if (!$handle) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to read the uploaded CSV file.',
            ], 400);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'The uploaded CSV file is empty.',
            ], 400);
        }

        // Clean headers
        $cleanHeader = array_map(function ($h) {
            return strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h)));
        }, $header);

        $expectedColumns = [
            'customer name',
            'phone',
            'email',
            'product name',
            'quantity',
            'preferred date',
            'preferred time',
            'outlet',
            'special instructions'
        ];

        // Check if header contains at least key columns
        $missingKeyColumns = [];
        foreach (['customer name', 'phone', 'product name', 'quantity'] as $mustHave) {
            if (!in_array($mustHave, $cleanHeader)) {
                $missingKeyColumns[] = $mustHave;
            }
        }

        if (!empty($missingKeyColumns)) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'Missing mandatory CSV column(s): ' . implode(', ', $missingKeyColumns) . '. Please download the official template.',
            ], 422);
        }

        $colMap = array_flip($cleanHeader);

        $rowNumber = 1;
        $validationErrors = [];
        $validItems = [];
        $firstCustomerName = $request->input('customer_name');
        $firstPhone = $request->input('phone');
        $firstEmail = $request->input('email');

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            // Skip empty rows
            if (empty(array_filter($row))) continue;

            $custName = isset($colMap['customer name']) ? trim($row[$colMap['customer name']] ?? '') : '';
            $phone = isset($colMap['phone']) ? trim($row[$colMap['phone']] ?? '') : '';
            $email = isset($colMap['email']) ? trim($row[$colMap['email']] ?? '') : '';
            $productName = isset($colMap['product name']) ? trim($row[$colMap['product name']] ?? '') : '';
            $quantityRaw = isset($colMap['quantity']) ? trim($row[$colMap['quantity']] ?? '') : '';
            $prefDate = isset($colMap['preferred date']) ? trim($row[$colMap['preferred date']] ?? '') : null;
            $prefTime = isset($colMap['preferred time']) ? trim($row[$colMap['preferred time']] ?? '') : null;
            $outlet = isset($colMap['outlet']) ? trim($row[$colMap['outlet']] ?? '') : null;
            $instructions = isset($colMap['special instructions']) ? trim($row[$colMap['special instructions']] ?? '') : null;

            if (empty($firstCustomerName) && !empty($custName)) $firstCustomerName = $custName;
            if (empty($firstPhone) && !empty($phone)) $firstPhone = $phone;
            if (empty($firstEmail) && !empty($email)) $firstEmail = $email;

            $rowErrors = [];

            if (empty($productName)) {
                $rowErrors[] = "Row {$rowNumber}: Product Name is missing.";
            }

            if (!is_numeric($quantityRaw) || (int) $quantityRaw <= 0) {
                $rowErrors[] = "Row {$rowNumber}: Invalid quantity '{$quantityRaw}'. Quantity must be at least 1.";
            }

            if (!empty($phone) && !preg_match('/^[0-9+\-\s]{7,15}$/', $phone)) {
                $rowErrors[] = "Row {$rowNumber}: Invalid phone number '{$phone}'.";
            }

            if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = "Row {$rowNumber}: Invalid email address '{$email}'.";
            }

            if (!empty($rowErrors)) {
                $validationErrors = array_merge($validationErrors, $rowErrors);
            } else {
                $validItems[] = [
                    'product_name' => $productName,
                    'quantity' => (int) $quantityRaw,
                    'preferred_date' => $prefDate ? date('Y-m-d', strtotime($prefDate)) : null,
                    'preferred_time' => $prefTime,
                    'outlet' => $outlet,
                    'special_instructions' => $instructions,
                ];
            }
        }

        fclose($handle);

        // Store file in storage
        $storedPath = $file->storeAs('bulk_imports', 'bulk_' . time() . '_' . $file->getClientOriginalName());

        $bulkImport = BulkImport::create([
            'filename' => $file->getClientOriginalName(),
            'customer_name' => $firstCustomerName ?: 'Corporate Customer',
            'customer_phone' => $firstPhone ?: 'N/A',
            'total_rows' => $rowNumber - 1,
            'valid_rows' => count($validItems),
            'status' => empty($validationErrors) ? 'valid' : 'has_errors',
            'validation_errors' => $validationErrors,
        ]);

        if (count($validItems) > 0) {
            $bulkOrder = BulkOrder::create([
                'customer_name' => $firstCustomerName ?: 'Corporate Customer',
                'email' => $firstEmail ?: 'corporate@ammaspastries.in',
                'phone' => $firstPhone ?: 'N/A',
                'order_type' => 'csv',
                'csv_filename' => $file->getClientOriginalName(),
                'csv_filepath' => $storedPath,
                'total_items_count' => count($validItems),
                'status' => 'pending',
                'message' => 'Uploaded via CSV batch (' . count($validItems) . ' product lines)',
            ]);

            foreach ($validItems as $item) {
                $bulkOrder->items()->create($item);
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($validationErrors) > 0
                ? 'CSV processed with some validation notices.'
                : 'Bulk order CSV processed successfully! Our corporate catering team will contact you.',
            'data' => [
                'total_rows' => $rowNumber - 1,
                'valid_count' => count($validItems),
                'errors' => $validationErrors,
            ]
        ]);
    }

    // Submit sentence/message bulk order enquiry
    public function submitMessage(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'message' => 'required|string|min:10|max:2000',
        ]);

        $order = BulkOrder::create([
            'customer_name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'order_type' => 'message',
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you! Your bulk order enquiry has been received. Our executive will call you within 2 hours.',
            'data' => $order,
        ]);
    }
}
