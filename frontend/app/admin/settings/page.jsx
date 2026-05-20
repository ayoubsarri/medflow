"use client";

/**
 * =============================================================================
 * SYSTEM SETTINGS PAGE — frontend/app/admin/settings/page.jsx
 * =============================================================================
 *
 * PURPOSE:
 * Loads real clinic settings from the database and allows the admin to
 * update working hours and trigger manual backups.
 *
 * WHAT CHANGED FROM MOCK VERSION:
 *   BEFORE: handleSave and handleBackupNow only called showToast()
 *   AFTER:  Real API calls:
 *     - Page load  → GET /api/admin/settings (fetches settings + dynamic health)
 *     - Save       → PUT /api/admin/settings  (updates workingHours in DB)
 *     - Backup Now → POST /api/admin/settings/backup (logs backup + updates lastBackup)
 *
 * DYNAMIC HEALTH DATA:
 * The backend calculates databaseStatus, apiStatus, and systemUptime in real-time.
 * These values update on every page load/refresh.
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { Save, Database, RefreshCw } from "lucide-react";
import { API_ADMIN } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

export default function SystemSettings() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [settings, setSettings]       = useState(null);
  const [workingHours, setWorkingHours] = useState("8:00 AM - 6:00 PM");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [backingUp, setBackingUp]     = useState(false);
  const [toasts, setToasts]           = useState([]);

  // ─── Toast Helper ───────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ─── Load Settings on Mount ──────────────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // On first load, we fetch the settings document from the backend.
  // The backend either returns the existing singleton document or creates one
  // with defaults (upsert). The `health` property is added dynamically by
  // the controller (not stored in the DB) — it reflects real-time server state.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res  = await apiFetch(`${API_ADMIN}/settings`);
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setSettings(data);
        setWorkingHours(data.workingHours || "8:00 AM - 6:00 PM");
      } catch (err) {
        console.error("[Settings] Failed to load:", err);
        showToast("Could not load settings. Is the server running?", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ─── Save Working Hours ──────────────────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // We use `PUT` (full update) here, but only send the `workingHours` field.
  // The controller on the backend uses whitelist-based updating — it only
  // updates `workingHours` regardless of what else is in `req.body`.
  const handleSave = async () => {
    try {
      setSaving(true);
      const res  = await apiFetch(`${API_ADMIN}/settings`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ workingHours })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Save failed");
      }
      showToast("✅ Working hours updated successfully");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Trigger Backup ──────────────────────────────────────────────────────────
  // STUDENT DEFENSE NOTE:
  // This calls the backup endpoint which:
  //   1. Updates `lastBackup` timestamp in the DB.
  //   2. Writes an audit log entry automatically.
  //   3. Returns the formatted backup time.
  // In a production system, this would also trigger a real DB backup job.
  const handleBackupNow = async () => {
    try {
      setBackingUp(true);
      const res  = await apiFetch(`${API_ADMIN}/settings/backup`, { method: "POST" });
      if (!res.ok) throw new Error("Backup trigger failed");
      const data = await res.json();

      // Update lastBackup in local settings state so the UI reflects the new time.
      setSettings(prev => ({ ...prev, lastBackup: new Date().toISOString() }));

      showToast(`✅ Backup initiated — ${data.lastBackup}`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBackingUp(false);
    }
  };

  // ─── Format Date ────────────────────────────────────────────────────────────
  const formatDate = (isoString) => {
    if (!isoString) return "Never";
    return new Date(isoString).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  // ─── Health Status Badge ─────────────────────────────────────────────────────
  const HealthBadge = ({ value }) => {
    const isGood = value === "Connected" || value === "Operational";
    return (
      <p className={`text-sm font-medium flex items-center gap-2 ${isGood ? "text-emerald-600" : "text-red-600"}`}>
        <span className={`w-2 h-2 rounded-full ${isGood ? "bg-emerald-500" : "bg-red-500"}`} />
        {value}
      </p>
    );
  };

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 h-64 animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 h-48 animate-pulse" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">System Settings</h1>

      {/* Clinic Information — Only working hours is editable */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Clinic Information</h3>
        <div className="space-y-4 max-w-md">

          {/* Clinic Name — Read Only */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Clinic Name</label>
            <p className="px-3 py-2 bg-muted rounded-lg text-foreground">
              {settings?.clinicName || "MedFlow Clinic"}
            </p>
          </div>

          {/* Address — Read Only */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address</label>
            <p className="px-3 py-2 bg-muted rounded-lg text-foreground">
              {settings?.address || "123 Medical Center Blvd, Algiers"}
            </p>
          </div>

          {/* Phone — Read Only */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
            <p className="px-3 py-2 bg-muted rounded-lg text-foreground">
              {settings?.phone || "+213 21 123 456"}
            </p>
          </div>

          {/* Working Hours — Editable */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Working Hours <span className="text-xs text-[#1d4ed8] ml-1">(editable)</span>
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="e.g. 8:00 AM - 6:00 PM"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            aria-label="Save changes"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg min-h-[44px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving…" : "Save Working Hours"}
          </button>
        </div>
      </div>

      {/* System Health — Real-time data from server */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Database</p>
            <HealthBadge value={settings?.health?.databaseStatus || "Unknown"} />
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">API Status</p>
            <HealthBadge value={settings?.health?.apiStatus || "Unknown"} />
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Email Service</p>
            <HealthBadge value={settings?.health?.emailService || "Unknown"} />
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Last Backup</p>
            <p className="text-sm font-medium text-foreground">
              {formatDate(settings?.lastBackup)}
            </p>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Server Uptime</p>
            <p className="text-sm font-medium text-foreground">
              {settings?.health?.systemUptime || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Backup Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Auto-backup Schedule</p>
              <p className="text-xs text-muted-foreground">
                {settings?.autoBackupSchedule || "Daily at 2:00 AM"}
              </p>
            </div>
          </div>

          <button
            onClick={handleBackupNow}
            disabled={backingUp}
            aria-label="Run backup now"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg min-h-[44px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${backingUp ? "animate-spin" : ""}`} />
            {backingUp ? "Running Backup…" : "Run Backup Now"}
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow text-white text-sm ${
              toast.type === "success" ? "bg-green-500"
              : toast.type === "error"   ? "bg-red-500"
              : toast.type === "warning" ? "bg-yellow-500"
              : "bg-[#1d4ed8]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
