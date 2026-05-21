'use client';
import React, { useState, useEffect } from 'react';

/**
 * =============================================================================
 * ADMIN STAFF MANAGEMENT PAGE — frontend/app/admin/staff/page.jsx
 * =============================================================================
 *
 * FEATURES:
 * - Table with clickable rows to view staff profile
 * - Add, Delete, Enable/Disable staff
 * - [NEW] Clock icon button opens the Working Hours Scheduler for doctors
 *
 * SCHEDULING MODAL LOGIC (Student Defense Note):
 * The algorithm runs entirely on the frontend for instant interactivity.
 * Formula:
 *   slotEnd       = slotStart + slotDuration
 *   nextSlotStart = slotEnd   + restInterval
 * The loop stops when (currentMinutes + slotDuration) > shiftEndMinutes,
 * guaranteeing no slot ever overflows past the working day.
 * =============================================================================
 */

import { UserPlus, X, Trash2, Clock } from 'lucide-react';
import { API_ADMIN } from '@/config/api';
import apiFetch from '@/utils/apiFetch';

// ─── SCHEDULING ALGORITHM (runs in the browser) ──────────────────────────────
/**
 * generateSlots — builds the array of time cards from config values.
 *
 * STUDENT DEFENSE NOTE:
 * We convert all times to "minutes since midnight" (a plain integer) so we can
 * do simple addition. "08:30" → 8×60+30 = 510. This avoids complex string
 * manipulation and makes the loop trivially simple.
 *
 * The WHILE guard `current + slotDuration <= endMins` is the key safety check:
 * if adding one more slot would exceed the shift end, we stop immediately.
 *
 * @param {string} shiftStart   - e.g. "08:00"
 * @param {string} shiftEnd     - e.g. "17:00"
 * @param {number} slotDuration - minutes, e.g. 30
 * @param {number} restInterval - minutes, e.g. 5
 * @returns {Array} slots - [{ startTime, endTime, status: 'available' }]
 */
function generateSlots(shiftStart, shiftEnd, slotDuration, restInterval) {
  // Convert "HH:MM" string to total minutes (integer)
  const toMins = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Convert total minutes back to "HH:MM" string
  const toTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const slots   = [];
  let   current = toMins(shiftStart);
  const endMins = toMins(shiftEnd);

  // THE CORE ALGORITHM LOOP
  // Keep creating slots while a full slot still fits before shift end.
  while (current + slotDuration <= endMins) {
    const slotEnd = current + slotDuration; // e.g. 480 + 30 = 510

    slots.push({
      startTime: toTime(current),   // e.g. "08:00"
      endTime:   toTime(slotEnd),   // e.g. "08:30"
      status:    'available'        // default — admin can toggle to 'blocked'
    });

    // Move forward by slotDuration + restInterval before the next slot.
    // e.g. 510 + 5 = 515 → next slot starts at "08:35"
    current = slotEnd + restInterval;
  }

  return slots;
}


// ─── SCHEDULE MODAL COMPONENT ────────────────────────────────────────────────
/**
 * ScheduleModal — the Working Hours configuration popup.
 *
 * Props:
 *   doctor     - the staff object being configured
 *   onClose    - function to close the modal
 *   onSave     - function called after a successful save (refreshes the list)
 *   showToast  - shared toast notification function
 */
