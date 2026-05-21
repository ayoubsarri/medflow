'use client';

import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function DashboardContent() {
  const [appointments, setAppointments] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

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

  // Countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns = {};
      appointments.forEach((apt) => {
        const diff = new Date(apt.date) - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          newCountdowns[apt.id] = days > 0 ? `in ${days} day${days > 1 ? 's' : ''}` : `in ${hours}h`;
        } else {
          newCountdowns[apt.id] = 'Today';
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [appointments]);

  // Bug 13: Cancel appointment handler
  const handleCancel = async (aptId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(aptId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_PATIENTS}/appointments/${aptId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== aptId));
      } else {
        alert('Could not cancel appointment. Please contact the clinic.');
      }
    } catch (e) {
      alert('Network error. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading appointments...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>

      {appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No upcoming appointments. Book one using the "Book Appointment" tab.
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const aptDate = new Date(apt.date);
            const dateStr = aptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            // Bug 8: Existing patients always show Confirmed, not Pending
            const displayStatus = apt.status === 'Pending' ? 'Confirmed' : (apt.status || 'Confirmed');
            return (
              <div key={apt.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{apt.doctor}</p>
                    <p className="text-gray-500">{apt.specialty}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {dateStr} at {apt.timeSlot || new Date(apt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {apt.additionalNotes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{apt.additionalNotes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <p className="text-[#1d4ed8] font-semibold">{countdowns[apt.id] || 'Soon'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      displayStatus === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {displayStatus}
                    </span>
                    {/* Bug 13: Cancel button */}
                    <button
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancellingId === apt.id}
                      className="text-xs px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {cancellingId === apt.id ? 'Cancelling...' : 'Cancel'}
                    </button>
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