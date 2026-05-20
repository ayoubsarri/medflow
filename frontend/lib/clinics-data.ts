export interface Clinic {
  id: number;
  slug: string;
  name: string;
  location: string;
  rating: number;
  specialties: string[];
  image: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  description: string;
  services: string[];
}

export const clinics: Clinic[] = [
  {
    id: 1,
    slug: "centre-medical-alger",
    name: "Centre Medical Alger",
    location: "Alger Centre, Algiers",
    rating: 4.9,
    specialties: ["General Practice", "Cardiology"],
    image: "/images/clinic-1.jpg",
    phone: "+213 21 XX XX XX",
    email: "contact@cma-alger.dz",
    address: "123 Rue Didouche Mourad, Alger Centre, 16000 Algiers",
    hours: "Sat - Thu: 8:00 AM - 6:00 PM",
    description:
      "Centre Medical Alger is a leading healthcare facility in the heart of Algiers, offering comprehensive medical services with state-of-the-art equipment and experienced healthcare professionals.",
    services: [
      "General Consultations",
      "Cardiology",
      "Laboratory Tests",
      "ECG & Cardiac Monitoring",
      "Health Check-ups",
    ],
  },
  {
    id: 2,
    slug: "clinique-famille-oran",
    name: "Clinique Famille Oran",
    location: "Oran, Algeria",
    rating: 4.8,
    specialties: ["Pediatrics", "Family Medicine"],
    image: "/images/clinic-2.jpg",
    phone: "+213 41 XX XX XX",
    email: "contact@famille-oran.dz",
    address: "45 Boulevard de l'ALN, Oran, 31000",
    hours: "Sat - Thu: 8:00 AM - 7:00 PM",
    description:
      "Clinique Famille Oran specializes in pediatric and family medicine, providing compassionate care for patients of all ages in a warm, welcoming environment.",
    services: [
      "Pediatric Care",
      "Family Medicine",
      "Vaccinations",
      "Child Development",
      "Prenatal Care",
    ],
  },
  {
    id: 3,
    slug: "dental-care-constantine",
    name: "Dental Care Constantine",
    location: "Constantine, Algeria",
    rating: 4.9,
    specialties: ["Dentistry", "Orthodontics"],
    image: "/images/clinic-3.jpg",
    phone: "+213 31 XX XX XX",
    email: "contact@dental-constantine.dz",
    address: "78 Avenue Zighoud Youcef, Constantine, 25000",
    hours: "Sat - Thu: 9:00 AM - 5:00 PM",
    description:
      "Dental Care Constantine offers comprehensive dental services including orthodontics, cosmetic dentistry, and preventive care using the latest dental technology.",
    services: [
      "General Dentistry",
      "Orthodontics",
      "Teeth Whitening",
      "Dental Implants",
      "Pediatric Dentistry",
    ],
  },
  {
    id: 4,
    slug: "centre-vision-annaba",
    name: "Centre Vision Annaba",
    location: "Annaba, Algeria",
    rating: 4.7,
    specialties: ["Ophthalmology", "Optometry"],
    image: "/images/clinic-4.jpg",
    phone: "+213 38 XX XX XX",
    email: "contact@vision-annaba.dz",
    address: "12 Rue Ibn Khaldoun, Annaba, 23000",
    hours: "Sat - Thu: 8:30 AM - 5:30 PM",
    description:
      "Centre Vision Annaba is dedicated to eye health, offering comprehensive eye examinations, vision correction, and treatment for various eye conditions.",
    services: [
      "Eye Examinations",
      "Vision Correction",
      "Cataract Surgery",
      "Glaucoma Treatment",
      "Contact Lenses",
    ],
  },
  {
    id: 5,
    slug: "wellness-center-blida",
    name: "Wellness Center Blida",
    location: "Blida, Algeria",
    rating: 4.8,
    specialties: ["Internal Medicine", "Nutrition"],
    image: "/images/clinic-5.jpg",
    phone: "+213 25 XX XX XX",
    email: "contact@wellness-blida.dz",
    address: "34 Avenue de l'Independance, Blida, 09000",
    hours: "Sat - Thu: 8:00 AM - 6:00 PM",
    description:
      "Wellness Center Blida focuses on preventive medicine and holistic health, helping patients achieve optimal wellness through personalized care plans.",
    services: [
      "Internal Medicine",
      "Nutrition Counseling",
      "Health Screenings",
      "Chronic Disease Management",
      "Wellness Programs",
    ],
  },
  {
    id: 6,
    slug: "urgences-medicales-setif",
    name: "Urgences Medicales Setif",
    location: "Setif, Algeria",
    rating: 4.6,
    specialties: ["Emergency", "Walk-in Care"],
    image: "/images/clinic-6.jpg",
    phone: "+213 36 XX XX XX",
    email: "contact@urgences-setif.dz",
    address: "56 Boulevard 8 Mai 1945, Setif, 19000",
    hours: "Open 24/7",
    description:
      "Urgences Medicales Setif provides round-the-clock emergency and urgent care services, ensuring quick access to quality medical attention when you need it most.",
    services: [
      "Emergency Care",
      "Urgent Care",
      "Minor Surgery",
      "X-Ray Services",
      "Laboratory Tests",
    ],
  },
];
