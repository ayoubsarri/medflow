"use client";

/**
 * =============================================================================
 * RECEPTIONIST NEW REQUESTS PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * Independent page for managing new appointment requests from patients.
 * Features: Confirm, Failed Attempt buttons. Failed attempts stay at bottom.
 * Deleted requests are removed completely.
 * Confirmed requests move to appointments list.
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { Search, CheckCircle, Phone, X, AlertTriangle, Clock } from "lucide-react";

import { API_RECEPTIONIST } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

// Format date with weekday
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await apiFetch(`${API_RECEPTIONIST}/appointments?status=Pending`);
        const data = await res.json();
        if (data.success) {
          setRequests((data.data || []).map(apt => ({
            id: apt._id,
            patient: (apt.patient?.firstName || "Unknown") + " " + (apt.patient?.lastName || ""),
            phone: apt.patient?.phone || "N/A",
            requestedDate: apt.date?.split("T")[0] || "",
            requestedTime: apt.date?.split("T")[1]?.substring(0, 5) || "",
            reason: apt.reason || "",
            preferredDoctor: apt.doctor?.name || "Any",
            submittedAt: apt.createdAt || new Date().toISOString(),
            failedAttempts: 0,
            status: "pending"
          })));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Toast notification
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const playNotification = () => {
    try {
      new Audio('/sounds/success.mp3').play();
    } catch (e) {
      console.error(e);
    }
  };

  // Sort: pending first, then failed attempts at bottom
  const sortedRequests = [...requests]
    .filter(req => {
      const matchesSearch = req.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.phone.includes(searchQuery);
      return matchesSearch;
    })
    .sort((a, b) => {
      if (a.status === "failed" && b.status !== "failed") return 1;
      if (a.status !== "failed" && b.status === "failed") return -1;
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });

  // Confirm request - update status to Confirmed
  const handleConfirm = async (id) => {
    try {
      const res = await apiFetch(`${API_RECEPTIONIST}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Confirmed" })
      });
      if (res.ok) {
        const request = requests.find(r => r.id === id);
        setRequests(prev => prev.filter(r => r.id !== id));
        showToast(`Appointment confirmed for ${request.patient}`);
        playNotification();
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Mark as failed attempt
  const handleFailedAttempt = (id) => {
    setRequests(prev => prev.map(req => 
      req.id === id 
        ? { ...req, failedAttempts: req.failedAttempts + 1, status: "failed" }
        : req
    ));
    showToast("Marked as failed attempt", "warning");
  };

  // Delete request permanently
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this request? This cannot be undone.")) {
      try {
        await apiFetch(`${API_RECEPTIONIST}/appointments/${id}`, { method: "DELETE" });
        setRequests(prev => prev.filter(r => r.id !== id));
        showToast("Request deleted", "warning");
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  };

  // Count pending requests
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const failedCount = requests.filter(r => r.status === "failed").length;

  if (loading) return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Loading requests...</p></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Requests</h2>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by patient name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all bg-white text-gray-900"
        />
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{pendingCount} Pending</span>
        </div>
        {failedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">{failedCount} Failed Attempts</span>
          </div>
        )}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            No pending requests
          </div>
        ) : (
          sortedRequests.map((req) => (
            <div 
              key={req.id} 
              className={`bg-card border rounded-lg p-4 ${
                req.status === "failed" 
                  ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10" 
                  : "border-border"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Request Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground text-lg">{req.patient}</h3>
                    {req.status === "failed" && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs">
                        {req.failedAttempts} failed attempt{req.failedAttempts > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="text-foreground font-medium">{req.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested Date: </span>
                      <span className="text-foreground font-medium">{formatDate(req.requestedDate)} at {req.requestedTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Doctor: </span>
                      <span className="text-foreground">{req.preferredDoctor}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted: </span>
                      <span className="text-foreground">{req.submittedAt}</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground text-sm">Reason: </span>
                    <span className="text-foreground text-sm">{req.reason}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => handleConfirm(req.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 min-h-[44px]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm
                  </button>
                  <button
                    onClick={() => handleFailedAttempt(req.id)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    Failed Attempt
                  </button>
                  <button
                    onClick={() => handleDelete(req.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 min-h-[44px]"
                  >
                    <X className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-white ${
                toast.type === "success" ? "bg-emerald-600" :
                toast.type === "warning" ? "bg-amber-600" :
                toast.type === "error" ? "bg-red-600" : "bg-[#1d4ed8]"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
