'use client';

import { useState } from 'react';

const REASONS = [
  'General Check-up',
  'Follow-up Visit',
  'Prescription Renewal',
  'Blood Test / Lab Results',
  'Vaccination',
  'Chronic Disease Management',
  'Heart / Chest Issues',
  'Respiratory Problems',
  'Digestive Issues',
  'Back / Joint Pain',
  'Skin Issues',
  'Child Health (Pediatric)',
  'Eye / Vision Issues',
  'Headaches / Migraines',
  'Diabetes Monitoring',
  'Blood Pressure Monitoring',
  'Other',
];

/**
 * Multi-select reason chips + optional free-text for "Other".
 * Props:
 *   value    — current string value (joined reasons)
 *   onChange — called with the new string value whenever selection changes
 *   label    — optional label text (default "Reason for Visit")
 */
export default function ReasonSelector({ value = '', onChange, label = 'Reason for Visit' }) {
  // Derive selected set from the controlled value
  const selected = new Set(value ? value.split(' | ').map(s => s.trim()) : []);
  const [otherText, setOtherText] = useState(
    [...selected].find(s => !REASONS.includes(s) && s !== 'Other') || ''
  );

  const buildValue = (nextSelected, nextOther) => {
    const parts = [...nextSelected].filter(s => s !== 'Other');
    if (nextSelected.has('Other') && nextOther.trim()) {
      parts.push(nextOther.trim());
    }
    return parts.join(' | ');
  };

  const toggle = (reason) => {
    const next = new Set(selected);
    if (next.has(reason)) next.delete(reason);
    else next.add(reason);
    onChange(buildValue(next, otherText));
  };

  const handleOtherText = (text) => {
    setOtherText(text);
    onChange(buildValue(selected, text));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">{label}</label>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((reason) => {
          const active = selected.has(reason);
          return (
            <button
              key={reason}
              type="button"
              onClick={() => toggle(reason)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#1d4ed8] hover:text-[#1d4ed8]'
              }`}
            >
              {reason}
            </button>
          );
        })}
      </div>

      {selected.has('Other') && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => handleOtherText(e.target.value)}
          placeholder="Please describe..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
        />
      )}

      {selected.size > 0 && (
        <p className="text-xs text-gray-400">
          Selected: {buildValue(selected, otherText) || '—'}
        </p>
      )}
    </div>
  );
}
