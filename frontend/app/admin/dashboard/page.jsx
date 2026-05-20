"use client";

/**
 * =============================================================================
 * ADMIN DASHBOARD PAGE — frontend/app/admin/dashboard/page.jsx
 * =============================================================================
 *
 * PURPOSE:
 * Main dashboard for the MedFlow admin. All data is now fetched from the real
 * backend API (/api/admin/stats) instead of hardcoded mock values.
 *
 * KEY REACT CONCEPTS USED:
 *   - useState: holds the fetched data and loading/error states.
 *   - useEffect: runs the API call once when the page first mounts.
 *   - Conditional rendering: shows a skeleton loader while data loads.
 *
 * API ENDPOINT: GET ${API_ADMIN}/stats
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { Users, Calendar, UserCheck, TrendingDown, Server } from "lucide-react";
import { API_ADMIN } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

/**
 * Get today's date formatted nicely (unchanged helper function).
 */
function getTodayDate() {
  const today = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return today.toLocaleDateString("en-US", options);
}

export default function AdminDashboard() {
  // ─── State ─────────────────────────────────────────────────────────────────
  // `stats` holds everything returned by GET /api/admin/stats.
  // Initialized with safe default values so the page never crashes during load.
  const [stats, setStats] = useState({
    totalPatients:     0,
    totalAppointments: 0,
    activeStaff:       0,
    noShowRate:        "0%",
    systemUptime:      "...",
    monthlyActivity:   [],
    staffWorkload:     []
  });

  // `loading` controls whether we show the skeleton/spinner.
  const [loading, setLoading] = useState(true);

  // `error` holds any fetch error message.
  const [error, setError] = useState(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // `useEffect` with an empty dependency array `[]` runs exactly ONCE:
  // right after the component first renders on screen. This is the standard
  // React pattern for "fetch data when the page loads."
  //
  // We define the async function INSIDE useEffect because useEffect's callback
  // itself cannot be async — we work around this by defining and immediately
  // calling the async function inside it.
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API_ADMIN}/stats`);

        // If the server returned an error status (e.g., 500), throw so we catch below.
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("[Dashboard] Failed to fetch stats:", err);
        setError("Could not load dashboard data. Is the server running?");
      } finally {
        // `finally` ALWAYS runs whether or not an error occurred.
        // We use it to turn off the loading spinner.
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty array = run once on mount only

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded w-48 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-sm h-20 animate-pulse" />
          ))}
        </div>
        <div className="bg-card border border-border rounded-lg p-6 h-48 animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 h-48 animate-pulse" />
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, Admin</h1>
          <p className="text-muted-foreground">{getTodayDate()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-[#1d4ed8] text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, Admin</h1>
        <p className="text-muted-foreground">{getTodayDate()}</p>
      </div>

      {/* Summary Cards — data from real DB counts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Total Patients */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-[#1d4ed8]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalPatients.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalAppointments.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Staff</p>
              <p className="text-xl font-bold text-foreground">{stats.activeStaff}</p>
            </div>
          </div>
        </div>

        {/* No Show Rate — calculated server-side from real appointment statuses */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No Show Rate</p>
              <p className="text-xl font-bold text-foreground">{stats.noShowRate}</p>
            </div>
          </div>
        </div>

        {/* System Uptime — from process.uptime() on the server */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Server className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Server Uptime</p>
              <p className="text-xl font-bold text-foreground">{stats.systemUptime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Activity Summary — aggregated from the Appointment collection */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Monthly Activity Summary</h3>
        {stats.monthlyActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No appointment data yet. Add appointments to see monthly trends.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Appointments</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">New Patients</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">No-Shows</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.monthlyActivity.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">
                      {item.month} {item.year}
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">{item.appointments}</td>
                    <td className="py-3 px-4 text-right text-foreground">{item.newPatients}</td>
                    <td className="py-3 px-4 text-right text-red-600">{item.noShows}</td>
                    <td className="py-3 px-4">
                      <div className="h-2 bg-muted rounded-full w-24">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min((item.appointments / 500) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Workload — real data from Staff collection workload fields */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Staff Workload (This Month)</h3>
        {stats.staffWorkload.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No active staff found. Add staff members to see workload data.
          </p>
        ) : (
          <div className="grid gap-4">
            {stats.staffWorkload.map((staff, idx) => (
              <div
                key={staff._id || idx}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar — initials from first letter of each name word */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1d4ed8] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {staff.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{staff.name}</p>
                    <p className="text-sm text-muted-foreground">{staff.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  {staff.consultations > 0 && (
                    <p className="text-sm text-foreground">
                      <span className="font-bold text-[#1d4ed8]">{staff.consultations}</span> consultations
                    </p>
                  )}
                  {staff.appointmentsManaged > 0 && (
                    <p className="text-sm text-foreground">
                      <span className="font-bold text-emerald-600">{staff.appointmentsManaged}</span> appointments managed
                    </p>
                  )}
                  {staff.tasksCompleted > 0 && (
                    <p className="text-sm text-foreground">
                      <span className="font-bold text-purple-600">{staff.tasksCompleted}</span> tasks completed
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{staff.hoursWorked} hrs worked</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
