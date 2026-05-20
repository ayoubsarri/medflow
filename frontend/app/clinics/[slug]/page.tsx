import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { clinics } from "@/lib/clinics-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  CheckCircle,
  Building2,
  ExternalLink,
} from "lucide-react";

export async function generateStaticParams() {
  return clinics.map((clinic) => ({
    slug: clinic.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clinic = clinics.find((c) => c.slug === slug);

  if (!clinic) {
    return {
      title: "Clinic Not Found",
    };
  }

  return {
    title: `${clinic.name} | MediCare Pro`,
    description: clinic.description,
  };
}

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clinic = clinics.find((c) => c.slug === slug);

  if (!clinic) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/#clinics" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Clinics
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-64 md:h-80 lg:h-96">
        <Image
          src={clinic.image}
          alt={clinic.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-foreground">
                  {clinic.rating}
                </span>
              </div>
              <div className="flex gap-2">
                {clinic.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 bg-primary/90 text-primary-foreground text-sm font-medium rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {clinic.name}
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  About This Clinic
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {clinic.description}
                </p>
              </div>

              {/* Services */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Services Offered
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {clinic.services.map((service) => (
                    <div
                      key={service}
                      className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg"
                    >
                      <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                      <span className="text-foreground font-medium">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Location
                </h2>

                {/* Google Maps embed — uses address as search query, no API key needed */}
                <div className="w-full h-72 rounded-xl overflow-hidden border border-border shadow-sm">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(clinic.address)}&output=embed&z=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map showing location of ${clinic.name}`}
                  />
                </div>

                {/* Address + open-in-maps link */}
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{clinic.address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Card */}
            <div className="lg:col-span-1">
              <Card
                id="contact-clinic"
                className="sticky top-24 border-border shadow-lg"
              >
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Contact Information
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Get in touch with us
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {clinic.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Phone</p>
                        <a
                          href={`tel:${clinic.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {clinic.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <a
                          href={`mailto:${clinic.email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {clinic.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          Working Hours
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {clinic.hours}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`tel:${clinic.phone}`}>
                        <Phone className="h-4 w-4 mr-2" /> Call Now
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="h-4 w-4 mr-2" /> Get Directions
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
