'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CalendarPicker — shows a monthly calendar.
 * All future weekdays except Friday are selectable by default.
 * Pass `availableDates` (string[] YYYY-MM-DD) to restrict to specific dates only.
 */
export default function CalendarPicker({ selectedDate, onSelectDate, availableDates }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay   = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const fmt = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isSelectable = (day) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (d < today) return false;           // past
    if (d.getDay() === 5) return false;    // Friday closed
    if (availableDates && availableDates.length > 0) {
      return availableDates.includes(fmt(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    return true; // no restriction → all future non-Friday days open
  };

  const handlePrev = () => {
    const today = new Date();
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev.getFullYear() > today.getFullYear() ||
       (prev.getFullYear() === today.getFullYear() && prev.getMonth() >= today.getMonth())) {
      setCurrentMonth(prev);
    }
  };

  const handleNext = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay    = getFirstDay(currentMonth);
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Select Date</label>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={handlePrev}
            className="p-1 hover:bg-gray-200 rounded transition-colors" aria-label="Previous month">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900">{monthName}</h3>
          <button type="button" onClick={handleNext}
            className="p-1 hover:bg-gray-200 rounded transition-colors" aria-label="Next month">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className={`text-center text-xs font-semibold py-1 ${d === 'Fri' ? 'text-red-400' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ok = isSelectable(day);
            const dateStr = fmt(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = dateStr === selectedDate;
            return (
              <button key={i} type="button"
                onClick={() => ok && onSelectDate(dateStr)}
                disabled={!ok}
                className={`p-2 rounded text-sm font-medium transition-all ${
                  isSelected ? 'bg-[#1d4ed8] text-white' :
                  ok         ? 'bg-white border border-gray-300 text-gray-900 hover:bg-blue-50 hover:border-[#1d4ed8] cursor-pointer' :
                               'text-gray-300 cursor-not-allowed'
                }`}
              >{day}</button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">Fridays are closed. Select any other future date.</p>
      </div>
    </div>
  );
}
