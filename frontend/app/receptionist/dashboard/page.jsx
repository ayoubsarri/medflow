"use client";

import Link from "next/link";
import { Calendar, Users, Clock, CheckCircle, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import { API_RECEPTIONIST } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

function formatDateKey(date) {
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const today = formatDateKey(new Date());
        const res = await apiFetch(`${API_RECEPTIONIST}/appointments?date=${today}&limit=200`);
        const data = await res.json();
        if (data.success) {
          setAppointments(data.data || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Flatten into display-ready rows
  const todaySchedule = appointments.map(apt => ({
    id: apt._id,
    time: apt.timeSlot || "—",
    patient: `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() || "Unknown Patient",
    doctor: apt.doctor?.name || "Unknown Doctor",
    doctorId: apt.doctor?._id || "unknown",
    rawStatus: apt.status,
    status: apt.status === "Confirmed"   ? "confirmed"
          : apt.status === "Completed"   ? "completed"
          : apt.status === "Checked-In"  ? "checked-in"
          : apt.status === "In Progress" ? "in-progress"
          : "pending",
  })).sort((a, b) => (a.time > b.time ? 1 : -1));

  // Stats
  const stats = [
    { label: "Today's Appointments", value: appointments.length,                                                 icon: Calendar,     color: "text-[#1d4ed8]",   bg: "bg-blue-100"    },
    { label: "In Queue Now",          value: appointments.filter(a => a.status === "Confirmed").length,           icon: Users,        color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Pending Requests",      value: appointments.filter(a => a.status === "Pending").length,            icon: Clock,        color: "text-amber-600",   bg: "bg-amber-100"   },
    { label: "Completed Today",       value: appointments.filter(a => a.status === "Completed").length,          icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  // Group schedule by doctor
  const queueByDoctor = {};
  todaySchedule.forEach(apt => {
    const key = apt.doctorId;
    if (!queueByDoctor[key]) {
      queueByDoctor[key] = { doctorName: apt.doctor, patients: [] };
    }
    queueByDoctor[key].patients.push(apt);
  });
  const doctorGroups = Object.values(queueByDoctor);

  const statusBadge = (status) => {
    switch (status) {
      case "confirmed":    return "bg-emerald-100 text-emerald-800";
      case "completed":    return "bg-blue-100 text-blue-800";
      case "checked-in":   return "bg-purple-100 text-purple-800";
      case "in-progress":  return "bg-amber-100 text-amber-800";
      default:             return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Loading dashboard...</p></div>;
  if (error)   return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Doctor Queues */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Today&apos;s Queue by Doctor</h3>
        <Link href="/receptionist/appointments" className="text-sm text-[#1d4ed8] hover:underline">
          View calendar
        </Link>
      </div>

      {doctorGroups.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          No appointments scheduled for today.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctorGroups.map(({ doctorName, patients }) => (
            <div key={doctorName} className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Doctor header */}
              <div className="px-4 py-3 bg-[#1d4ed8] text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                <span className="font-semibold">{doctorName}</span>
                <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {patients.length} patient{patients.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Patient rows */}
              <div className="divide-y divide-border">
                {patients.map(apt => (
                  <div key={apt.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#1d4ed8] w-12 shrink-0">{apt.time}</span>
                      <p className="text-sm font-medium text-foreground">{apt.patient}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(apt.status)}`}>
                      {apt.rawStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
