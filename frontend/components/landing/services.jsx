"use client";

import {
  Building2,
  User,
  FileText,
  Heart,
  ClipboardList,
  Shield,
  Users,
  Calendar,
  Bell,
  Search,
} from "lucide-react";

const clinicFeatures = [
  {
    icon: FileText,
    title: "Digital Records",
    description: "Paperless patient records and prescriptions",
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Healthcare-compliant data protection",
  },
  {
    icon: Users,
    title: "Patient Management",
    description: "Complete patient database and profiles",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automated appointment management",
  },
];

const patientFeatures = [
  {
    icon: Heart,
    title: "Health History",
    description: "Access your complete medical records",
  },
  {
    icon: ClipboardList,
    title: "Prescriptions",
    description: "View and manage your prescriptions online",
  },
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Schedule appointments in just a few clicks",
  },
  {
    icon: Bell,
    title: "Reminders",
    description: "Never miss an appointment or medication",
  },
  {
    icon: Search,
    title: "Find Doctors",
    description: "Search and book appointments with specialists",
  },
];

export function Services() {
  return (
    <section id="services" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#1d4ed8]/10 text-[#1d4ed8] text-sm font-medium mb-4">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Healthcare Solutions
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Whether you are a healthcare provider or a patient, we have the tools
            to streamline your healthcare experience.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Clinic Management Card */}
          <div
            id="for-clinics"
            className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 hover:shadow-xl transition-shadow hover:border-[#1d4ed8]/30"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#1d4ed8]/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-[#1d4ed8]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Clinic Management
                </h3>
                <p className="text-gray-500">For Healthcare Providers</p>
              </div>
            </div>

            <p className="text-gray-500 mb-8 leading-relaxed">
              A complete suite of tools designed to streamline your clinic
              operations. Manage appointments, patient records, staff schedules,
              and billing all in one place.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {clinicFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1d4ed8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <feature.icon className="h-4 w-4 text-[#1d4ed8]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Portal Card */}
          <div
            id="patient-portal"
            className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 hover:shadow-xl transition-shadow hover:border-[#1d4ed8]/30"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="h-7 w-7 text-[#1d4ed8]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Patient Portal
                </h3>
                <p className="text-gray-500">For Patients</p>
              </div>
            </div>

            <p className="text-gray-500 mb-8 leading-relaxed">
              Take control of your healthcare journey. Book appointments, access
              your medical records, manage prescriptions, and connect with your
              healthcare providers easily.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {patientFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <feature.icon className="h-4 w-4 text-[#1d4ed8]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
