"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Clock, ArrowRight } from "lucide-react";

const FEATURED_CLINIC = {
  slug: "centre-medical-alger",
  name: "Centre Medical Alger",
  location: "Alger Centre, Algiers",
  rating: 4.9,
  hours: "Sat - Thu: 8:00 AM - 6:00 PM",
  specialties: ["General Practice", "Cardiology"],
  image: "/images/clinic-1.jpg",
};

export function ClinicsCarousel() {
  return (
    <section id="clinics" className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-[#1d4ed8] uppercase tracking-wider">
            Our Network
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Our Healthcare Partners
          </h2>
          <p className="text-gray-500 leading-relaxed">
            We are expanding our network of partner clinics across Algeria.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Featured clinic — clickable */}
          <Link
            href={`/clinics/${FEATURED_CLINIC.slug}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200
                       hover:shadow-xl hover:border-[#1d4ed8]/40 hover:-translate-y-1
                       transition-all duration-300 flex flex-col cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <Image
                src={FEATURED_CLINIC.image}
                alt={FEATURED_CLINIC.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-gray-900">{FEATURED_CLINIC.rating}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1d4ed8] transition-colors duration-200">
                {FEATURED_CLINIC.name}
              </h3>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <MapPin className="h-4 w-4 text-[#1d4ed8] flex-shrink-0" />
                <span className="text-sm">{FEATURED_CLINIC.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Clock className="h-4 w-4 text-[#1d4ed8] flex-shrink-0" />
                <span className="text-sm">{FEATURED_CLINIC.hours}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {FEATURED_CLINIC.specialties.map((s) => (
                  <span key={s} className="px-2 py-1 bg-[#1d4ed8]/10 text-[#1d4ed8] text-xs font-semibold rounded-full">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Partner Clinic</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-[#1d4ed8] group-hover:gap-2 transition-all duration-200">
                  View Details <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Coming Soon #1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center min-h-80">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1d4ed8]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-[#1d4ed8]">+</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-500 text-sm">
                Expanding our partnership network across Algeria.
              </p>
            </div>
          </div>

          {/* Coming Soon #2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center min-h-80">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1d4ed8]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-[#1d4ed8]">+</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-500 text-sm">
                New partner clinics arriving soon.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
