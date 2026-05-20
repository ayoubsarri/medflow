"use client";

import { useState, useEffect } from "react";
import { Play, Save, X } from "lucide-react";
import { API_DOCTOR } from "@/config/api";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({ today: 0, waiting: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [showConsultation, setShowConsultation] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultNotes, setConsultNotes] = useState("");
  const [consultPrescription, setConsultPrescription] = useState("");
  const [consultJustification, setConsultJustification] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [requestedDocs, setRequestedDocs] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token    = localStorage.getItem('token');
        const doctorId = localStorage.getItem('staffId');
        const res = await fetch(`${API_DOCTOR}/dashboard?doctorId=${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setAppointments(data.schedule || []);
          setSummary(data.summary || { today: 0, waiting: 0, completed: 0 });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleStartConsultation = (apt) => {
    setSelectedPatient(apt);
    setConsultNotes("");
    setConsultPrescription("");
    setConsultJustification("");
    setFollowUpDate("");
    setRequestedDocs("");
    setShowConsultation(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_DOCTOR}/consultation/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          appointmentId: selectedPatient._id,
          patientId: selectedPatient.patient?._id,
          notes: consultNotes,
          prescription: consultPrescription,
          medicalJustification: consultJustification,
          followUpDate,
          requestedDocuments: requestedDocs
        })
      });
      if (res.ok) {
        setShowConsultation(false);
        window.location.reload();
      }
    } catch {
      alert("Error saving consultation");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading schedule...</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-2xl font-bold">{summary.today}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Waiting</p>
          <p className="text-2xl font-bold text-amber-600">{summary.waiting}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.completed}</p>
        </div>
      </div>

      {/* Queue */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold">Today's Patient Queue</h2>
        </div>
        <div className="divide-y">
          {appointments.length === 0 ? (
            <p className="p-8 text-center text-gray-400">No patients in queue today.</p>
          ) : appointments.map((apt) => (
            <div key={apt._id} className="p-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-blue-600 mr-4">{apt.timeSlot}</span>
                <span className="font-medium">
                  {apt.patient?.firstName} {apt.patient?.lastName}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">{apt.additionalNotes}</p>
                <p className="text-xs text-gray-400">{apt.status}</p>
              </div>
              {apt.status === 'Checked-In' && (
                <button
                  onClick={() => handleStartConsultation(apt)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <Play size={14} /> Start
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consultation Modal */}
      {showConsultation && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">
                Consultation: {selectedPatient.patient?.firstName} {selectedPatient.patient?.lastName}
              </h2>
              <button onClick={() => setShowConsultation(false)}><X /></button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block font-bold">Notes</label>
                <textarea value={consultNotes} onChange={e => setConsultNotes(e.target.value)}
                  className="w-full border p-2 rounded h-32" placeholder="Consultation notes..." />
                <label className="block font-bold">Prescription</label>
                <textarea value={consultPrescription} onChange={e => setConsultPrescription(e.target.value)}
                  className="w-full border p-2 rounded h-32" placeholder="Prescription..." />
              </div>
              <div className="space-y-4">
                <label className="block font-bold">Medical Justification</label>
                <textarea value={consultJustification} onChange={e => setConsultJustification(e.target.value)}
                  className="w-full border p-2 rounded h-32" placeholder="Justification..." />
                <label className="block font-bold">Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={handleSave}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700">
                <Save /> Finalize &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
