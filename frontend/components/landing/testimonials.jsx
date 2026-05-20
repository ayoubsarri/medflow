"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Mohamed Benali",
    role: "Chief Medical Officer",
    clinic: "Clinique Al Azhar, Zeralda",
    content:
      "MedFlow has transformed our daily operations. The appointment system has reduced no-shows by nearly 35%. Very practical for our team.",
    rating: 5,
  },
  {
    name: "Amina Boudiaf",
    role: "Administrative Manager",
    clinic: "Clinique En-Nahda, La Cote",
    content:
      "The analytics dashboard helps us better understand our patients. We have been able to improve our organization and patient satisfaction.",
    rating: 5,
  },
  {
    name: "Dr. Yasmine Kaci",
    role: "Pediatrician",
    clinic: "Clinique Les Sources, Birmandreis",
    content:
      "The patient portal really facilitates communication with families. Parents appreciate being able to access records and book appointments online.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-[#1d4ed8]/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold text-[#1d4ed8] uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Trusted by Healthcare Professionals
          </h2>
          <p className="text-gray-500 leading-relaxed">
            See what healthcare professionals are saying about their experience
            with MedFlow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100 relative hover:shadow-lg transition-shadow"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-[#1d4ed8]/10" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 leading-relaxed mb-6">
                &quot;{testimonial.content}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#1d4ed8]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1d4ed8] font-semibold text-lg">
                    {testimonial.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <p className="text-xs text-gray-400">{testimonial.clinic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
