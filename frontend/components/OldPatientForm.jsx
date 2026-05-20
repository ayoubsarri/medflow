'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_PATIENTS } from '@/config/api';

export default function OldPatientForm() {
  const router = useRouter();
  const [fileNumber, setFileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!fileNumber.trim()) {
      setError('Please enter your file number');
      return;
    }

    setLoading(true);

    try {
      // Connects directly to your patient login endpoint
      const response = await fetch(`${API_PATIENTS}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileCode: fileNumber }) 
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store the JWT Token and Patient ID for the dashboard
        localStorage.setItem('token', data.token); 
        localStorage.setItem('patientId', data.patientId);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid file number.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="fileNumber" className="block text-sm font-medium text-gray-700 mb-2">
          File Number
        </label>
        <input
          id="fileNumber"
          type="text"
          value={fileNumber}
          onChange={(e) => {
            setFileNumber(e.target.value);
            setError('');
          }}
          placeholder="Enter your file number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1d4ed8] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
      >
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}