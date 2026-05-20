"use client";

/**
 * =============================================================================
 * ADMIN LAYOUT
 * =============================================================================
 * 
 * PURPOSE:
 * Main layout wrapper for all admin pages. Contains sidebar and main content.
 * Welcome message only appears on dashboard page, not globally in header.
 * No dark mode toggle - system stays in light mode.
 * 
 * =============================================================================
 */

import AdminSidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        {/* Main Content - no header, welcome message is in dashboard page only */}
        <main className="flex-1 p-4 pb-20 md:pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
