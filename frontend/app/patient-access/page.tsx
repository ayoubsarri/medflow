'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import OldPatientForm from '../../components/OldPatientForm';
import NewPatientForm from '../../components/NewPatientForm';

export default function PatientAccess() {
  const [isNewPatient, setIsNewPatient] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1d4ed8] transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Portal</h1>
          <p className="text-gray-600">Access your healthcare appointments</p>
        </div>

        {/* Toggle Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-center gap-8 relative">
            {/* Animated Indicator Background */}
            <div
              className={`absolute bottom-0 h-1 bg-[#1d4ed8] transition-all duration-300 ease-out ${
                isNewPatient ? 'left-1/2 w-1/2' : 'left-0 w-1/2'
              }`}
            />

            {/* Old Patient Option */}
            <button
              onClick={() => setIsNewPatient(false)}
              className={`pb-4 px-4 cursor-pointer transition-all duration-300 font-semibold text-base relative z-10 ${
                !isNewPatient
                  ? 'text-[#1d4ed8]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Existing Patient
            </button>

            {/* New Patient Option */}
            <button
              onClick={() => setIsNewPatient(true)}
              className={`pb-4 px-4 cursor-pointer transition-all duration-300 font-semibold text-base relative z-10 ${
                isNewPatient
                  ? 'text-[#1d4ed8]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              New Patient
            </button>
          </div>
        </div>

        {/* Form Section with Smooth Transition */}
        <div className="bg-white rounded-lg shadow-md p-8 animate-fade-in">
          {!isNewPatient ? <OldPatientForm /> : <NewPatientForm />}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact our support team at support@clinic.com</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
