'use client';

import { useState, useEffect } from 'react';
import { API_DOCTOR, API_PATIENTS, API_RECEPTIONIST } from '@/config/api';
import ReasonSelector from '@/components/ReasonSelector';

export default function BookAppointmentContent() {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [dynamicSlots, setDynamicSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real doctors from the public endpoint (no auth needed)
  useEffect(() => {
    fetch(`${API_DOCTOR}/public`)
      .then(r => r.json())
      .then(data => {
        setDoctors(data.success ? data.data : []);
        setLoadingDoctors(false);
      })
      .catch(() => setLoadingDoctors(false));
  }, []);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay   = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const isDisabled = (day) => {
    if (!selectedDoctor) return true;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    if (d.getDay() === 5) return true; // clinic closed on Fridays
    return false;
  };

  const handleDateSelect = async (day) => {
    if (isDisabled(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setSelectedTime('');

    // Bug 12: Fetch available slots dynamically
    if (!selectedDoctor) return;
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      // Note: we use the new public doctor endpoint because patients don't have receptionist permissions
      const res = await fetch(`${API_DOCTOR}/${selectedDoctor._id}/available-slots?date=${dateStr}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setDynamicSlots(data.data);
      } else {
        setDynamicSlots([]);
      }
    } catch (e) {
      console.warn("Failed to fetch slots", e);
      setDynamicSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < getFirstDay(currentMonth); i++) days.push(<div key={`e${i}`} />);
    for (let day = 1; day <= getDaysInMonth(currentMonth); day++) {
      const disabled = isDisabled(day);
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const selected = selectedDate && date.toDateString() === selectedDate.toDateString();
      days.push(
        <button key={day} type="button" onClick={() => handleDateSelect(day)} disabled={disabled}
          className={`p-2 text-sm font-medium rounded-lg transition-all ${
            selected   ? 'bg-[#1d4ed8] text-white' :
            disabled   ? 'text-gray-300 bg-gray-50 cursor-not-allowed' :
                         'text-gray-700 border border-gray-200 hover:border-[#1d4ed8] bg-white'
          }`}
        >{day}</button>
      );
    }
    return days;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const patientId = localStorage.getItem('patientId');
      const token     = localStorage.getItem('token');

      const res = await fetch(`${API_PATIENTS}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          doctorId:        selectedDoctor._id,
          date:            selectedDate.toISOString(),
          timeSlot:        selectedTime,
          additionalNotes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setSuccessMsg(data.message);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime('');
      setNotes('');
      setCurrentMonth(new Date());
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Book an Appointment</h1>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleBooking} className="space-y-6">

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Doctor</label>
            {loadingDoctors ? (
              <p className="text-gray-400 text-sm">Loading doctors...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc) => (
                  <button key={doc._id} type="button"
                    onClick={() => { setSelectedDoctor(doc); setSelectedDate(null); setSelectedTime(''); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDoctor?._id === doc._id
                        ? 'border-[#1d4ed8] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.specialization || doc.specialty}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Date</label>
            {selectedDoctor ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{monthYear}</span>
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-500">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                {selectedDate && (
                  <p className="mt-3 text-sm text-gray-600 pt-3 border-t border-gray-200">
                    Selected: <span className="font-semibold">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                Please select a doctor first
              </div>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Time</label>
            {selectedDate ? (
              loadingSlots ? (
                <p className="text-gray-400 text-sm">Loading available times...</p>
              ) : dynamicSlots.length === 0 ? (
                <p className="text-gray-400 text-sm">No times available for this date.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {dynamicSlots.map((slot, idx) => {
                    const time = slot.startTime;
                    const isAvailable = slot.status === "available";
                    return (
                      <button key={idx} type="button" onClick={() => isAvailable && setSelectedTime(time)}
                        disabled={!isAvailable}
                        className={`p-3 rounded-lg font-medium text-sm border-2 transition-all ${
                          selectedTime === time
                            ? 'border-[#1d4ed8] bg-blue-50 text-[#1d4ed8]'
                            : isAvailable
                              ? 'border-gray-200 bg-white text-gray-700 hover:border-[#1d4ed8]'
                              : 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-50'
                        }`}
                      >{time}</button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                Please select a date first
              </div>
            )}
          </div>

          {/* Reason / Notes */}
          <ReasonSelector value={notes} onChange={setNotes} />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit"
              disabled={!selectedDoctor || !selectedDate || !selectedTime || submitting}
              className="flex-1 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
            <button type="button"
              onClick={() => { setSelectedDoctor(null); setSelectedDate(null); setSelectedTime(''); setNotes(''); setCurrentMonth(new Date()); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
