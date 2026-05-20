'use client';

import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function DashboardContent() {
  const [appointments, setAppointments] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [loading, setLoading] = useState(true);

  // FETCH REAL APPOINTMENTS
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const patientId = localStorage.getItem('patientId');
        if (!patientId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_PATIENTS}/dashboard/${patientId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
          console.error(`HTTP ${response.status}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : (data?.appointments || []));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Countdown logic stays, but now uses the REAL appointments state
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns = {};
      appointments.forEach((apt) => {
        const diff = new Date(apt.date) - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          newCountdowns[apt.id] = `in ${days} days`;
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [appointments]);

  if (loading) return <div className="p-8 text-center">Loading appointments...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>

      {appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No upcoming appointments. Book one from the reception desk.
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const aptDate = new Date(apt.date);
            const dateStr = aptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            return (
              <div key={apt.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{apt.doctor}</p>
                    <p className="text-gray-500">{apt.specialty}</p>
                    <p className="text-sm text-gray-400 mt-1">{dateStr} at {apt.timeSlot}</p>
                    {apt.additionalNotes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{apt.additionalNotes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <p className="text-[#1d4ed8] font-semibold">{countdowns[apt.id] || 'Soon'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}