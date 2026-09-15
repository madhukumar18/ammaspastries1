<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SecurityLoggerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AdminSecurityLogController extends Controller
{
    /**
     * Get paginated & filtered security incident entries
     */
    public function index(Request $request)
    {
        $limit = (int) $request->input('per_page', 30);
        $severity = $request->input('severity');
        $type = $request->input('threat_type');
        $search = $request->input('search');
        $page = (int) $request->input('page', 1);

        $result = SecurityLoggerService::getLogEntries($limit, $severity, $type, $search, $page);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get security incident counts, top offending IPs, and file metadata
     */
    public function stats()
    {
        $stats = SecurityLoggerService::getStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Download the raw security.log file
     */
    public function download()
    {
        $path = SecurityLoggerService::getLogPath();

        if (!File::exists($path)) {
            File::put($path, "");
        }

        return response()->download(
            $path,
            'ammas-pastries-security-' . now()->format('Y-m-d') . '.log',
            ['Content-Type' => 'text/plain']
        );
    }

    /**
     * Clear / archive security log file
     */
    public function clear()
    {
        $cleared = SecurityLoggerService::clearLogs();

        if ($cleared) {
            return response()->json([
                'success' => true,
                'message' => 'Security log cleared and reset successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unable to clear security log file.',
        ], 500);
    }

    /**
     * Delete an individual security threat incident by ID
     */
    public function destroy($incidentId)
    {
        $deleted = SecurityLoggerService::deleteIncident($incidentId);

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => "Security incident {$incidentId} deleted successfully.",
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => "Incident {$incidentId} not found or already deleted.",
        ], 404);
    }

    /**
     * Trigger a simulated security event to test live logging and dashboard
     */
    public function testAlert(Request $request)
    {
        $incidentId = SecurityLoggerService::logThreat(
            type: 'SECURITY_SIMULATION_TEST',
            severity: 'CRITICAL',
            message: 'Manual security alert triggered by Administrator to verify logging firewall',
            request: $request,
            context: [
                'triggered_by' => $request->user()?->email ?? 'Admin',
                'test_scenario' => 'SQLi / XSS Attack Simulation Detection',
                'simulated_vector' => "id=1' UNION SELECT 1, 'admin', password FROM users--",
                'firewall_status' => 'ACTIVE',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Test security incident logged successfully! (Incident ID: {$incidentId})",
            'data' => [
                'incident_id' => $incidentId,
            ]
        ]);
    }
}
