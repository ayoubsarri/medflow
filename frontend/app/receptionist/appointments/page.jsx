"use client";

/**
 * =============================================================================
 * RECEPTIONIST APPOINTMENTS PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * Calendar-based view of all appointments (like doctor schedule page).
 * Week view by default, expandable to month view.
 * Search by doctor or patient name. Table without status/actions columns.
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Calendar, Maximize2, Minimize2 } from "lucide-react";
import { API_RECEPTIONIST } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

// Helper: Get week days starting from a given date
function getWeekDays(startDate) {
  const days = [];
  const start = new Date(startDate);
  // Adjust to start of week (Sunday)
  start.setDate(start.getDate() - start.getDay());
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

// Helper: Get all days in a month
function getMonthDays(year, month) {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Add empty cells for days before first of month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  
  return days;
}

// Helper: Format date as YYYY-MM-DD
function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

// Helper: Format display date
function formatDisplayDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("All Doctors");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMonthView, setIsMonthView] = useState(false);
  const [doctors, setDoctors] = useState(["All Doctors"]);

  // =========================================================================
  // FETCH APPOINTMENTS AND DOCTORS
  // =========================================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all appointments
        const aptRes = await apiFetch(`${API_RECEPTIONIST}/appointments?limit=1000`);
        const aptData = await aptRes.json();
        
        // Transform appointments to display format
        const transformed = (aptData.data || []).map(apt => ({
          id: apt._id,
          date: apt.date ? apt.date.split("T")[0] : '',
          time: apt.timeSlot || '--:--',
          patient: apt.patient
            ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim() || 'Unknown'
            : 'Unknown Patient',
          doctor: apt.doctor?.name || 'Unknown Doctor',
          type: apt.additionalNotes || 'Consultation',
          status: apt.status
        }));
        
        setAppointments(transformed);
        
        // Extract unique doctors
        const uniqueDoctors = ["All Doctors", ...new Set(transformed.map(a => a.doctor))];
        setDoctors(uniqueDoctors);
        
        setLoading(false);
      } catch (err) {
        console.error("[Appointments] Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Get days for current view
  const weekDays = getWeekDays(currentDate);
  const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

  // Navigate week/month
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (isMonthView) {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (isMonthView) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = 
      (apt.patient?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (apt.doctor?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesDoctor = selectedDoctor === "All Doctors" || apt.doctor === selectedDoctor;
    const matchesDate = apt.date === formatDateKey(selectedDate);
    return matchesSearch && matchesDoctor && matchesDate;
  }).sort((a, b) => a.time.localeCompare(b.time));

  // Count appointments per date
  const getAppointmentCount = (date) => {
    if (!date) return 0;
    const dateKey = formatDateKey(date);
    return appointments.filter(apt => {
      const matchesDoctor = selectedDoctor === "All Doctors" || apt.doctor === selectedDoctor;
      const matchesSearch = searchQuery === "" || 
        apt.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctor.toLowerCase().includes(searchQuery.toLowerCase());
      return apt.date === dateKey && matchesDoctor && matchesSearch;
    }).length;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Appointments</h2>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background min-h-[44px]"
          />
        </div>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="px-4 py-2 border border-input rounded-lg bg-background min-h-[44px]"
        >
          {doctors.map((doc, i) => (
            <option key={i} value={doc}>{doc || 'Unknown Doctor'}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Panel */}
        <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={navigatePrev}
              className="p-2 hover:bg-muted rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-foreground">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-muted rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Toggle View Button */}
          <button
            onClick={() => setIsMonthView(!isMonthView)}
            className="w-full mb-4 px-3 py-2 bg-muted rounded-lg text-sm text-foreground hover:bg-muted/80 flex items-center justify-center gap-2 min-h-[40px]"
          >
            {isMonthView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isMonthView ? "Week View" : "Month View"}
          </button>

          {/* Week View */}
          {!isMonthView && (
            <div className="space-y-2">
              {weekDays.map((day, idx) => {
                const count = getAppointmentCount(day);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`w-full p-3 rounded-lg text-left transition-colors min-h-[50px] ${
                      isSelected(day)
                        ? "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500"
                        : isToday(day)
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-300"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isToday(day) ? "text-[#1d4ed8]" : "text-foreground"}`}>
                        {formatDisplayDate(day)}
                      </span>
                      {count > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs">
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Month View */}
          {isMonthView && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, idx) => {
                  if (!day) {
                    return <div key={idx} className="h-10" />;
                  }
                  const count = getAppointmentCount(day);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`h-10 rounded-lg text-sm relative ${
                        isSelected(day)
                          ? "bg-emerald-500 text-white"
                          : isToday(day)
                          ? "bg-blue-100 text-[#1d4ed8] dark:bg-blue-900/30 dark:text-blue-400"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {day.getDate()}
                      {count > 0 && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Appointments Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No appointments for this date
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Time</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Patient</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Doctor</th>
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-3 text-foreground font-medium">{apt.time}</td>
                      <td className="p-3 text-foreground">{apt.patient}</td>
                      <td className="p-3 text-foreground">{apt.doctor}</td>
                      <td className="p-3 text-muted-foreground">{apt.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
