/**
 * =============================================================================
 * RECEPTIONIST QUEUE MANAGEMENT PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * This page allows receptionists to manage the patient waiting queue.
 * Patients are ordered by their APPOINTMENT TIME (not FIFO).
 * The system tracks who has arrived (present) vs not yet (absent).
 * 
 * KEY CONCEPTS:
 * - ABSENT: Patient has appointment but hasn't arrived yet
 * - PRESENT: Patient has arrived and is waiting
 * - IN-ROOM: Currently being seen by doctor
 * - SKIPPED: Missed their turn (didn't show when called)
 * - COMPLETED: Finished consultation
 * 
 * WORKFLOW:
 * 1. Patients start as "absent" when added to queue
 * 2. When patient arrives, receptionist marks them "present"
 * 3. Doctor calls next present patient (becomes "in-room")
 * 4. After consultation, patient becomes "completed"
 * 5. If patient doesn't show, they get "skipped"
 * 
 * FEATURES:
 * - Waiting room display (now serving, next, waiting count)
 * - Add new patient to queue
 * - Mark present/skip patients
 * - Move patients up in priority
 * - Call next patient
 * - View completed/skipped history
 * 
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { UserCheck, UserX, ChevronUp, Plus } from "lucide-react";
import SmartBookingModal from "@/components/SmartBookingModal";
import { API_RECEPTIONIST } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

let _toastId = 0;
const nextToastId = () => ++_toastId;

// -----------------------------------------------------------------------------
// HELPER FUNCTION: GET STATUS BADGE STYLING
// -----------------------------------------------------------------------------
// Returns CSS classes for status badges based on status type
function getStatusStyle(status) {
  switch (status) {
    case "in-room":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "present":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "absent":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    case "skipped":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "completed":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function QueuePage() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [queue, setQueue] = useState([]);      // Main queue array
  const [doctors, setDoctors] = useState([]);  // List of available doctors
  const [patients, setPatients] = useState([]); // List of available patients
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);  // Add patient modal visibility
  const [showBookingModal, setShowBookingModal] = useState(false); // Smart booking modal
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState(null);
  
  const [toasts, setToasts] = useState([]);              // Toast notifications

  // ---------------------------------------------------------------------------
  // EFFECT: FETCH APPOINTMENTS AND DOCTORS ON LOAD
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's appointments
        const today = new Date().toISOString().split("T")[0];
        const appointmentsRes = await apiFetch(
          `${API_RECEPTIONIST}/appointments?date=${today}`
        );
        const appointmentsData = await appointmentsRes.json();
        
        // Transform appointments to queue format
        const queueData = (appointmentsData.data || []).map((appt, idx) => ({
          id: appt._id,
          ticketNum: 100 + idx + 1,
          // Bug 10 fix: fallback to populated patient object if patientName is empty
          name: appt.patientName ||
                (appt.patient ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim() : 'Unknown Patient'),
          appointmentTime: new Date(appt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          status: "absent",  // New appointments start as absent
          doctorName: appt.doctorName
        }));
        
        setQueue(queueData);
        
        // Fetch available doctors
        const doctorsRes = await apiFetch(`${API_RECEPTIONIST}/doctors`);
        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json();
          setDoctors(doctorsData.data || []);
        }
        
        // Fetch available patients
        const patientsRes = await apiFetch(`${API_RECEPTIONIST}/patients`);
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData.data || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("[Queue] Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);  // Run only once on mount

  // ---------------------------------------------------------------------------
  // TOAST NOTIFICATION SYSTEM
  // ---------------------------------------------------------------------------
  const showToast = (message, type = "success") => {
    const id = nextToastId();
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

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES (QUEUE STATS)
  // ---------------------------------------------------------------------------
  // Find the patient currently in the room
  const nowServing = queue.find((q) => q.status === "in-room");
  // Get all present (waiting) patients
  const presentPatients = queue.filter((q) => q.status === "present");
  // Next patient to be called (first present patient)
  const nextInQueue = presentPatients[0];
  // Count of waiting patients
  const waitingCount = presentPatients.length;

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#1d4ed8] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading queue...</p>
        </div>
      </div>
    );
  }

  // If there was an error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 font-medium">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#1d4ed8] text-white rounded-lg hover:bg-[#1e40af]"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ACTION: MARK PATIENT AS PRESENT (Change from Pending to Confirmed)
  // ---------------------------------------------------------------------------
  // Called when a patient arrives at the clinic
  async function markPresent(id) {
    try {
      const response = await apiFetch(`${API_RECEPTIONIST}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Confirmed" })
      });
      
      if (response.ok) {
        setQueue(prev =>
          prev.map(q => (q.id === id ? { ...q, status: "present" } : q))
        );
        showToast("Patient marked as present");
      } else {
        showToast("Failed to update patient status", "error");
      }
    } catch (err) {
      console.error("[Queue] Error marking present:", err);
      showToast(err.message, "error");
    }
  }

  // ---------------------------------------------------------------------------
  // ACTION: MARK PATIENT AS SKIPPED
  // ---------------------------------------------------------------------------
  // Called when a patient misses their turn
  async function markAbsent(id) {
    try {
      const response = await apiFetch(`${API_RECEPTIONIST}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "No Show" })
      });
      
      if (response.ok) {
        setQueue(prev =>
          prev.map(q => (q.id === id ? { ...q, status: "skipped" } : q))
        );
        showToast("Patient skipped", "warning");
      } else {
        showToast("Failed to skip patient", "error");
      }
    } catch (err) {
      console.error("[Queue] Error marking absent:", err);
      showToast(err.message, "error");
    }
  }

  // ---------------------------------------------------------------------------
  // ACTION: CALL NEXT PATIENT
  // ---------------------------------------------------------------------------
  // Moves current patient to completed, calls next present patient
  async function callNext() {
    const currentPatient = queue.find(q => q.status === "in-room");
    if (!currentPatient) {
      showToast("No patient currently in room", "warning");
      return;
    }
    
    try {
      // Mark current patient as completed
      await apiFetch(`${API_RECEPTIONIST}/appointments/${currentPatient.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      
      setQueue(prev => {
        const updated = prev.map(q =>
          q.id === currentPatient.id ? { ...q, status: "completed" } : q
        );
        
        // Find first present patient and set them to in-room
        const firstPresentIdx = updated.findIndex(q => q.status === "present");
        if (firstPresentIdx !== -1) {
          updated[firstPresentIdx] = { ...updated[firstPresentIdx], status: "in-room" };
        }
        
        return updated;
      });
      
      showToast("Calling next patient", "info");
      playNotification();
    } catch (err) {
      console.error("[Queue] Error calling next:", err);
      showToast(err.message, "error");
    }
  }

  // ---------------------------------------------------------------------------
  // ACTION: SKIP CURRENT PATIENT
  // ---------------------------------------------------------------------------
  // Marks current patient as skipped, calls next present patient
  async function skipCurrent() {
    const currentPatient = queue.find(q => q.status === "in-room");
    if (!currentPatient) {
      showToast("No patient currently in room", "warning");
      return;
    }
    
    try {
      // Mark current patient as skipped
      await apiFetch(`${API_RECEPTIONIST}/appointments/${currentPatient.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "No Show" })
      });
      
      setQueue(prev => {
        const updated = prev.map(q =>
          q.id === currentPatient.id ? { ...q, status: "skipped" } : q
        );
        
        // Find first present patient and set them to in-room
        const firstPresentIdx = updated.findIndex(q => q.status === "present");
        if (firstPresentIdx !== -1) {
          updated[firstPresentIdx] = { ...updated[firstPresentIdx], status: "in-room" };
        }
        
        return updated;
      });
      
      showToast("Patient skipped", "warning");
    } catch (err) {
      console.error("[Queue] Error skipping patient:", err);
      showToast(err.message, "error");
    }
  }

  // ---------------------------------------------------------------------------
  // ACTION: MOVE PATIENT UP IN PRIORITY
  // ---------------------------------------------------------------------------
  // Moves a waiting patient to right after the current in-room patient
  function moveUp(id) {
    setQueue((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index <= 0) return prev;  // Already at top

      // Find position of in-room patient
      const inRoomIndex = prev.findIndex((q) => q.status === "in-room");
      // Can't move above in-room patient
      if (index <= inRoomIndex + 1) return prev;

      // Remove patient and insert right after in-room patient
      const newQueue = [...prev];
      const [item] = newQueue.splice(index, 1);
      newQueue.splice(inRoomIndex + 1, 0, item);
      return newQueue;
    });
    showToast("Patient moved up", "info");
  }

  // ---------------------------------------------------------------------------
  // ACTION: ADD NEW PATIENT TO QUEUE (via Smart Booking)
  // ---------------------------------------------------------------------------
  function handleOpenSmartBooking() {
    // Open SmartBookingModal instead of old modal
    setShowBookingModal(true);
  }

  function handleBookingSuccess(appointmentData) {
    // Add the new appointment to queue
    const newEntry = {
      id: appointmentData._id,
      ticketNum: (queue.length || 0) + 100 + 1,
      name: appointmentData.patientName,
      appointmentTime: new Date(appointmentData.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: "absent",
      doctorName: appointmentData.doctorName
    };
    
    setQueue(prev => {
      const updated = [...prev, newEntry];
      return updated.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    });
    
    showToast("Appointment booked successfully");
    setShowBookingModal(false);
  }

  // ---------------------------------------------------------------------------
  // FILTERED LISTS
  // ---------------------------------------------------------------------------
  // Active queue: patients still waiting or being served
  const activeQueue = queue.filter((q) => q.status !== "completed" && q.status !== "skipped");
  // History: completed or skipped patients
  const historyQueue = queue.filter((q) => q.status === "completed" || q.status === "skipped");

  return (
    <div className="space-y-6">
      
      {/* =====================================================================
          PAGE HEADER
          ===================================================================== */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Queue Management</h2>
        <p className="text-muted-foreground">Patients ordered by appointment time</p>
      </div>

      {/* =====================================================================
          WAITING ROOM DISPLAY
          Large display showing current status - positioned at TOP for visibility
          Shows: Now Serving | Next | Waiting Count
          ===================================================================== */}
      <div className="bg-[#1d4ed8] text-white rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Now Serving */}
          <div>
            <p className="text-sm opacity-80">NOW SERVING</p>
            <p className="text-5xl font-bold">#{nowServing?.ticketNum || "--"}</p>
            {nowServing && <p className="text-sm mt-1">{nowServing.name}</p>}
          </div>
          {/* Next Patient */}
          <div className="border-l border-r border-white/20">
            <p className="text-sm opacity-80">NEXT</p>
            <p className="text-4xl font-bold">#{nextInQueue?.ticketNum || "--"}</p>
            {nextInQueue && <p className="text-sm mt-1">{nextInQueue.name}</p>}
          </div>
          {/* Waiting Count */}
          <div>
            <p className="text-sm opacity-80">WAITING</p>
            <p className="text-4xl font-bold">{waitingCount}</p>
            <p className="text-sm mt-1">patients</p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN CONTENT AREA
          Left: Action buttons + History
          Right: Queue list table
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* -----------------------------------------------------------------
            LEFT PANEL: ACTIONS + HISTORY
            ----------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Action Buttons Card */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Actions</h3>

            {/* Add Patient Button */}
            <button
              onClick={handleOpenSmartBooking}
              className="w-full px-4 py-3 bg-[#1d4ed8] text-white rounded-lg hover:bg-[#1e40af] min-h-[44px] flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Book New Appointment
            </button>

            {/* Call Next Button */}
            <button
              onClick={callNext}
              disabled={!nextInQueue}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Call Next Patient
            </button>

            {/* Skip Current Button */}
            <button
              onClick={skipCurrent}
              disabled={!nowServing}
              className="w-full px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Skip Current Patient
            </button>
          </div>

          {/* Today's History Card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">Completed Today</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {historyQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed patients yet</p>
              ) : (
                historyQueue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span className="text-foreground">#{item.ticketNum} - {item.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            RIGHT PANEL: QUEUE LIST TABLE
            Shows all active patients with their status and actions
            ----------------------------------------------------------------- */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg">
            {/* Table Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Queue List</h3>
              <span className="text-sm text-muted-foreground">{activeQueue.length} patients</span>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Ticket</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Appt. Time</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No patients in queue
                      </td>
                    </tr>
                  ) : (
                    activeQueue.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-t border-border ${
                          item.status === "in-room" ? "bg-blue-50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        {/* Ticket Number */}
                        <td className="p-3">
                          <span className="font-bold text-lg text-foreground">#{item.ticketNum}</span>
                        </td>
                        {/* Patient Name */}
                        <td className="p-3 text-foreground">{item.name}</td>
                        {/* Appointment Time */}
                        <td className="p-3 text-foreground font-medium">{item.appointmentTime}</td>
                        {/* Status Badge */}
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(item.status)}`}>
                            {item.status === "in-room" ? "In Room" : item.status === "present" ? "Present" : "Absent"}
                          </span>
                        </td>
                        {/* Action Buttons */}
                        <td className="p-3">
                          <div className="flex gap-2 flex-wrap">
                            {/* Show Present/Skip buttons for absent patients */}
                            {item.status === "absent" && (
                              <>
                                <button
                                  onClick={() => markPresent(item.id)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 min-h-[44px] flex items-center gap-1"
                                  aria-label={`Mark ${item.name} as present`}
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Present
                                </button>
                                <button
                                  onClick={() => markAbsent(item.id)}
                                  className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 min-h-[44px] flex items-center gap-1"
                                  aria-label={`Skip ${item.name}`}
                                >
                                  <UserX className="w-4 h-4" />
                                  Skip
                                </button>
                              </>
                            )}
                            {/* Show Move Up button for present patients */}
                            {item.status === "present" && (
                              <button
                                onClick={() => moveUp(item.id)}
                                className="px-3 py-1 bg-[#1d4ed8] text-white rounded text-sm hover:bg-[#1e40af] min-h-[44px] flex items-center gap-1 transition-colors"
                                aria-label={`Move ${item.name} up`}
                              >
                                <ChevronUp className="w-4 h-4" />
                                Move Up
                              </button>
                            )}
                            {/* Show status text for in-room patients */}
                            {item.status === "in-room" && (
                              <span className="text-sm text-[#1d4ed8] font-medium">Currently serving</span>
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
        </div>
      </div>

      {/* =====================================================================
          SMART BOOKING MODAL
          Allows booking appointments with real-time availability checking
          ===================================================================== */}
      {showBookingModal && selectedPatientForBooking && (
        <SmartBookingModal
          patient={selectedPatientForBooking}
          doctors={doctors}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
          showToast={showToast}
        />
      )}

      {/* If modal is open but no patient selected, show patient selector first */}
      {showBookingModal && !selectedPatientForBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">Select Patient</h3>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose a patient to book an appointment for:</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {patients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No patients available</p>
                ) : (
                  patients.map((patient) => {
                    if (!patient) return null;
                    const firstName = patient.firstName || "Unknown";
                    const lastName = patient.lastName || "";
                    const phone = patient.phone || "No phone";
                    return (
                    <button
                      key={patient._id || Math.random()}
                      onClick={() => {
                        setSelectedPatientForBooking(patient);
                      }}
                      className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-foreground">{firstName} {lastName}</p>
                      <p className="text-xs text-muted-foreground">{phone}</p>
                    </button>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedPatientForBooking(null);
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST NOTIFICATIONS
          Fixed position at bottom-right, auto-dismiss after 3 seconds
          ===================================================================== */}
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
