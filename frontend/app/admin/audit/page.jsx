"use client";

/**
 * =============================================================================
 * AUDIT LOGS PAGE — frontend/app/admin/audit/page.jsx
 * =============================================================================
 *
 * PURPOSE:
 * Displays a searchable, filterable list of all system actions logged by
 * the backend's auditLogger utility. All data is real — no hardcoded arrays.
 *
 * WHAT CHANGED FROM MOCK VERSION:
 *   BEFORE: const auditLogs = [ { id: 1, ... }, { id: 2, ... } ] (static)
 *   AFTER:  useEffect fetches from GET /api/admin/audit-logs in real-time.
 *
 * FEATURES:
 *   - Live search that queries the backend (not just client-side filter)
 *   - Role filter dropdown (All / Admin / Doctor / Receptionist)
 *   - Loading and empty states
 *   - Auto-refresh every 30 seconds for a near-real-time feel
 *
 * API ENDPOINT: GET ${API_ADMIN}/audit-logs
 *   Supports: ?search=&role=&page=&limit=
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { API_ADMIN } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

export default function AuditLogs() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // ─── Fetch Logs from Backend ────────────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // `useCallback` memoizes this function so it doesn't get recreated on every
  // render. This is important because we pass `fetchLogs` to a dependency array
  // in `useEffect`. Without `useCallback`, adding it to the dependency array
  // would cause an infinite re-render loop.
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);

      // Build the query string dynamically from the current filter state.
      // URLSearchParams handles URL encoding (spaces → %20, etc.) automatically.
      const params = new URLSearchParams();
      if (search.trim())       params.set("search", search.trim());
      if (roleFilter !== "All") params.set("role", roleFilter);
      params.set("limit", "100"); // Show up to 100 logs per page

      const res  = await apiFetch(`${API_ADMIN}/audit-logs?${params.toString()}`);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      // The backend returns { logs: [...], pagination: {...} }
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      console.error("[AuditLogs] Failed to fetch:", err);
      setError("Could not load audit logs. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]); // Re-run when search or roleFilter changes

  // Run fetchLogs on mount AND whenever search/roleFilter changes.
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ─── Auto-Refresh (every 30 seconds) ────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // `setInterval` calls a function repeatedly at a given interval (in ms).
  // We store the interval ID in a variable so we can `clearInterval` it in the
  // cleanup function. The cleanup runs when the component is removed from the
  // screen (unmounted), preventing memory leaks.
  useEffect(() => {
    const intervalId = setInterval(fetchLogs, 30000); // 30,000ms = 30 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchLogs]);

  // ─── Role Badge Colors ───────────────────────────────────────────────────────
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Admin":        return "bg-purple-100 text-purple-800";
      case "Doctor":       return "bg-blue-100 text-blue-800";
      case "Receptionist": return "bg-emerald-100 text-emerald-800";
      case "System":       return "bg-gray-100 text-gray-800";
      default:             return "bg-gray-100 text-gray-800";
    }
  };

  // ─── Format Timestamp ────────────────────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // MongoDB stores dates as ISO strings (e.g., "2026-04-04T09:15:00.000Z").
  // `toLocaleString` converts it to a human-readable local time format.
  const formatTimestamp = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        {/* Manual refresh button */}
        <button
          onClick={fetchLogs}
          disabled={loading}
          aria-label="Refresh audit logs"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Text Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by user or action..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        {/* Role Filter Dropdown */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Doctor">Doctor</option>
          <option value="Receptionist">Receptionist</option>
          <option value="System">System</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Timestamp</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Action</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Loading skeleton rows */}
              {loading && logs.length === 0 && (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse w-48" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse w-24" /></td>
                  </tr>
                ))
              )}

              {/* Actual data rows */}
              {!loading && logs.map((log) => (
                <tr key={log._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {formatTimestamp(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(log.role)}`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{log.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty / Error States */}
        {!loading && error && (
          <div className="p-8 text-center text-red-600">{error}</div>
        )}
        {!loading && !error && logs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {search || roleFilter !== "All"
              ? "No logs found matching your search."
              : "No audit logs recorded yet. Actions will appear here automatically."}
          </div>
        )}
      </div>
    </div>
  );
}
