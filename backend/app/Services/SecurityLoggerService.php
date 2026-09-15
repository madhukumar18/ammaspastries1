<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SecurityLoggerService
{
    protected static string $logPath = '';

    public static function getLogPath(): string
    {
        if (empty(self::$logPath)) {
            self::$logPath = storage_path('logs/security.log');
        }
        return self::$logPath;
    }

    /**
     * Ensure log file and parent directories exist
     */
    protected static function ensureLogFileExists(): void
    {
        $path = self::getLogPath();
        $dir = dirname($path);
        if (!File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        if (!File::exists($path)) {
            File::put($path, "");
        }
    }

    /**
     * Log a security threat or suspicious activity
     */
    public static function logThreat(
        string $type,
        string $severity = 'HIGH',
        string $message = 'Security threat detected',
        ?Request $request = null,
        array $context = []
    ): string {
        self::ensureLogFileExists();

        $incidentId = 'SEC-' . strtoupper(Str::random(10));
        $timestamp = now()->toDateTimeString();
        $ip = $request ? ($request->header('X-Forwarded-For') ?: $request->ip()) : '127.0.0.1';
        $method = $request ? $request->method() : 'CLI';
        $url = $request ? $request->fullUrl() : 'SYSTEM';
        $userAgent = $request ? ($request->header('User-Agent') ?: 'Unknown') : 'System/Daemon';
        $userId = $request?->user()?->id;

        // Mask sensitive parameters in context
        $sanitizedContext = self::sanitizeContext($context);

        $record = [
            'incident_id' => $incidentId,
            'timestamp' => $timestamp,
            'severity' => strtoupper($severity),
            'threat_type' => strtoupper($type),
            'message' => $message,
            'ip' => $ip,
            'method' => $method,
            'url' => $url,
            'user_agent' => $userAgent,
            'user_id' => $userId,
            'context' => $sanitizedContext,
        ];

        $logLine = sprintf(
            "[%s] SECURITY.%s: [%s] %s %s\n",
            $timestamp,
            strtoupper($severity),
            strtoupper($type),
            $message,
            json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );

        try {
            File::append(self::getLogPath(), $logLine);
        } catch (\Exception $e) {
            // Fallback to standard Laravel log
            Log::channel('single')->error("Failed writing to security.log: " . $e->getMessage());
        }

        return $incidentId;
    }

    /**
     * Log unhandled system errors and exceptions
     */
    public static function logException(
        \Throwable $e,
        ?Request $request = null,
        string $severity = 'ERROR'
    ): string {
        return self::logThreat(
            type: 'SYSTEM_ERROR',
            severity: $severity,
            message: 'Unhandled Exception: ' . $e->getMessage(),
            request: $request,
            context: [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'code' => $e->getCode(),
                'trace_snippet' => array_slice(explode("\n", $e->getTraceAsString()), 0, 5),
            ]
        );
    }

    /**
     * Log failed login attempts (Brute Force Tracking)
     */
    public static function logAuthFailure(
        Request $request,
        string $identifier,
        string $reason = 'Invalid credentials'
    ): string {
        return self::logThreat(
            type: 'AUTH_BRUTE_FORCE',
            severity: 'WARNING',
            message: "Authentication failure for '{$identifier}': {$reason}",
            request: $request,
            context: [
                'attempted_identifier' => $identifier,
                'reason' => $reason,
            ]
        );
    }

    /**
     * Log unauthorized admin access attempts
     */
    public static function logUnauthorizedAdminAccess(
        Request $request,
        string $reason = 'Restricted admin route accessed without privileges'
    ): string {
        return self::logThreat(
            type: 'ADMIN_UNAUTHORIZED_ACCESS',
            severity: 'HIGH',
            message: "Unauthorized attempt to access protected admin endpoint",
            request: $request,
            context: [
                'endpoint' => $request->path(),
                'reason' => $reason,
                'user_id' => $request->user()?->id,
            ]
        );
    }

    /**
     * Log payment tampering (Razorpay signature mismatch or payload tampering)
     */
    public static function logPaymentTampering(
        Request $request,
        int|string $orderId,
        string $reason = 'Signature verification failed',
        array $details = []
    ): string {
        return self::logThreat(
            type: 'PAYMENT_TAMPERING',
            severity: 'CRITICAL',
            message: "Tampered payment verification suspected for order #{$orderId}",
            request: $request,
            context: array_merge([
                'order_id' => $orderId,
                'reason' => $reason,
            ], $details)
        );
    }

    /**
     * Parse entries from security.log for Admin UI
     */
    public static function getLogEntries(
        int $limit = 50,
        ?string $severity = null,
        ?string $type = null,
        ?string $search = null,
        int $page = 1
    ): array {
        self::ensureLogFileExists();
        $path = self::getLogPath();

        if (!File::exists($path) || File::size($path) === 0) {
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => $limit,
            ];
        }

        // Read file lines in reverse order (newest first)
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) {
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => $limit,
            ];
        }

        $lines = array_reverse($lines);
        $parsedEntries = [];

        foreach ($lines as $line) {
            // Check for JSON payload at end of line
            $jsonStart = strpos($line, ' {"');
            if ($jsonStart !== false) {
                $jsonStr = substr($line, $jsonStart + 1);
                $data = json_decode($jsonStr, true);
                if (is_array($data) && isset($data['incident_id'])) {
                    // Filter by Severity
                    if ($severity && strtoupper($severity) !== 'ALL' && ($data['severity'] ?? '') !== strtoupper($severity)) {
                        continue;
                    }

                    // Filter by Type
                    if ($type && strtoupper($type) !== 'ALL' && ($data['threat_type'] ?? '') !== strtoupper($type)) {
                        continue;
                    }

                    // Search by keyword in IP, URL, or message
                    if ($search) {
                        $searchLower = strtolower(trim($search));
                        $match = str_contains(strtolower($data['ip'] ?? ''), $searchLower)
                            || str_contains(strtolower($data['url'] ?? ''), $searchLower)
                            || str_contains(strtolower($data['message'] ?? ''), $searchLower)
                            || str_contains(strtolower($data['incident_id'] ?? ''), $searchLower)
                            || str_contains(strtolower(json_encode($data['context'] ?? [])), $searchLower);

                        if (!$match) {
                            continue;
                        }
                    }

                    $parsedEntries[] = $data;
                }
            }
        }

        $total = count($parsedEntries);
        $offset = ($page - 1) * $limit;
        $paginated = array_slice($parsedEntries, $offset, $limit);
        $lastPage = max(1, (int) ceil($total / $limit));

        return [
            'data' => $paginated,
            'current_page' => $page,
            'last_page' => $lastPage,
            'total' => $total,
            'per_page' => $limit,
        ];
    }

    /**
     * Compute summary statistics from security.log
     */
    public static function getStats(): array
    {
        self::ensureLogFileExists();
        $path = self::getLogPath();

        $stats = [
            'total_incidents' => 0,
            'critical_threats' => 0,
            'high_threats' => 0,
            'warning_threats' => 0,
            'system_errors' => 0,
            'threat_types' => [],
            'top_ips' => [],
            'file_size_bytes' => 0,
            'file_size_formatted' => '0 KB',
            'last_incident_at' => null,
        ];

        if (!File::exists($path)) {
            return $stats;
        }

        $fileSize = File::size($path);
        $stats['file_size_bytes'] = $fileSize;
        $stats['file_size_formatted'] = self::formatBytes($fileSize);

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) {
            return $stats;
        }

        $ipCounts = [];
        $typeCounts = [];

        foreach ($lines as $line) {
            $jsonStart = strpos($line, ' {"');
            if ($jsonStart !== false) {
                $jsonStr = substr($line, $jsonStart + 1);
                $data = json_decode($jsonStr, true);
                if (is_array($data)) {
                    $stats['total_incidents']++;

                    $sev = strtoupper($data['severity'] ?? 'INFO');
                    if ($sev === 'CRITICAL') $stats['critical_threats']++;
                    elseif ($sev === 'HIGH') $stats['high_threats']++;
                    elseif ($sev === 'WARNING') $stats['warning_threats']++;
                    elseif ($sev === 'ERROR') $stats['system_errors']++;

                    $threatType = $data['threat_type'] ?? 'UNKNOWN';
                    $typeCounts[$threatType] = ($typeCounts[$threatType] ?? 0) + 1;

                    $ip = $data['ip'] ?? 'Unknown';
                    if ($ip !== 'CLI' && $ip !== 'SYSTEM') {
                        $ipCounts[$ip] = ($ipCounts[$ip] ?? 0) + 1;
                    }

                    $stats['last_incident_at'] = $data['timestamp'] ?? $stats['last_incident_at'];
                }
            }
        }

        arsort($ipCounts);
        arsort($typeCounts);

        $stats['threat_types'] = $typeCounts;
        $stats['top_ips'] = array_slice($ipCounts, 0, 5, true);

        return $stats;
    }

    /**
     * Delete a specific security threat incident by ID from security.log
     */
    public static function deleteIncident(string $incidentId): bool
    {
        self::ensureLogFileExists();
        $path = self::getLogPath();

        if (!File::exists($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) {
            return false;
        }

        $targetSnippet = '"incident_id":"' . trim($incidentId) . '"';
        $filteredLines = [];
        $found = false;

        foreach ($lines as $line) {
            if (str_contains($line, $targetSnippet)) {
                $found = true;
                continue; // Skip this line to delete it
            }
            $filteredLines[] = $line;
        }

        if ($found) {
            $newContent = empty($filteredLines) ? "" : implode("\n", $filteredLines) . "\n";
            File::put($path, $newContent);
            return true;
        }

        return false;
    }

    /**
     * Clear / reset log file
     */
    public static function clearLogs(): bool
    {
        self::ensureLogFileExists();
        $path = self::getLogPath();
        try {
            File::put($path, "");
            self::logThreat(
                type: 'LOG_PURGED',
                severity: 'INFO',
                message: 'Security log file was archived and cleared by Administrator',
                request: request()
            );
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Sanitize sensitive keys to prevent logging passwords or payment tokens
     */
    protected static function sanitizeContext(array $context): array
    {
        $sensitiveKeys = ['password', 'password_confirmation', 'token', 'secret', 'api_secret', 'pin', 'card_number', 'cvv'];

        array_walk_recursive($context, function (&$value, $key) use ($sensitiveKeys) {
            if (in_array(strtolower((string)$key), $sensitiveKeys)) {
                $value = '***REDACTED***';
            } elseif (is_string($value) && strlen($value) > 1000) {
                $value = substr($value, 0, 1000) . '... [TRUNCATED]';
            }
        });

        return $context;
    }

    /**
     * Format bytes into human readable units
     */
    protected static function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' B';
    }
}
