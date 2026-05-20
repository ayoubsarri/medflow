/**
 * =============================================================================
 * DOCTOR LAYOUT
 * =============================================================================
 * 
 * PURPOSE:
 * Main layout wrapper for all doctor pages. Contains sidebar and main content area.
 * Simple header without role badge or dark mode toggle (removed per request).
 * 
 * STRUCTURE:
 * - Sidebar on the left (from DoctorSidebar component)
 * - Main content area on the right
 * - Mobile: bottom padding for mobile nav
 * 
 * =============================================================================
 */

"use client";

import DoctorSidebar from "@/components/doctor/Sidebar";

export default function DoctorLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - contains profile info now */}
      <DoctorSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pb-0 pb-16">
        {/* Main content - children pages */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
