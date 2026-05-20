'use client';

import { useState, useEffect } from 'react';

export default function Notification({ message, type = 'success' }) {
  const [isVisible, setIsVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isVisible || !message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-[#1d4ed8]';
  const icon = type === 'success' ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ) : type === 'error' ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
      {icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
