'use client';

import { useState } from 'react';
import { API_PATIENTS } from '@/config/api';

const FAQ = [
  {
    q: 'How do I book an appointment?',
    a: 'Click "Book Appointment" in the left sidebar. Select a doctor, pick an available date (Fridays are closed), choose a time slot, select your reason for visit, then click "Confirm Appointment". Your request will be reviewed and confirmed by reception.',
  },
  {
    q: 'How do I cancel an appointment?',
    a: 'Go to "My Appointments" on the dashboard. Find the appointment you want to cancel and click the Cancel button next to it. Cancellations take effect immediately.',
  },
  {
    q: 'What is my File Number?',
    a: 'Your File Number (e.g. P-2026-001) is your unique patient identifier. It is printed on your clinic documents and is the code you use to log into this portal. Keep it safe.',
  },
  {
    q: 'How do I view my past visits?',
    a: 'Click "Medical History" in the sidebar. You will see all your completed appointments with the doctor\'s name, date, and any notes recorded during the visit.',
  },
  {
    q: 'How do I upload a medical document?',
    a: 'Click "My Records" in the sidebar, then use the upload form to attach PDF, JPG, or PNG files. Documents you upload are visible to your doctor.',
  },
  {
    q: 'Can I update my phone number or email?',
    a: 'Yes. On this Settings page, click the "Edit" button, update your details, then click "Save". Your name and date of birth can only be changed by the reception desk.',
  },
  {
    q: 'I forgot my File Number. What should I do?',
    a: 'Contact the clinic reception desk. They can look up your file number using your name and date of birth and provide it to you.',
  },
  {
    q: 'Are my medical records private?',
    a: 'Yes. Only your assigned doctors and authorised clinic staff can access your records. Your data is stored securely and never shared with third parties.',
  },
];

export default function SettingsHelpContent({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  const [form, setForm] = useState({
    phone:            user?.phone            || '',
    email:            user?.email            || '',
    emergencyNumber:  user?.emergencyNumber  || '',
  });
  const [draft, setDraft] = useState(form);

  const [openFaq, setOpenFaq] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const token     = localStorage.getItem('token');
      const patientId = localStorage.getItem('patientId');
      const res = await fetch(`${API_PATIENTS}/profile/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error('Save failed');
      setForm(draft);
      setIsEditing(false);
      setSaveMsg('Profile updated successfully.');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : (user?.name || 'Patient');

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Settings &amp; Help</h1>

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 text-lg">Profile Information</h2>
          {!isEditing ? (
            <button onClick={() => { setDraft(form); setIsEditing(true); }}
              className="flex items-center gap-2 text-[#1d4ed8] hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? 'Saving...' : '✓ Save'}
              </button>
              <button onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                ✕ Cancel
              </button>
            </div>
          )}
        </div>

        {saveMsg && (
          <p className={`mb-4 text-sm px-4 py-2 rounded-lg ${saveMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {saveMsg}
          </p>
        )}

        {/* Avatar + name (read-only) */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">File No: #{user?.fileCode || '—'}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* DOB — read-only */}
          {user?.dateOfBirth && (
            <Field label="Date of Birth"
              value={new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              readOnly />
          )}

          {/* Phone */}
          <Field label="Phone Number" value={isEditing ? draft.phone : form.phone}
            readOnly={!isEditing}
            onChange={v => setDraft({ ...draft, phone: v })} />

          {/* Email */}
          <Field label="Email Address" value={isEditing ? draft.email : form.email}
            readOnly={!isEditing} type="email"
            onChange={v => setDraft({ ...draft, email: v })} />

          {/* Emergency */}
          <Field label="Emergency Contact" value={isEditing ? draft.emergencyNumber : form.emergencyNumber}
            readOnly={!isEditing}
            onChange={v => setDraft({ ...draft, emergencyNumber: v })} />
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-4 py-4 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <p className="text-center text-sm text-gray-400">
        Need more help? Contact the clinic at <span className="text-gray-600 font-medium">support@clinic.com</span>
      </p>
    </div>
  );
}

function Field({ label, value, readOnly, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-500 block mb-1">{label}</label>
      {readOnly ? (
        <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg text-sm min-h-[44px] flex items-center">
          {value || '—'}
        </p>
      ) : (
        <input type={type} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] bg-white text-gray-900" />
      )}
    </div>
  );
}
