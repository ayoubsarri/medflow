'use client';
import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function OldRecordsContent({ onNotify }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fileName: '', fileType: '', fileUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_PATIENTS}/records`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : data.oldRecords || []);
    } catch (e) {
      console.error('Failed to fetch records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!form.fileName.trim()) { setFormError('File name is required'); return; }
    if (!form.fileUrl.trim()) { setFormError('File URL is required'); return; }

    const patientId = localStorage.getItem('patientId');
    if (!patientId) { setFormError('Session expired. Please log in again.'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`${API_PATIENTS}/records/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Upload failed');
      setShowModal(false);
      setForm({ fileName: '', fileType: '', fileUrl: '' });
      await fetchRecords();
      if (onNotify) onNotify('File added successfully');
    } catch (err) {
      setFormError('Could not add file. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Old Records</h1>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg transition-colors font-medium"
        >
          + Add File
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No records yet</p>
          <p className="text-sm mt-1">Click "Add File" to upload your first record.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, idx) => (
            <div key={record._id || idx} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{record.fileName || record.name}</h3>
                {record.fileType && <p className="text-xs text-[#1d4ed8] font-medium mt-0.5">{record.fileType}</p>}
                <p className="text-sm text-gray-500">{record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : ''}</p>
              </div>
              {record.fileUrl && (
                <a
                  href={record.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1d4ed8] hover:underline font-medium"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add File Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Medical Record</h2>
            <form onSubmit={handleAddFile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fileName}
                  onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))}
                  placeholder="e.g. Blood Test Results 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  value={form.fileType}
                  onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                >
                  <option value="">Select type</option>
                  <option value="Lab Results">Lab Results</option>
                  <option value="Imaging">Imaging (X-ray / MRI / CT)</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Consultation Report">Consultation Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                />
                <p className="text-xs text-gray-400 mt-1">Paste a link to your file (Google Drive, Dropbox, etc.)</p>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}