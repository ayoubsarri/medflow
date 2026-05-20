"use client";

import Link from "next/link";
import { Building2, User, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-white min-h-screen flex items-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#1d4ed8]/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#1d4ed8]/5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1d4ed8]/10 text-[#1d4ed8] text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[#1d4ed8] animate-pulse" />
            Modern Healthcare Management System
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
            Healthcare
            <span className="text-[#1d4ed8] block mt-1">Management</span>
            <span className="text-gray-900">Made Simple</span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
Say goodbye to manual scheduling and long waiting times. Whether you're booking an appointment or managing clinic operations, our system makes healthcare coordination effortless.          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5"
            >
              <Building2 className="h-5 w-5" />
              Staff Login
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/patient-access"
              className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-[#1d4ed8] border-2 border-[#1d4ed8] hover:bg-blue-50 rounded-xl transition-all hover:-translate-y-0.5"
            >
              <User className="h-5 w-5" />
              Patient Access
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { value: "6+", label: "Partner Clinics" },
              { value: "500+", label: "Patients Served" },
              { value: "99.9%", label: "System Uptime" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-[#1d4ed8]">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
