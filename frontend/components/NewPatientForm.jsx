'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CalendarPicker from './CalendarPicker';
import TimeSlotSelector from './TimeSlotSelector';
import { API_PATIENTS, API_DOCTOR } from '@/config/api';
import ReasonSelector from './ReasonSelector';

export default function NewPatientForm() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  useEffect(() => {
    fetch(`${API_DOCTOR}/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.doctors || data?.data || []);
        setDoctors(Array.isArray(list) ? list : []);
      })
      .catch(() => setDoctors([]));
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableTimeSlots([]);
      return;
    }
    
    fetch(`${API_DOCTOR}/${selectedDoctor}/available-slots?date=${selectedDate}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(data => {
        const slotsObj = data.data || [];
        const slots = slotsObj.filter(s => s.status === 'available').map(s => s.startTime);
        setAvailableTimeSlots(slots);
      })
      .catch(err => {
        console.error('Failed to fetch available slots:', err);
        setAvailableTimeSlots([]);
      });
  }, [selectedDoctor, selectedDate]);

  const validate = () => {
    const errs = {};
    if (!selectedDoctor) errs.doctor = 'Please select a doctor';
    if (!selectedDate)   errs.date   = 'Please select a date';
    if (!selectedTime)   errs.time   = 'Please select a time slot';
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await fetch(`${API_PATIENTS}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email,
          phone: phoneNumber,
          additionalNotes,
          doctorId: selectedDoctor,
          date: selectedDate,
          timeSlot: selectedTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Appointment requested successfully! You will be contacted for confirmation.');
        router.push('/');
      } else {
        setError(data.message || data.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Request error:', err);
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requiredStar = <span className="text-red-500 ml-0.5">*</span>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Doctor Selection */}
      <div>
        <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
          Select Doctor {requiredStar}
        </label>
        <select
          id="doctor"
          value={selectedDoctor}
          onChange={(e) => {
            setSelectedDoctor(e.target.value);
            setSelectedDate('');
            setSelectedTime('');
            setFieldErrors(prev => ({ ...prev, doctor: '' }));
          }}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1d4ed8] bg-white outline-none ${
            fieldErrors.doctor ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Choose a doctor...</option>
          {doctors.map((doctor) => (
            <option key={doctor._id} value={doctor._id}>
              {doctor.name} • {doctor.specialty || doctor.specialization}
            </option>
          ))}
        </select>
        {fieldErrors.doctor && <p className="mt-1 text-xs text-red-500">{fieldErrors.doctor}</p>}
      </div>

      {/* Date Picker */}
      {selectedDoctor && (
        <div>
          <CalendarPicker
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedTime('');
              setFieldErrors(prev => ({ ...prev, date: '' }));
            }}
          />
          {fieldErrors.date && <p className="mt-1 text-xs text-red-500">{fieldErrors.date}</p>}
        </div>
      )}

      {/* Time Slot */}
      {selectedDate && (
        <div>
          <TimeSlotSelector
            selectedTime={selectedTime}
            timeSlots={availableTimeSlots}
            onSelectTime={(t) => {
              setSelectedTime(t);
              setFieldErrors(prev => ({ ...prev, time: '' }));
            }}
          />
          {fieldErrors.time && <p className="mt-1 text-xs text-red-500">{fieldErrors.time}</p>}
        </div>
      )}

      {/* Personal Info — always visible so user knows what's needed */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <p className="text-xs text-gray-400">
          Fields marked <span className="text-red-500">*</span> are required.
        </p>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name {requiredStar}
          </label>
          <input
            type="text"
            placeholder="e.g. Ahmed Benali"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setFieldErrors(prev => ({ ...prev, fullName: '' }));
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              fieldErrors.fullName ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {fieldErrors.fullName && <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="e.g. ahmed@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="e.g. 0550 12 34 56"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Reason */}
        <ReasonSelector value={additionalNotes} onChange={setAdditionalNotes} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request Appointment'}
      </button>
    </form>
  );
}
