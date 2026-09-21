import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Lock,
  FileText,
  Download,
  RefreshCw,
  Trash2,
  Search,
  Eye,
  X,
  Copy,
  Check,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../services/api';

const AdminSecurityLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [stats, setStats] = useState({
    total_incidents: 0,
    critical_threats: 0,
    high_threats: 0,
    warning_threats: 0,
    system_errors: 0,
    file_size_formatted: '0 KB',
    threat_types: {},
    top_ips: {},
  });

  // Filter & Search states
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Incident for Details & Deep Inspection
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Actions state
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const inspectionRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/security-logs/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load security stats:', err);
    }
  };

  // Fetch Logs
  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 25,
        severity: severityFilter || undefined,
        threat_type: typeFilter || undefined,
        search: searchQuery || undefined,
      };

      const res = await api.get('/admin/security-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data.data || []);
        setPagination({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          total: res.data.data.total,
        });
      }
    } catch (err) {
      console.error('Failed to load security logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs(1);
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [severityFilter, typeFilter]);

  // Trigger Simulation Test
  const handleTestAlert = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/admin/security-logs/test-alert');
      if (res.data?.success) {
        showToast(res.data.message, 'success');
        fetchStats();
        fetchLogs(1);
      }
    } catch (err) {
      showToast('Failed to trigger test security alert', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear and archive the current security.log file?')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/admin/security-logs/clear');
      if (res.data?.success) {
        showToast('Security log file cleared successfully.', 'success');
        setSelectedIncident(null);
        fetchStats();
        fetchLogs(1);
      }
    } catch (err) {
      showToast('Failed to clear security log file', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Individual Security Threat Incident
  const handleDeleteIncident = async (incidentId) => {
    if (!incidentId) return;
    if (!window.confirm(`Are you sure you want to permanently delete security threat ${incidentId} from the audit logs?`)) {
      return;
    }

    try {
      setDeletingId(incidentId);
      const res = await api.delete(`/admin/security-logs/${encodeURIComponent(incidentId)}`);
      if (res.data?.success) {
        showToast(res.data.message || `Security threat ${incidentId} deleted successfully.`, 'success');
        if (selectedIncident?.incident_id === incidentId) {
          setSelectedIncident(null);
        }
        await fetchStats();
        await fetchLogs(pagination.current_page);
      } else {
        showToast(res.data?.message || 'Failed to delete security threat.', 'error');
      }
    } catch (err) {
      console.error('Failed to delete incident:', err);
      showToast(err.response?.data?.message || 'Failed to delete security threat.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Inspect Incident and smoothly scroll to the dedicated inspection console
  const handleInspectIncident = (incident) => {
    setSelectedIncident(incident);
    setTimeout(() => {
      inspectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Download raw security.log
  const handleDownload = () => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const downloadUrl = `${baseUrl}/admin/security-logs/download`;

    // Fetch as blob with Authorization header
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/octet-stream',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ammas-pastries-security-${new Date().toISOString().slice(0, 10)}.log`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Security log downloaded successfully!', 'success');
      })
      .catch(() => {
        showToast('Failed to download log file. Ensure you are logged in.', 'error');
      });
  };

  // Severity color badge helper
  const getSeverityBadge = (severity) => {
    const s = (severity || 'INFO').toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            HIGH
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Lock className="w-3 h-3 text-amber-600" />
            WARNING
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Info className="w-3 h-3" />
            {s}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-cream-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-chocolate">
                Security & Threat Audit Logs
              </h1>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Firewall Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active threat detection & error logging targeting <code className="font-mono bg-cream-100 px-1 py-0.5 rounded text-chocolate">storage/logs/security.log</code>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Test Alert Button */}
          <button
            onClick={handleTestAlert}
            disabled={actionLoading}
            className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Simulate a security event to test firewall logging"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Security Alert</span>
          </button>

          {/* Download Log File */}
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Download the raw security.log file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download security.log</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            disabled={actionLoading}
            className="p-2 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Clear and reset security.log file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Incidents */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cream-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Logged</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-chocolate mt-1">
            {stats.total_incidents}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total recorded incidents</div>
        </div>

        {/* Critical & High Threats Blocked */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs">
          <div className="text-rose-700 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Threats Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1">
            {stats.critical_threats + stats.high_threats}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1">
            {stats.critical_threats} Critical • {stats.high_threats} High
          </div>
        </div>

        {/* Auth Brute Force Attempts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs">
          <div className="text-amber-700 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Auth / Brute Force</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
            {stats.warning_threats}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">Failed logins & probes</div>
        </div>

        {/* System Errors & Exceptions */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs">
          <div className="text-blue-700 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>System Errors</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
            {stats.system_errors}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Captured 500 exceptions</div>
        </div>

        {/* Log File Size */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cream-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-chocolate text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Log File Size</span>
            <FileText className="w-4 h-4 text-bakery-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-chocolate mt-1">
            {stats.file_size_formatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">security.log on disk</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED SECTION: THREAT INSPECTION & REMEDIATION CONSOLE */}
      {/* ========================================================================= */}
      <div
        ref={inspectionRef}
        id="threat-inspection-console"
        className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl overflow-hidden scroll-mt-6"
      >
        {/* Console Header Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono tracking-wider uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/30">
                  Forensic Console
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Security Threat Inspection & Remediation
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect raw attack vectors, origin fingerprints, and permanently delete threats from security.log.
              </p>
            </div>
          </div>

          {selectedIncident ? (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleDeleteIncident(selectedIncident.incident_id)}
                disabled={deletingId === selectedIncident.incident_id}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                title="Permanently delete this security threat from logs"
              >
                {deletingId === selectedIncident.incident_id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Security Threat</span>
              </button>

              <button
                onClick={() => setSelectedIncident(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close inspection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            logs.length > 0 && (
              <button
                onClick={() => handleInspectIncident(logs[0])}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
              >
                <Eye className="w-3.5 h-3.5 text-bakery-400" />
                <span>Inspect Latest Threat</span>
              </button>
            )
          )}
        </div>

        {/* Console Content */}
        {selectedIncident ? (
          <div className="p-5 sm:p-6 space-y-6 animate-in fade-in duration-300">
            {/* Top Threat Overview Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="shrink-0 pt-0.5 sm:pt-0">
                  {getSeverityBadge(selectedIncident.severity)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-amber-300">
                      {selectedIncident.incident_id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedIncident.incident_id, 'top-id')}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      title="Copy Incident ID"
                    >
                      {copiedKey === 'top-id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-300 font-mono">
                      {selectedIncident.timestamp}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-rose-200 mt-1">
                    {selectedIncident.message}
                  </div>
                </div>
              </div>

              {/* Quick Delete CTA in Banner */}
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
                  Status: <strong className="text-emerald-400">Blocked (HTTP 403)</strong>
                </span>
                <button
                  onClick={() => handleDeleteIncident(selectedIncident.incident_id)}
                  disabled={deletingId === selectedIncident.incident_id}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {deletingId === selectedIncident.incident_id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>Delete Threat</span>
                </button>
              </div>
            </div>

            {/* 4 Forensic Detail Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Card 1: Threat Type */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                <span className="text-slate-400 text-[10px] font-sans font-bold uppercase tracking-wider block">
                  Threat Classification
                </span>
                <div className="text-amber-400 font-bold text-sm break-words">
                  {selectedIncident.threat_type}
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Firewall rule matched & trigger recorded
                </div>
              </div>

              {/* Card 2: Attacker IP */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] font-sans font-bold uppercase tracking-wider">
                    Source IP Address
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedIncident.ip, 'ip')}
                    className="text-slate-400 hover:text-white p-0.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Copy IP"
                  >
                    {copiedKey === 'ip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-rose-400 font-bold text-sm">
                  {selectedIncident.ip}
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  {selectedIncident.ip === '127.0.0.1' || selectedIncident.ip === '::1'
                    ? 'Localhost loopback origin'
                    : 'External network origin'}
                </div>
              </div>

              {/* Card 3: Target Endpoint */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                <span className="text-slate-400 text-[10px] font-sans font-bold uppercase tracking-wider block">
                  Target Endpoint & Method
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold text-[10px]">
                    {selectedIncident.method}
                  </span>
                  <span className="text-cyan-300 font-bold text-xs truncate" title={selectedIncident.url}>
                    {selectedIncident.url}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Targeted route intercept
                </div>
              </div>

              {/* Card 4: Action & Status */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5">
                <span className="text-slate-400 text-[10px] font-sans font-bold uppercase tracking-wider block">
                  Firewall Action
                </span>
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Request Blocked (403)</span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Incident logged to security.log
                </div>
              </div>
            </div>

            {/* User Agent Banner */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-sans font-bold block mb-1">
                Client User-Agent Signature:
              </span>
              <span className="text-slate-300 break-all">{selectedIncident.user_agent}</span>
            </div>

            {/* Offending Payload & Request Context */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Attack Vector Payload & Request Context
                  </span>
                </div>
                {selectedIncident.context && Object.keys(selectedIncident.context).length > 0 && (
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(selectedIncident.context, null, 2),
                        'section-context'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer font-sans"
                  >
                    {copiedKey === 'section-context' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Payload JSON</span>
                  </button>
                )}
              </div>

              {selectedIncident.context && Object.keys(selectedIncident.context).length > 0 ? (
                <div className="relative">
                  <pre className="p-4 bg-black rounded-2xl overflow-x-auto border border-slate-800 text-xs font-mono text-amber-300 leading-relaxed max-h-72">
                    {JSON.stringify(selectedIncident.context, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 italic">
                  No additional parameter context was logged for this attack event.
                </div>
              )}
            </div>

            {/* Threat Remediation & Deletion Console Bar */}
            <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Threat Remediation & Deletion</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Permanently erase this security incident (<code className="font-mono text-slate-300">{selectedIncident.incident_id}</code>) from the server's <code className="font-mono text-slate-300">security.log</code> file.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDeleteIncident(selectedIncident.incident_id)}
                  disabled={deletingId === selectedIncident.incident_id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {deletingId === selectedIncident.incident_id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Delete Security Threat</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: No incident selected */
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-white">
                Threat Inspection Ready
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select any incident from the audit log below to inspect forensic headers, attack payloads, offending parameters, and permanently delete the threat record.
              </p>
            </div>
            {logs.length > 0 && (
              <div>
                <button
                  onClick={() => handleInspectIncident(logs[0])}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Latest Threat ({logs[0].incident_id})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Incident Feed Card */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden space-y-4">
        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-cream-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-cream-50/50">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
                placeholder="Search by IP, URL, Incident ID, or attack snippet..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-500"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs sm:text-sm py-2 px-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-500 font-medium"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">System Error</option>
              <option value="INFO">Info</option>
            </select>

            {/* Threat Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs sm:text-sm py-2 px-3 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bakery-500 font-medium"
            >
              <option value="">All Threat Types</option>
              <option value="SQL_INJECTION">SQL Injection</option>
              <option value="XSS_ATTEMPT">XSS Script Injection</option>
              <option value="PATH_TRAVERSAL">Path Traversal (../)</option>
              <option value="SENSITIVE_FILE_SCAN">Sensitive File Probe</option>
              <option value="SUSPICIOUS_SCANNER">Automated Scanner</option>
              <option value="AUTH_BRUTE_FORCE">Auth Brute Force</option>
              <option value="ADMIN_LOGIN_FAILURE">Admin Login Failure</option>
              <option value="ADMIN_UNAUTHORIZED_ACCESS">Unauthorized Admin Access</option>
              <option value="PAYMENT_TAMPERING">Payment Tampering</option>
              <option value="SYSTEM_ERROR">Unhandled Error</option>
            </select>
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchLogs(pagination.current_page);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-bakery-700 bg-cream-100 hover:bg-cream-200 px-3 py-2 rounded-xl transition-colors font-semibold self-end md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Security Incident Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp & ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Threat Type & Description</th>
                <th className="py-3 px-4">Target Endpoint</th>
                <th className="py-3 px-4">Source IP & Agent</th>
                <th className="py-3 px-4 text-right">Actions & Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    Reading security.log audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">No Security Incidents Found</div>
                    <p className="text-xs text-slate-400 mt-1">
                      No hacking attempts or errors match your filter criteria. Your application firewall is defending all routes.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((incident) => (
                  <tr key={incident.incident_id} className="hover:bg-cream-50/40 transition-colors">
                    {/* Timestamp & ID */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-chocolate text-xs">{incident.incident_id}</div>
                      <div className="text-[11px] text-slate-400">{incident.timestamp}</div>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3.5 px-4">
                      {getSeverityBadge(incident.severity)}
                    </td>

                    {/* Threat Type & Message */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 font-mono text-xs">
                        {incident.threat_type}
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-1 max-w-xs sm:max-w-md">
                        {incident.message}
                      </div>
                    </td>

                    {/* Endpoint & Method */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700 text-[10px] mr-1.5 uppercase">
                        {incident.method}
                      </span>
                      <span className="text-slate-600 break-all">{incident.url}</span>
                    </td>

                    {/* Source IP */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="font-bold text-chocolate">{incident.ip}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={incident.user_agent}>
                        {incident.user_agent}
                      </div>
                    </td>

                    {/* Action Buttons: Inspect & Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspectIncident(incident)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            selectedIncident?.incident_id === incident.incident_id
                              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300'
                              : 'border-cream-300 bg-white hover:bg-cream-100 text-chocolate'
                          }`}
                          title="Inspect full security context & payload in console"
                        >
                          <Eye className={`w-3.5 h-3.5 ${selectedIncident?.incident_id === incident.incident_id ? 'text-white' : 'text-bakery-600'}`} />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => handleDeleteIncident(incident.incident_id)}
                          disabled={deletingId === incident.incident_id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete this security threat from the log"
                        >
                          {deletingId === incident.incident_id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="p-4 border-t border-cream-100 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500">
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} incidents recorded)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => fetchLogs(pagination.current_page - 1)}
                className="p-1.5 rounded-lg border border-cream-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchLogs(pagination.current_page + 1)}
                className="p-1.5 rounded-lg border border-cream-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INCIDENT DETAILS MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base font-mono">
                      {selectedIncident.incident_id}
                    </h3>
                    {getSeverityBadge(selectedIncident.severity)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedIncident.timestamp} • Threat: <strong className="text-white">{selectedIncident.threat_type}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono bg-slate-950 text-slate-300">
              {/* Incident Summary */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">
                  Threat Description:
                </div>
                <div className="text-rose-300 font-bold text-sm font-sans">
                  {selectedIncident.message}
                </div>
              </div>

              {/* Source & Request Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-sans">
                    Attacker IP:
                  </span>
                  <span className="text-amber-400 font-bold text-sm">{selectedIncident.ip}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-sans">
                    HTTP Method:
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">{selectedIncident.method}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-sans">
                    Target URL:
                  </span>
                  <span className="text-cyan-300 break-all">{selectedIncident.url}</span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-sans">
                    User-Agent:
                  </span>
                  <span className="text-slate-400 break-all text-[11px]">{selectedIncident.user_agent}</span>
                </div>
              </div>

              {/* Detailed Context / Matched Signatures */}
              {selectedIncident.context && Object.keys(selectedIncident.context).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">
                      Attack Vector & Offending Parameters:
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedIncident.context, null, 2),
                          'context'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-sans text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'context' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Payload</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black rounded-xl overflow-x-auto border border-slate-800 text-[11px] text-amber-300 leading-relaxed">
                    {JSON.stringify(selectedIncident.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-500 font-mono">
                Incident Ref: <strong>{selectedIncident.incident_id}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteIncident(selectedIncident.incident_id)}
                  disabled={deletingId === selectedIncident.incident_id}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {deletingId === selectedIncident.incident_id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Threat</span>
                </button>

                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurityLogsPage;
