'use client';

import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function MedicalHistoryContent() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token     = localStorage.getItem('token');
        const patientId = localStorage.getItem('patientId');

        if (!patientId) { setError('Session expired. Please log in again.'); setLoading(false); return; }

        const res = await fetch(`${API_PATIENTS}/history/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setConsultations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load medical history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = consultations.filter((c) => {
    const d = new Date(c.date);
    if (filterDoctor && !c.doctor.toLowerCase().includes(filterDoctor.toLowerCase())) return false;
    if (filterStart && d < new Date(filterStart)) return false;
    if (filterEnd   && d > new Date(filterEnd))   return false;
    return true;
  });

  const uniqueDoctors = [...new Set(consultations.map(c => c.doctor))];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your medical records...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Consultation History</h1>
        <p className="text-gray-500 mt-1 text-sm">Your past visits and completed appointments</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]">
              <option value="">All Doctors</option>
              {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]" />
          </div>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-400">
          No past consultations found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{c.doctor}</p>
                  <p className="text-sm text-gray-500">{c.specialty}</p>
                  {c.diagnosis && c.diagnosis !== '—' && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{c.diagnosis}"</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(c.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">{c.timeSlot}</p>
                  <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {c.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
