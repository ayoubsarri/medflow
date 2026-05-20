"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = {
  quickLinks: [
    { label: "Services", href: "#services" },
    { label: "Our Clinics", href: "#clinics" },
    { label: "About Us", href: "#about" },
    { label: "Testimonials", href: "#testimonials" },
  ],
  portals: [
    { label: "Staff Login", href: "/login" },
    { label: "Patient Access", href: "/patient-access" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">MedFlow</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              Modern healthcare management solutions for clinics of all sizes.
              Streamline operations and enhance patient care.
            </p>

            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-[#1d4ed8] flex-shrink-0" />
                <span>123 Rue Didouche Mourad, Alger Centre, Algeria</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-[#1d4ed8] flex-shrink-0" />
                <span>+213 21 XX XX XX</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-[#1d4ed8] flex-shrink-0" />
                <span>contact@citymed.dz</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#1d4ed8] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="font-semibold text-white mb-4">Access Portals</h3>
            <ul className="space-y-2.5">
              {footerLinks.portals.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#1d4ed8] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#1d4ed8] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} MedFlow. All rights reserved.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#1d4ed8]/80 text-gray-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
