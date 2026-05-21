"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Play,
  CheckCircle,
  UserX,
  Clock,
} from "lucide-react";
import ConsultationModal from "@/components/doctor/ConsultationModal";
import { API_APPOINTMENTS } from "@/config/api";

const initialAppointments = [];

// Status badge component
function StatusBadge({ status }) {
  const styles = {
    present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    absent: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    is_serving: "bg-blue-100 text-[#1d4ed8] dark:bg-blue-900/30 dark:text-blue-400",
  };
  const labels = {
    present: "Ready",
    absent: "Not Arrived",
    is_serving: "Current",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function DoctorQueue() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Auto-refresh the live queue every 30 seconds so the queue stays current.
  useEffect(() => {
    const normalizeStatus = (status, isCurrent) => {
      if (isCurrent) return "is_serving";
      if (status === "Absent") return "absent";
      return "present";
    };

    const formatTime = (dateValue) => {
      if (!dateValue) return "";
      const date = new Date(dateValue);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const normalizeAppointment = (apt, isCurrent = false) => ({
      id: apt._id || apt.id,
      time: apt.time || formatTime(apt.date),
      patient: apt.patient ? `${apt.patient.firstName || ""} ${apt.patient.lastName || ""}`.trim() : apt.patientName || "Unknown",
      age: apt.patient?.dateOfBirth ? new Date().getFullYear() - new Date(apt.patient.dateOfBirth).getFullYear() : apt.age || null,
      reason: apt.reason || apt.notes || "",
      allergies: "",
      chronicConditions: "",
      lastVisit: "",
      contact: apt.patient?.phone || "",
      visitHistory: [],
      medicalRecords: [],
      status: normalizeStatus(apt.status, isCurrent),
      notes: apt.notes || "",
      prescription: apt.prescription || "",
    });

    const fetchQueue = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_APPOINTMENTS}/queue`);
        if (!response.ok) {
          throw new Error(`Queue fetch failed (${response.status})`);
        }

        const payload = await response.json();
        const queueData = payload?.data || {};
        const currentCall = queueData.currentCall ? normalizeAppointment(queueData.currentCall, true) : null;
        const upcoming = Array.isArray(queueData.upcoming)
          ? queueData.upcoming.map((apt) => normalizeAppointment(apt, false))
          : [];

        setAppointments(currentCall ? [currentCall, ...upcoming] : upcoming);
      } catch (err) {
        setError(err?.message || "Could not load queue. Is the server running?");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const intervalId = setInterval(fetchQueue, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter out completed - queue only shows active patients
  const queueAppointments = appointments.filter((a) => a.status !== "completed");

  // Get currently serving patient
  const currentlyServing = appointments.find((a) => a.status === "is_serving");

  // Waiting list (present patients)
  const waitingList = appointments.filter((a) => a.status === "present");

  // Stats
  const presentCount = waitingList.length;
  const absentCount = appointments.filter((a) => a.status === "absent").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  // Start consultation - changes status to is_serving and opens modal
  const handleStart = async (apt) => {
    // Complete any currently serving patient first
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.status === "is_serving") return { ...a, status: "completed" };
        if (a.id === apt.id) return { ...a, status: "is_serving" };
        return a;
      })
    );

    // Bug 4: PATCH appointment status to "In Progress" so receptionist queue reflects it
    try {
      await fetch(`${API_APPOINTMENTS}/${apt.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "In Progress" }),
      });
    } catch (e) {
      console.warn("[DoctorQueue] Could not update appointment status:", e.message);
    }

    // Bug 5: Fetch full patient profile so consultation modal has complete history
    let enrichedPatient = { ...apt };
    try {
      const profileRes = await fetch(`${API_APPOINTMENTS}/${apt.id}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const fullAppt = profileData.data || profileData;
        const p = fullAppt.patient || {};
        enrichedPatient = {
          ...apt,
          allergies: p.allergies || apt.allergies || "None",
          chronicConditions: p.chronicConditions || apt.chronicConditions || "None",
          lastVisit: p.lastVisit || apt.lastVisit || "First visit",
          contact: p.phone || apt.contact || "",
          dateOfBirth: p.dateOfBirth || "",
          bloodType: p.bloodType || "",
          visitHistory: p.visitHistory || [],
          medicalRecords: p.medicalRecords || [],
        };
      }
    } catch (e) {
      console.warn("[DoctorQueue] Could not fetch patient profile:", e.message);
    }

    setSelectedPatient(enrichedPatient);
    setShowModal(true);
    showToast("Consultation started", "info");
  };

  // Save & Complete handler for ConsultationModal
  const handleSaveComplete = async (data) => {
    if (!selectedPatient) return;

    // Bug 9: Persist notes and prescription to DB
    try {
      await fetch(`${API_APPOINTMENTS}/${selectedPatient.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: data.notes,
          prescription: data.prescription,
          status: "Completed",
        }),
      });
    } catch (e) {
      console.warn("[DoctorQueue] Could not save consultation notes:", e.message);
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === selectedPatient.id
          ? { ...a, status: "completed", notes: data.notes, prescription: data.prescription }
          : a
      )
    );
    setShowModal(false);
    setSelectedPatient(null);
    showToast("Consultation saved");
  };

  // Mark absent - removes from queue view
  const handleMarkAbsent = (id) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "absent" } : a))
    );
    showToast("Patient marked as absent", "warning");
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  // Update patient data handler
  const handleUpdatePatient = (updatedPatient) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === updatedPatient.id ? updatedPatient : a
      )
    );
    setSelectedPatient(updatedPatient);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-[#1d4ed8]" />
          Consultation Queue
        </h1>
        <p className="text-muted-foreground">Patients ordered by appointment time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Present</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{absentCount}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[#1d4ed8]">{completedCount}</p>
          <p className="text-sm text-[#1d4ed8] dark:text-blue-400">Completed</p>
        </div>
      </div>

      {/* Currently Serving */}
      {currentlyServing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#1d4ed8] dark:text-blue-400 font-medium mb-1">Currently Serving</p>
              <p className="text-lg font-semibold text-foreground">{currentlyServing.patient}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {currentlyServing.time}
              </p>
            </div>
            <button
              onClick={() => handleStart(currentlyServing)}
              aria-label="Resume consultation"
              className="bg-[#1d4ed8] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#1e40af] min-h-[44px] transition-colors"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Patient</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading queue...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                    Could not load queue. Is the server running?
                  </td>
                </tr>
              ) : queueAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No patients in queue right now.
                  </td>
                </tr>
              ) : (
                queueAppointments.map((apt, idx) => (
                  <tr
                    key={apt.id}
                    className={`hover:bg-muted/30 ${
                      apt.status === "is_serving" ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">{idx + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {apt.time}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{apt.patient}</span>
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground">{apt.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === "present" && (
                          <>
                            <button
                              onClick={() => handleStart(apt)}
                              aria-label={`Start consultation with ${apt.patient}`}
                              className="bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#1e40af] flex items-center gap-1 min-h-[36px] transition-colors"
                            >
                              <Play className="w-4 h-4" />
                              Start
                            </button>
                            <button
                              onClick={() => handleMarkAbsent(apt.id)}
                              aria-label={`Mark ${apt.patient} as absent`}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1 min-h-[36px] transition-colors"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {apt.status === "is_serving" && (
                          <button
                            onClick={() => handleStart(apt)}
                            aria-label="Complete consultation"
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1 min-h-[36px]"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        {apt.status === "absent" && (
                          <span className="text-xs text-muted-foreground">Not arrived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Consultation Modal */}
      <ConsultationModal
        isOpen={showModal}
        onClose={handleCloseModal}
        patient={selectedPatient}
        onSaveComplete={handleSaveComplete}
        hasNextPatient={false}
        onUpdatePatient={handleUpdatePatient}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow text-white ${
              toast.type === "success"
                ? "bg-green-500"
                : toast.type === "error"
                ? "bg-red-500"
                : toast.type === "warning"
                ? "bg-yellow-500"
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
