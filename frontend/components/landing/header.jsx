"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, User } from "lucide-react";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#clinics", label: "Our Clinics" },
  { href: "#about", label: "About Us" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 shadow-sm">
      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              MedFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1d4ed8] transition-colors rounded-lg hover:bg-blue-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-lg transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Staff Login
            </Link>
            <Link
              href="/patient-access"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-[#1d4ed8] hover:bg-blue-50 rounded-lg transition-colors"
            >
              <User className="h-4 w-4" />
              Patient Access
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                Staff Login
              </Link>
              <Link
                href="/patient-access"
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] border border-[#1d4ed8] hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Patient Access
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
