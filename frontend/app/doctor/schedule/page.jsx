"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Play, CheckCircle, Clock, Save, Printer, X, History, FileCheck, RefreshCw, Trash2
} from "lucide-react";
import { API_DOCTOR } from "@/config/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function getWeekBounds(anchor) {
  const d = new Date(anchor);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // Monday start
  const start = new Date(d); start.setDate(d.getDate() + diff);
  const end   = new Date(start); end.setDate(start.getDate() + 6);
  return { start, end };
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  return cells;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

const DEFAULT_PRESCRIPTION  = "Médicament: \nDosage: \nFréquence: \nDurée: \nInstructions: ";
const DEFAULT_JUSTIFICATION = "Le patient a été examiné ce jour et nécessite:\n\n[ ] Arrêt de travail pour ___ jours\n[ ] Repos à domicile\n[ ] Autre: ___\n\nRaison: ";

export default function DoctorSchedule() {
  const today = new Date();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [weekAnchor, setWeekAnchor]     = useState(today);
  const [expandedView, setExpandedView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());

  const [showConsultation, setShowConsultation]   = useState(false);
  const [selectedPatient, setSelectedPatient]     = useState(null);
  const [consultNotes, setConsultNotes]           = useState("");
  const [consultPrescription, setConsultPrescription] = useState("");
  const [consultJustification, setConsultJustification] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [toasts, setToasts] = useState([]);

  // ── Fetch appointments for a date range ─────────────────────────────────
  const fetchRange = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const token    = localStorage.getItem("token");
      const doctorId = localStorage.getItem("staffId");
      const url = `${API_DOCTOR}/schedule/range?doctorId=${doctorId}&startDate=${formatDate(start)}&endDate=${formatDate(end)}`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when week/month view changes
  useEffect(() => {
    if (!expandedView) {
      const { start, end } = getWeekBounds(weekAnchor);
      fetchRange(start, end);
    } else {
      const start = new Date(currentYear, currentMonth, 1);
      const end   = new Date(currentYear, currentMonth + 1, 0);
      fetchRange(start, end);
    }
  }, [expandedView, weekAnchor, currentMonth, currentYear, fetchRange]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const { start: weekStart, end: weekEnd } = getWeekBounds(weekAnchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });
  const calendarDays = generateCalendarDays(currentYear, currentMonth);

  const getCount = (dateStr) =>
    appointments.filter(a => formatDate(new Date(a.date)) === dateStr).length;

  const selectedDateAppointments = appointments
    .filter(a => formatDate(new Date(a.date)) === selectedDate)
    .sort((a, b) => (a.timeSlot || "").localeCompare(b.timeSlot || ""));

  // ── Consultation handlers ─────────────────────────────────────────────────
  const handleStart = (apt) => {
    setSelectedPatient(apt);
    setConsultNotes("");
    setConsultPrescription(DEFAULT_PRESCRIPTION);
    setConsultJustification(DEFAULT_JUSTIFICATION);
    setShowHistory(false);
    setShowConsultation(true);
    showToast("Consultation started", "info");
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_DOCTOR}/consultation/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          appointmentId: selectedPatient._id,
          patientId: selectedPatient.patient?._id,
          notes: consultNotes,
          prescription: consultPrescription,
          medicalJustification: consultJustification,
        })
      });
      setShowConsultation(false);
      showToast("Consultation saved");
      // Optimistically mark as completed in local state
      setAppointments(prev =>
        prev.map(a => a._id === selectedPatient._id ? { ...a, status: "Completed" } : a)
      );
    } catch {
      showToast("Error saving consultation", "error");
    }
  };

  const handlePrint = (type) => {
    if (!selectedPatient) return;
    const doctorName = localStorage.getItem("staffName") || "Docteur";
    const patientName = `${selectedPatient.patient?.firstName || ""} ${selectedPatient.patient?.lastName || ""}`.trim();
    const content = type === "prescription" ? consultPrescription : consultJustification;
    const title   = type === "prescription" ? "Ordonnance" : "Justification Médicale";
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>${title} - ${patientName}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}
      .header{text-align:center;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:30px}
      .clinic-name{font-size:24px;font-weight:bold;color:#1d4ed8}
      .content{white-space:pre-wrap;line-height:1.8;padding:20px;border:1px solid #ddd}
      .footer{margin-top:50px;text-align:right}</style></head><body>
      <div class="header"><div class="clinic-name">MedFlow</div><div>${doctorName}</div></div>
      <p><strong>${patientName}</strong></p>
      <h3>${title}</h3>
      <div class="content">${content || "—"}</div>
      <div class="footer">Date: ${new Date().toLocaleDateString()}<br/><br/>${doctorName}</div>
      <script>window.print();</script></body></html>`);
    w.document.close();
  };

  const handleCancel = async (aptId) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_DOCTOR}/appointment/${aptId}/cancel`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(prev => prev.filter(a => a._id !== aptId));
      showToast("Appointment cancelled", "warning");
    } catch {
      showToast("Error cancelling appointment", "error");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#1d4ed8]" />
            Schedule
          </h1>
          <p className="text-muted-foreground">{formatDateDisplay(selectedDate)}</p>
        </div>
        <button onClick={() => setExpandedView(!expandedView)}
          className="p-2 hover:bg-muted rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
          {expandedView ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          {expandedView ? "Week View" : "Month View"}
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-card border border-border rounded-lg p-4">
        {!expandedView ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate()-7); setWeekAnchor(d); }}
                className="p-2 hover:bg-muted rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <span className="font-medium text-foreground">
                {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate()+7); setWeekAnchor(d); }}
                className="p-2 hover:bg-muted rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const dateStr  = formatDate(day);
                const count    = getCount(dateStr);
                const selected = dateStr === selectedDate;
                const isToday  = dateStr === formatDate(today);
                return (
                  <button key={idx} onClick={() => setSelectedDate(dateStr)}
                    className={`p-3 rounded-lg text-center min-h-[80px] flex flex-col items-center justify-center transition-colors ${
                      selected ? "bg-[#1d4ed8] text-white" :
                      isToday  ? "bg-blue-100 text-[#1d4ed8] border-2 border-[#1d4ed8]" :
                                 "hover:bg-muted"
                    }`}>
                    <span className="text-xs">{DAY_NAMES[day.getDay()]}</span>
                    <span className="text-lg font-bold">{day.getDate()}</span>
                    {count > 0 && (
                      <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                        selected ? "bg-white/30 text-white" : "bg-blue-100 text-[#1d4ed8]"
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1);}else setCurrentMonth(m=>m-1); }}
                className="p-2 hover:bg-muted rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <span className="font-medium text-foreground text-lg">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button onClick={() => { if (currentMonth===11){setCurrentMonth(0);setCurrentYear(y=>y+1);}else setCurrentMonth(m=>m+1); }}
                className="p-2 hover:bg-muted rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const dateStr  = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const count    = getCount(dateStr);
                const selected = dateStr === selectedDate;
                const isToday  = dateStr === formatDate(today);
                return (
                  <button key={idx} onClick={() => setSelectedDate(dateStr)}
                    className={`p-2 rounded-lg text-center min-h-[60px] flex flex-col items-center justify-center transition-colors ${
                      selected ? "bg-[#1d4ed8] text-white" :
                      isToday  ? "bg-blue-100 text-[#1d4ed8] border border-[#1d4ed8]" :
                      count > 0 ? "bg-muted/50 hover:bg-muted" : "hover:bg-muted"
                    }`}>
                    <span className="text-sm font-medium">{day}</span>
                    {count > 0 && (
                      <span className={`text-[10px] mt-0.5 ${selected ? "text-white/80" : "text-[#1d4ed8]"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Appointments list */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            Appointments for {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading...</p>
          ) : selectedDateAppointments.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No appointments scheduled for this day.</p>
          ) : selectedDateAppointments.map((apt) => (
            <div key={apt._id} className={`p-4 ${apt.status === "Completed" ? "opacity-60 bg-muted/20" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-lg font-bold text-[#1d4ed8]">{apt.timeSlot}</span>
                    <span className="font-semibold text-foreground">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </span>
                    {apt.status === "Completed" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {apt.status === "Checked-In" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Checked-In</span>
                    )}
                    {apt.status === "Confirmed" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Confirmed</span>
                    )}
                  </div>
                  {apt.additionalNotes && (
                    <p className="text-sm text-muted-foreground italic">{apt.additionalNotes}</p>
                  )}
                </div>

                {(apt.status === "Confirmed" || apt.status === "Checked-In") && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleStart(apt)}
                      className="bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e40af] flex items-center gap-2 min-h-[40px]">
                      <Play className="w-4 h-4" /> Start
                    </button>
                    <button onClick={() => handleCancel(apt._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancel">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consultation Modal */}
      {showConsultation && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl w-full max-w-5xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-lg text-foreground">Consultation</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient.patient?.firstName} {selectedPatient.patient?.lastName} — {selectedPatient.timeSlot}
                </p>
              </div>
              <button onClick={() => setShowConsultation(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient profile */}
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1d4ed8] to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {(selectedPatient.patient?.firstName?.[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {selectedPatient.patient?.firstName} {selectedPatient.patient?.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{selectedPatient.additionalNotes}</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setShowHistory(!showHistory)}
                    className="w-full bg-[#1d4ed8] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#1e40af] flex items-center justify-center gap-2">
                    <History className="w-5 h-5" />
                    {showHistory ? "Hide" : "View"} History
                  </button>
                  {showHistory && (
                    <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                      History available in the Patients page.
                    </div>
                  )}
                </div>

                {/* Notes & forms */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea value={consultNotes} onChange={e => setConsultNotes(e.target.value)}
                      rows={4} placeholder="Consultation notes..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] outline-none text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prescription</label>
                    <textarea value={consultPrescription} onChange={e => setConsultPrescription(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] outline-none text-gray-900 bg-white font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <FileCheck className="w-4 h-4" /> Medical Justification
                    </label>
                    <textarea value={consultJustification} onChange={e => setConsultJustification(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 bg-white font-mono text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex flex-wrap gap-3 shrink-0">
              <button onClick={handleSave}
                className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 min-h-[44px]">
                <Save className="w-5 h-5" /> Save
              </button>
              <button onClick={() => handlePrint("prescription")}
                className="bg-[#1d4ed8] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#1e40af] flex items-center gap-2 min-h-[44px]">
                <Printer className="w-5 h-5" /> Print Prescription
              </button>
              <button onClick={() => handlePrint("justification")}
                className="bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2 min-h-[44px]">
                <FileCheck className="w-5 h-5" /> Print Justification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-20 md:bottom-5 right-5 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow text-white ${
            t.type === "success" ? "bg-green-500" :
            t.type === "warning" ? "bg-yellow-500" :
            t.type === "error"   ? "bg-red-500" : "bg-[#1d4ed8]"
          }`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}
