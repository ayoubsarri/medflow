"use client";

export function About() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Section header */}
          <span className="text-sm font-semibold text-[#1d4ed8] uppercase tracking-wider">
            About Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-8">
            Transforming Healthcare Management
          </h2>

          {/* Story content */}
          <div className="space-y-6 text-gray-500 leading-relaxed text-lg">
            <p>
              MedFlow was founded with a simple yet powerful mission: to make
              healthcare administration effortless so providers can focus on what
              matters most — patient care. Our journey began when a group of
              healthcare professionals and technology experts came together,
              united by a shared frustration with outdated clinic management
              systems.
            </p>
            <p>
              We understood that healthcare providers spend countless hours on
              paperwork, appointment scheduling, and administrative tasks — time
              that could be better spent caring for patients. This insight drove
              us to create a platform that combines cutting-edge technology with
              intuitive design, delivering a solution that works seamlessly for
              clinics of all sizes.
            </p>
            <p>
              Today, MedFlow continues to evolve and improve our platform,
              always keeping our users and their patients at the heart of
              everything we do. We remain committed to innovation, security, and
              user experience.
            </p>
          </div>

          {/* Values grid */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { title: "Patient-First", desc: "Every decision centers on patient outcomes" },
              { title: "Secure", desc: "Healthcare-grade data protection always" },
              { title: "Simple", desc: "Powerful tools, zero complexity" },
            ].map((v) => (
              <div key={v.title} className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-[#1d4ed8]/10 flex items-center justify-center mx-auto mb-3">
                  <div className="w-3 h-3 rounded-full bg-[#1d4ed8]" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{v.title}</h4>
                <p className="text-xs text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