function ScheduleModal({ doctor, onClose, onSave, showToast }) {
  // Config controls
  const [slotDuration,  setSlotDuration]  = useState(30);
  const [restInterval,  setRestInterval]  = useState(5);
  const [shiftStart,    setShiftStart]    = useState('08:00');
  const [shiftEnd,      setShiftEnd]      = useState('17:00');
  const [workingDays,   setWorkingDays]   = useState({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: false, Sat: false, Sun: false
  });

  // The generated time cards grid
  const [slots,   setSlots]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Load existing schedule on open ─────────────────────────────────────────
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res  = await apiFetch(`${API_ADMIN}/staff/${doctor._id}/schedule`);
        const data = await res.json();

        if (data.schedule && data.schedule.availableSlots?.length > 0) {
          // Pre-populate from saved values
          setSlotDuration(data.schedule.slotDuration  || 30);
          setRestInterval(data.schedule.restInterval  || 5);
          setShiftStart(  data.schedule.shiftStart    || '08:00');
          setShiftEnd(    data.schedule.shiftEnd      || '17:00');
          setSlots(data.schedule.availableSlots);
        }
        
        // Populate working days if available, otherwise default
        const daysArray = data.workingDays ? data.workingDays.split(',').map(d => d.trim()) : ['Mon', 'Tue', 'Wed', 'Thu'];
        setWorkingDays({
          Mon: daysArray.includes('Mon'),
          Tue: daysArray.includes('Tue'),
          Wed: daysArray.includes('Wed'),
          Thu: daysArray.includes('Thu'),
          Fri: daysArray.includes('Fri'),
          Sat: daysArray.includes('Sat'),
          Sun: daysArray.includes('Sun'),
        });
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [doctor._id]);

  // ── Generate the slot grid from current config ──────────────────────────────
  const handleGenerate = () => {
    if (!shiftStart || !shiftEnd || shiftStart >= shiftEnd) {
      showToast('Shift start must be before shift end', 'error');
      return;
    }
    const generated = generateSlots(shiftStart, shiftEnd, slotDuration, restInterval);
    if (generated.length === 0) {
      showToast('No slots fit in this time range. Try a shorter duration.', 'error');
      return;
    }
    setSlots(generated);
    showToast(`${generated.length} time slots generated`, 'success');
  };

  // ── Toggle a single card between available ↔ blocked ───────────────────────
  /**
   * STUDENT DEFENSE NOTE — IMMUTABLE STATE UPDATE:
   * We never mutate the `slots` array directly. Instead, we use `.map()` to
   * create a BRAND NEW array where only the clicked index is changed.
   * React requires this to detect the change and re-render the grid.
   */
  const toggleSlot = (index) => {
    setSlots(prev =>
      prev.map((slot, i) =>
        i === index
          ? { ...slot, status: slot.status === 'available' ? 'blocked' : 'available' }
          : slot
      )
    );
  };

  // ── Save to backend ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (slots.length === 0) {
      showToast('Please generate slots first', 'error');
      return;
    }
    
    const daysString = Object.entries(workingDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => day)
      .join(', ');

    try {
      setSaving(true);
      const res = await apiFetch(`${API_ADMIN}/staff/${doctor._id}/schedule`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slotDuration, restInterval, shiftStart, shiftEnd, slots, workingDays: daysString })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Save failed');
      }
      showToast(`Schedule saved for ${doctor.name}`, 'success');
      onSave();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const availableCount = slots.filter(s => s.status === 'available').length;
  const blockedCount   = slots.filter(s => s.status === 'blocked').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl shadow-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1d4ed8]" />
            <div>
              <h2 className="font-semibold text-foreground">Working Hours</h2>
              <p className="text-xs text-muted-foreground">{doctor.name} · {doctor.role}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Configuration Section ──────────────────────────────────────── */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Schedule Configuration</h3>
            
            {/* Working Days Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-foreground mb-2">
                Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <label key={day} className={`flex items-center justify-center px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-colors ${workingDays[day] ? 'bg-[#1d4ed8] border-[#1d4ed8] text-white' : 'bg-background border-border text-foreground hover:bg-muted'}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={workingDays[day]}
                      onChange={(e) => setWorkingDays(prev => ({ ...prev, [day]: e.target.checked }))}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">

              {/* Slot Duration */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Slot Duration (mins)
                </label>
                <select
                  value={slotDuration}
                  onChange={e => setSlotDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={40}>40 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>

              {/* Rest Interval */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Rest Interval (mins)
                </label>
                <select
                  value={restInterval}
                  onChange={e => setRestInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value={0}>0 min (no break)</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                </select>
              </div>

            {/* Shift Start */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              {/* Shift End */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Shift End
                </label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="mt-3 w-full px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Generate Time Slots
            </button>
          </div>

          {/* ── Slot Grid ─────────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : slots.length > 0 ? (
            <>
              {/* Legend + counter */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Click a card to toggle it. <span className="font-medium">{slots.length} total slots</span>
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    {availableCount} available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-400 inline-block" />
                    {blockedCount} blocked
                  </span>
                </div>
              </div>

              {/* Time cards grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot, idx) => {
                  const isAvailable = slot.status === 'available';
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSlot(idx)}
                      title={isAvailable ? 'Click to block this slot' : 'Click to make available'}
                      className={`
                        p-2 rounded-lg border-2 text-center text-xs font-medium
                        transition-all duration-150 cursor-pointer select-none
                        ${isAvailable
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                        }
                      `}
                    >
                      <div className="font-bold">{slot.startTime}</div>
                      <div className="text-[10px] opacity-70">↓</div>
                      <div>{slot.endTime}</div>
                      <div className={`text-[9px] mt-0.5 uppercase tracking-wide font-semibold ${isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isAvailable ? '✓ Open' : '✕ Blocked'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Configure the settings above and click <strong>Generate Time Slots</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg min-h-[40px] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || slots.length === 0}
            className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg min-h-[40px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────────────
export default function StaffManagement() {
  const [staff,            setStaff]            = useState([]);
  const [showAddModal,     setShowAddModal]      = useState(false);
  const [showProfileModal, setShowProfileModal]  = useState(false);
  const [showScheduleModal,setShowScheduleModal] = useState(false);
  const [selectedStaff,    setSelectedStaff]     = useState(null);
  const [scheduleDoctor,   setScheduleDoctor]    = useState(null);
  const [toasts,           setToasts]            = useState([]);

  const [newStaff, setNewStaff] = useState({
    name: '', email: '', role: 'Receptionist',
    phone: '', dob: '', emergencyContact: '',
    workingHours: '08:00 - 18:00', workingDays: 'Mon, Tue, Wed, Thu'
  });

  // ── Load all staff on mount ─────────────────────────────────────────────────
  useEffect(() => {
    apiFetch(`${API_ADMIN}/staff`)
      .then(res => res.json())
      .then(data => setStaff(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load staff:', err));
  }, []);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // ── Add staff ──────────────────────────────────────────────────────────────
  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.phone) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      const res  = await apiFetch(`${API_ADMIN}/add-staff`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...newStaff, isAdmin: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add staff');
      setStaff([...staff, data]);
      setNewStaff({ name: '', email: '', role: 'Receptionist', phone: '', dob: '', emergencyContact: '', workingHours: '08:00 - 18:00', workingDays: 'Mon, Tue, Wed, Thu' });
      setShowAddModal(false);
      showToast('Staff member added successfully');
    } catch (err) { showToast(err.message, 'error'); }
  };

  // ── Toggle status ──────────────────────────────────────────────────────────
  const toggleStatus = async (id, e) => {
    e.stopPropagation();
    const member = staff.find(s => s._id === id);
    if (member?.isAdmin) { showToast('Cannot disable admin account', 'error'); return; }
    try {
      const res  = await apiFetch(`${API_ADMIN}/toggle-status/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setStaff(staff.map(s => s._id === id ? { ...s, status: data.status } : s));
      showToast(data.status === 'Suspended' ? 'Staff account suspended' : 'Staff account activated', data.status === 'Suspended' ? 'warning' : 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  // ── Delete staff ───────────────────────────────────────────────────────────
  const handleDeleteStaff = async (id, e) => {
    e.stopPropagation();
    const member = staff.find(s => s._id === id);
    if (member?.isAdmin) { showToast('Cannot delete admin account', 'error'); return; }
    if (!confirm(`Permanently delete ${member?.name}? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`${API_ADMIN}/delete-staff/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to delete'); }
      setStaff(staff.filter(s => s._id !== id));
      showToast('Staff member deleted', 'warning');
    } catch (err) { showToast(err.message, 'error'); }
  };

  // ── Open schedule modal ─────────────────────────────────────────────────────
  const handleOpenSchedule = (member, e) => {
    e.stopPropagation(); // prevent row click (profile modal) from also firing
    setScheduleDoctor(member);
    setShowScheduleModal(true);
  };

  // ── Helpers for doctor check ────────────────────────────────────────────────
  const isDoctor = (role) => role && role.toLowerCase().includes('doctor');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Add Staff"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg min-h-[44px] transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Working Hours</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((member) => (
                <tr
                  key={member._id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => { setSelectedStaff(member); setShowProfileModal(true); }}
                >
                  {/* Name */}
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d4ed8] to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        {member.name}
                        {member.isAdmin && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Admin</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">{member.role}</td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>

                  {/* Working Hours */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {member.isAdmin ? (
                      <span className="text-muted-foreground italic">N/A (Admin)</span>
                    ) : member.schedule?.availableSlots?.length > 0 ? (
                      <span className="text-emerald-600 font-medium text-xs">
                        {member.schedule.shiftStart}–{member.schedule.shiftEnd}
                        <span className="text-muted-foreground font-normal ml-1">
                          ({member.schedule.availableSlots.filter(s => s.status === 'available').length} slots)
                        </span>
                      </span>
                    ) : (
                      member.workingHours || '—'
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      member.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {!member.isAdmin && (
                        <>
                          {/* Working Hours / Scheduling — doctors only */}
                          {isDoctor(member.role) && (
                            <button
                              onClick={(e) => handleOpenSchedule(member, e)}
                              aria-label="Configure working hours"
                              title="Configure Working Hours"
                              className="p-1.5 text-[#1d4ed8] hover:bg-blue-100 rounded min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Enable / Disable */}
                          <button
                            onClick={(e) => toggleStatus(member._id, e)}
                            aria-label={member.status === 'Active' ? 'Disable staff' : 'Enable staff'}
                            className={`px-2 py-1.5 text-xs font-medium rounded min-h-[32px] transition-colors ${
                              member.status === 'Active'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            {member.status === 'Active' ? 'Disable' : 'Enable'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteStaff(member._id, e)}
                            aria-label="Delete staff member"
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {member.isAdmin && (
                        <span className="text-xs text-muted-foreground italic">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {staff.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No staff members yet. Click "Add Staff" to get started.
          </div>
        )}
      </div>

      {/* ── Staff Profile Modal ──────────────────────────────────────────────── */}
      {showProfileModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Staff Profile</h2>
              <button onClick={() => setShowProfileModal(false)} aria-label="Close modal" className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1d4ed8] to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedStaff.name}</h3>
                  <p className="text-muted-foreground">{selectedStaff.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${selectedStaff.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedStaff.status}
                    </span>
                    {selectedStaff.isAdmin && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">Admin</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{selectedStaff.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{selectedStaff.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium text-foreground">{selectedStaff.dob || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="text-sm font-medium text-foreground">{selectedStaff.emergencyContact || 'Not provided'}</p>
                  </div>
                </div>
                {!selectedStaff.isAdmin && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Working Hours</p>
                      <p className="text-sm font-medium text-foreground">{selectedStaff.workingHours || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Working Days</p>
                      <p className="text-sm font-medium text-foreground">{selectedStaff.workingDays || 'Not set'}</p>
                    </div>
                    {/* Show schedule summary if a schedule has been configured */}
                    {selectedStaff.schedule?.availableSlots?.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Scheduled Slots</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedStaff.schedule.shiftStart} – {selectedStaff.schedule.shiftEnd} ·{' '}
                          {selectedStaff.schedule.slotDuration}min slots ·{' '}
                          {selectedStaff.schedule.restInterval}min rest
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          {selectedStaff.schedule.availableSlots.filter(s => s.status === 'available').length} open /{' '}
                          {selectedStaff.schedule.availableSlots.length} total slots
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedStaff.joined ? new Date(selectedStaff.joined).toLocaleDateString('en-GB') : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setShowProfileModal(false)} className="w-full px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg min-h-[44px]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Add New Staff</h2>
              <button onClick={() => setShowAddModal(false)} aria-label="Close modal" className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Enter full name' },
                { label: 'Email *', key: 'email', type: 'email', placeholder: 'Enter email' },
                { label: 'Phone Number *', key: 'phone', type: 'tel', placeholder: '+213 555 000000' },
                { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
                { label: 'Emergency Contact', key: 'emergencyContact', type: 'tel', placeholder: '+213 555 000000' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                  <input
                    type={type}
                    value={newStaff[key]}
                    onChange={e => setNewStaff({ ...newStaff, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white"
                >
                  <option value="Receptionist">Receptionist</option>
                  <option value="Gyneco Doctor">Gyneco Doctor</option>
                  <option value="Cardio Doctor">Cardio Doctor</option>
                  <option value="General Doctor">General Doctor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Working Hours</label>
                <input type="text" value={newStaff.workingHours} onChange={e => setNewStaff({ ...newStaff, workingHours: e.target.value })} placeholder="08:00 - 18:00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Working Days</label>
                <input type="text" value={newStaff.workingDays} onChange={e => setNewStaff({ ...newStaff, workingDays: e.target.value })} placeholder="Mon, Tue, Wed, Thu, Fri" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white" />
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg min-h-[44px] transition-colors">
                Cancel
              </button>
              <button onClick={handleAddStaff} className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-medium rounded-lg min-h-[44px] transition-colors">
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Modal ──────────────────────────────────────────────────── */}
      {showScheduleModal && scheduleDoctor && (
        <ScheduleModal
          doctor={scheduleDoctor}
          onClose={() => setShowScheduleModal(false)}
          onSave={() => {
            // Refresh the staff list so the Working Hours column updates
            apiFetch(`${API_ADMIN}/staff`)
              .then(res => res.json())
              .then(data => setStaff(Array.isArray(data) ? data : []))
              .catch(() => {});
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow text-white text-sm ${
              toast.type === 'success' ? 'bg-green-500'
              : toast.type === 'error'   ? 'bg-red-500'
              : toast.type === 'warning' ? 'bg-yellow-500'
              : 'bg-[#1d4ed8]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
