/**
 * =============================================================================
 * DOCTOR SIDEBAR COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * Navigation sidebar for the doctor dashboard. Shows doctor profile picture
 * and name at the top.
 * 
 * FEATURES:
 * - Desktop: Fixed sidebar on the left with full navigation labels
 * - Mobile: Bottom navigation bar showing first 5 items
 * - Green color scheme for active/hover states
 * - Direct "Switch to Admin" button in purple (no dropdown)
 * - Logout link to return to login page
 * 
 * =============================================================================
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  HelpCircle,
  LogOut,
  FileCheck,
  ShieldCheck,
} from "lucide-react";

// Navigation configuration - includes Justifications page
const navItems = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/schedule", label: "Schedule", icon: Calendar },
  { href: "/doctor/patients", label: "My Patients", icon: Users },
  { href: "/doctor/justifications", label: "Justifications", icon: FileCheck },
  { href: "/doctor/messages", label: "Messages", icon: MessageSquare },
  { href: "/doctor/settings", label: "Help & Settings", icon: HelpCircle },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Direct switch to admin (no dropdown)
  const handleSwitchToAdmin = () => {
    router.push("/admin/dashboard");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex bg-card text-foreground border-r border-border flex-col h-screen sticky top-0 w-56">
        
        {/* Doctor Profile Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d4ed8] to-emerald-500 flex items-center justify-center text-white text-lg font-bold">
              AN
            </div>
            <div>
              <h2 className="font-bold text-foreground">Dr. Ahmed Nouar</h2>
              <p className="text-xs text-muted-foreground">General Medicine</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Switch to Admin Button - Direct, Purple */}
        <div className="p-2 border-t border-border">
          <button
            onClick={handleSwitchToAdmin}
            aria-label="Switch to Admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full min-h-[44px] bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Switch to Admin</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="p-2 border-t border-border">
          <Link
            href="/login"
            aria-label="Logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 w-full min-h-[44px]"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg min-w-[50px] ${
                  isActive ? "text-emerald-600" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
