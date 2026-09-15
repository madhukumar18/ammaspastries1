<?php

namespace App\Http\Middleware;

use App\Services\SecurityLoggerService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityFirewallMiddleware
{
    /**
     * Paths that automated vulnerability scanners frequently probe
     */
    protected array $probedPaths = [
        '.env',
        '.git',
        '.aws',
        '.ssh',
        'id_rsa',
        'wp-admin',
        'wp-login.php',
        'xmlrpc.php',
        'phpmyadmin',
        'pma',
        'actuator',
        'eval-stdin.php',
        'shell.php',
        'dump.sql',
        'backup.sql',
        '.htaccess',
        'web.config',
    ];

    /**
     * User-Agent fragments belonging to hacker scanners and exploit frameworks
     */
    protected array $maliciousUserAgents = [
        'sqlmap',
        'nikto',
        'acunetix',
        'wpscan',
        'dirbuster',
        'gobuster',
        'hydra',
        'nmap',
        'masscan',
        'burpcollaborator',
        'metasploit',
        'havij',
    ];

    /**
     * Handle an incoming request
     */
    public function handle(Request $request, Closure $next): Response
    {
        $path = strtolower($request->path());

        // 1. Check for Sensitive File & Vulnerability Scanning in URL
        foreach ($this->probedPaths as $probed) {
            if (str_contains($path, $probed)) {
                $incidentId = SecurityLoggerService::logThreat(
                    type: 'SENSITIVE_FILE_SCAN',
                    severity: 'CRITICAL',
                    message: "Malicious probe detected targeting restricted path: '{$probed}'",
                    request: $request,
                    context: ['probed_path' => $probed, 'requested_url' => $request->fullUrl()]
                );

                return response()->json([
                    'success' => false,
                    'error' => 'Access Denied by Security Firewall',
                    'incident_id' => $incidentId,
                    'status' => 403,
                ], 403);
            }
        }

        // 2. Check for Automated Exploit Scanners in User-Agent
        $userAgent = strtolower($request->header('User-Agent', ''));
        foreach ($this->maliciousUserAgents as $agentPattern) {
            if (str_contains($userAgent, $agentPattern)) {
                $incidentId = SecurityLoggerService::logThreat(
                    type: 'SUSPICIOUS_SCANNER',
                    severity: 'HIGH',
                    message: "Known vulnerability scanner tool detected in User-Agent: '{$agentPattern}'",
                    request: $request,
                    context: ['scanner' => $agentPattern, 'raw_agent' => $request->header('User-Agent')]
                );

                return response()->json([
                    'success' => false,
                    'error' => 'Automated Vulnerability Scanner Blocked',
                    'incident_id' => $incidentId,
                    'status' => 403,
                ], 403);
            }
        }

        // 3. Inspect Input Parameters & Payload for Attacks
        $inputs = array_merge(
            $request->query(),
            $request->post(),
            $request->route() ? $request->route()->parameters() : []
        );

        $threatFound = $this->inspectInputs($inputs, $request);
        if ($threatFound) {
            return response()->json([
                'success' => false,
                'error' => 'Security Threat Blocked: ' . $threatFound['description'],
                'incident_id' => $threatFound['incident_id'],
                'status' => 403,
            ], 403);
        }

        return $next($request);
    }

    /**
     * Recursively inspect input data for attack patterns
     */
    protected function inspectInputs(array $data, Request $request): ?array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $nested = $this->inspectInputs($value, $request);
                if ($nested) return $nested;
                continue;
            }

            if (!is_string($value)) {
                continue;
            }

            // A. SQL Injection (SQLi) Signatures
            $sqliPatterns = [
                '~\b(union\s+select|union\s+all\s+select)\b~i' => 'SQLi UNION SELECT clause',
                '~(\'|--|#|/\*).*?\b(or|and)\b.*?(=|<|>)~i' => 'SQLi Boolean Bypass statement',
                '~\b(information_schema|waitfor\s+delay|benchmark\s*\(|sleep\s*\(\s*\d+\s*\))~i' => 'SQLi Time-based/Schema probe',
                '~;\s*(drop|alter|truncate|delete\s+from)\b~i' => 'SQLi Destructive DDL command',
            ];

            foreach ($sqliPatterns as $pattern => $desc) {
                if (preg_match($pattern, $value)) {
                    $incidentId = SecurityLoggerService::logThreat(
                        type: 'SQL_INJECTION',
                        severity: 'CRITICAL',
                        message: "SQL Injection attack attempt detected in parameter '{$key}'",
                        request: $request,
                        context: [
                            'parameter' => $key,
                            'matched_pattern' => $desc,
                            'offending_value_snippet' => substr($value, 0, 150),
                        ]
                    );

                    return ['description' => 'SQL Injection Pattern Detected', 'incident_id' => $incidentId];
                }
            }

            // B. Cross-Site Scripting (XSS) Signatures
            $xssPatterns = [
                '~<\s*script\b[^>]*>~i' => 'XSS Script tag insertion',
                '~\bjavascript\s*:~i' => 'XSS JavaScript URI scheme',
                '~\bon(error|load|click|mouseover|submit)\s*=~i' => 'XSS Inline HTML event handler',
                '~<\s*(iframe|object|embed|svg\s*/onload)\b~i' => 'XSS Malicious frame or object tag',
            ];

            foreach ($xssPatterns as $pattern => $desc) {
                if (preg_match($pattern, $value)) {
                    $incidentId = SecurityLoggerService::logThreat(
                        type: 'XSS_ATTEMPT',
                        severity: 'HIGH',
                        message: "Cross-Site Scripting (XSS) attempt detected in parameter '{$key}'",
                        request: $request,
                        context: [
                            'parameter' => $key,
                            'matched_pattern' => $desc,
                            'offending_value_snippet' => substr($value, 0, 150),
                        ]
                    );

                    return ['description' => 'Malicious Script / XSS Detected', 'incident_id' => $incidentId];
                }
            }

            // C. Path Traversal & LFI Signatures
            $pathPatterns = [
                '~(\.\.[\\/]){2,}~' => 'Directory traversal sequence (../)',
                '~\b(etc/passwd|win\.ini|proc/self/environ|php://input|php://filter)\b~i' => 'System / wrapper file access',
            ];

            foreach ($pathPatterns as $pattern => $desc) {
                if (preg_match($pattern, $value)) {
                    $incidentId = SecurityLoggerService::logThreat(
                        type: 'PATH_TRAVERSAL',
                        severity: 'CRITICAL',
                        message: "Path traversal / Local File Inclusion attempt in parameter '{$key}'",
                        request: $request,
                        context: [
                            'parameter' => $key,
                            'matched_pattern' => $desc,
                            'offending_value_snippet' => substr($value, 0, 150),
                        ]
                    );

                    return ['description' => 'Path Traversal Attack Detected', 'incident_id' => $incidentId];
                }
            }
        }

        return null;
    }
}
