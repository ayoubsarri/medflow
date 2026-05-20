/**
 * =============================================================================
 * ADMIN SIDEBAR COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * Navigation sidebar for the admin dashboard. Provides links to all
 * admin-related pages with logout functionality.
 * 
 * FEATURES:
 * - Desktop: Fixed sidebar on the left with full navigation labels
 * - Mobile: Bottom navigation bar showing all items
 * - Green (emerald) color scheme
 * - Logout link to return to login page
 * - NO role switch (admin cannot switch to other roles)
 * 
 * =============================================================================
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  ScrollText,
  LogOut,
} from "lucide-react";

// -----------------------------------------------------------------------------
// NAVIGATION CONFIGURATION
// -----------------------------------------------------------------------------
const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/staff", label: "Staff Management", icon: Users },
  { href: "/admin/reports", label: "System Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* =====================================================================
          DESKTOP SIDEBAR
          ===================================================================== */}
      <aside className="hidden md:flex bg-card text-foreground border-r border-border flex-col h-screen sticky top-0 w-56">
        
        {/* Logo Section */}
        <div className="p-4 border-b border-border">
          <h1 className="font-bold text-lg text-emerald-600">MedClinic</h1>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
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
                    ? "bg-emerald-100 text-emerald-700 font-medium dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-border">
          <Link
            href="/login"
            aria-label="Logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full min-h-[44px]"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
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
