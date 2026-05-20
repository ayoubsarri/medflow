"use client";

import { useState, useEffect, useRef } from 'react';
import { Clock, HeartPulse, Stethoscope, CheckCircle } from 'lucide-react';
import { API_APPOINTMENTS } from '@/config/api';

export default function LiveQueueScreen() {
  const [doctors, setDoctors] = useState([]);
  const [healthTips, setHealthTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const prevCallIds = useRef({});

  // Clock — updates every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_APPOINTMENTS}/queue`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.data) return;

      const { doctors: newDoctors = [], healthTips: tips = [] } = data.data;

      // Play chime when a doctor's current call changes
      newDoctors.forEach(doc => {
        const prev = prevCallIds.current[doc.doctorId];
        const curr = doc.currentCall?._id?.toString();
        if (curr && curr !== prev) {
          new Audio('/sounds/success.mp3').play().catch(() => {});
        }
        prevCallIds.current[doc.doctorId] = curr || null;
      });

      setDoctors(newDoctors);
      setHealthTips(tips);
    } catch (err) {
      console.error('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <p className="text-3xl text-blue-800 animate-pulse font-bold">Loading Live Queue...</p>
      </div>
    );
  }

  // Grid: 1 col, 2 cols, or 3 cols depending on how many doctors have appointments today
  const gridClass =
    doctors.length <= 1 ? 'grid-cols-1' :
    doctors.length === 2 ? 'grid-cols-2' :
    'grid-cols-3';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-[#1d4ed8] text-white px-8 py-5 flex justify-between items-center shadow-xl">
        <div>
          <h1 className="text-4xl font-black tracking-tight">MedFlow Clinic</h1>
          <p className="text-blue-200 text-xl mt-1">
            {time.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-6xl font-bold tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-blue-200 text-lg mt-1">Live Waiting Room</p>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 p-6">
        {doctors.length === 0 ? (
          <HealthTipsPanel tips={healthTips} />
        ) : (
          <div className={`grid ${gridClass} gap-6 h-full`}>
            {doctors.map(doc => (
              <DoctorPanel key={doc.doctorId} doctor={doc} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

// ─── Per-doctor column ─────────────────────────────────────────────────────────
function DoctorPanel({ doctor }) {
  const { doctorName, currentCall, upcoming } = doctor;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">

      {/* Doctor name header */}
      <div className="bg-[#1d4ed8] text-white px-6 py-4 flex items-center gap-3">
        <Stethoscope className="w-7 h-7 shrink-0" />
        <h2 className="text-2xl font-bold truncate">{doctorName}</h2>
      </div>

      {/* Now Calling */}
      <div
        className={`flex flex-col items-center justify-center p-8 border-b transition-colors ${
          currentCall ? 'bg-blue-50' : 'bg-gray-50'
        }`}
        style={{ minHeight: '230px' }}
      >
        {currentCall ? (
          <>
            <div className="text-sm font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-5 py-2 rounded-full mb-5 animate-pulse">
              Now Calling
            </div>
            <p className="text-6xl font-black text-gray-900 mb-3 text-center leading-tight">
              {currentCall.patientName}
            </p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              #{currentCall._id.toString().slice(-3).toUpperCase()}
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 opacity-60" />
            <p className="text-xl font-medium text-gray-400 text-center">No patient called yet</p>
          </>
        )}
      </div>

      {/* Upcoming queue */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-3 bg-slate-800 text-white flex items-center gap-2">
          <Clock className="w-5 h-5 shrink-0" />
          <span className="font-bold text-lg">Next Patients</span>
          {upcoming.length > 0 && (
            <span className="ml-auto bg-white/20 text-white text-sm font-bold px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {upcoming.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-lg">
              No more patients waiting
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcoming.slice(0, 7).map((appt, idx) => (
                <div
                  key={appt._id}
                  className={`px-5 py-4 flex items-center gap-4 ${idx === 0 ? 'bg-amber-50' : ''}`}
                >
                  <span className="text-xl font-black text-[#1d4ed8] w-16 shrink-0 tabular-nums">
                    {appt.timeSlot}
                  </span>
                  <span className={`text-xl font-semibold flex-1 truncate ${
                    idx === 0 ? 'text-amber-900' : 'text-gray-800'
                  }`}>
                    {appt.patientName}
                  </span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full shrink-0">
                    #{appt._id.toString().slice(-3).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Health tips (shown when no doctors have appointments today) ──────────────
function HealthTipsPanel({ tips }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-10 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <HeartPulse className="w-10 h-10 text-rose-500" />
        <h2 className="text-4xl font-bold text-blue-900">Health &amp; Wellness Tips</h2>
      </div>
      <div className="grid gap-6 flex-1">
        {tips.map(tip => (
          <div key={tip.id} className="bg-white rounded-2xl shadow p-6 flex items-center gap-6">
            <div className="text-6xl bg-blue-50 p-4 rounded-2xl shrink-0">{tip.image}</div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{tip.title}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
