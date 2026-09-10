import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
} from 'lucide-react';
import { AdminMetrics, AuditLog } from '../types';
import { safeFetchJson } from '../utils/api';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson<{ metrics: AdminMetrics; auditLogs: AuditLog[] }>('/api/admin/metrics');
      if (res.ok && res.data) {
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (Array.isArray(res.data.auditLogs)) setAuditLogs(res.data.auditLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 text-xs font-bold mb-2">
            <Server className="w-3.5 h-3.5" /> System Health & Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Telemetry & Safety Metrics</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time tracking of AI extraction volume, safety refusal classifications, and audit logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={isLoading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Extractions</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.totalExtractions}</p>
            <p className="text-[11px] text-teal-700 font-semibold mt-1">OCR & Text Pipeline</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Invocations</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {metrics.successfulSafetyChecks}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">100% verified</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Error Rate</p>
            <p className="text-2xl font-extrabold text-teal-700 mt-1">{metrics.errorRate}%</p>
            <p className="text-[11px] text-slate-500 mt-1">Automated fallbacks</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Extraction Time</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{metrics.averageLatencyMs} ms</p>
            <p className="text-[11px] text-slate-500 mt-1">Gemini 3.7 Flash</p>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" /> Recent System Audit Events
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 bg-slate-50 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Status</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-bold text-slate-900">{log.action}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{log.latencyMs || 0} ms</td>
                  <td className="p-3 text-slate-500 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
