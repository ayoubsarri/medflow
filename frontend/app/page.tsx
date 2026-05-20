import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Services } from '@/components/landing/services';
import { ClinicsCarousel } from '@/components/landing/clinics-carousel';
import { About } from '@/components/landing/about';
import { Testimonials } from '@/components/landing/testimonials';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'MedFlow — Modern Clinic Management System',
  description:
    'Streamline your clinic operations with MedFlow. From appointment scheduling to patient records, everything you need to deliver exceptional healthcare.',
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <ClinicsCarousel />
      <Services />
      <About />
      <Testimonials />
      <Footer />
    </main>
  );
}
