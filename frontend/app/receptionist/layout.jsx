/**
 * =============================================================================
 * RECEPTIONIST LAYOUT
 * =============================================================================
 * 
 * PURPOSE:
 * Root layout for all receptionist pages. No dark mode toggle - stays light mode.
 * 
 * =============================================================================
 */

import Sidebar from "@/components/receptionist/Sidebar";

export const metadata = {
  title: "Clinic Management System",
  description: "Medical clinic management system",
};

export default function ReceptionistLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        {/* Header - no dark mode toggle */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <h1 className="font-semibold text-lg text-foreground">
            Welcome, <span className="text-emerald-600">Sarah</span>
          </h1>
        </header>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
