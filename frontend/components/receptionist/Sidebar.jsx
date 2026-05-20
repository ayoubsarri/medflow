"use client";

/**
 * =============================================================================
 * RECEPTIONIST SIDEBAR COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * Navigation sidebar for receptionist with desktop/mobile responsive views.
 * Includes notification badge for new appointment requests.
 * 
 * =============================================================================
 */
import { useState, useEffect } from 'react';
import { API_RECEPTIONIST } from '@/config/api';
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  FileUp,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";

// Navigation items
const navItems = [
  { href: "/receptionist/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receptionist/appointments", label: "Appointments", icon: Calendar },
  { href: "/receptionist/requests", label: "New Requests", icon: Bell, hasBadge: true },
  { href: "/receptionist/patients", label: "Patients", icon: Users },
  { href: "/receptionist/queue", label: "Queue Manager", icon: ClipboardList },
  { href: "/receptionist/documents", label: "Documents", icon: FileUp },
  { href: "/receptionist/messages", label: "Messages", icon: MessageSquare },
  { href: "/receptionist/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
const [newRequestsCount, setNewRequestsCount] = useState(0);

useEffect(() => {
  const fetchPendingCount = async () => {
    try {
      const res = await fetch(`${API_RECEPTIONIST}/appointments`);
      const jsonResponse = await res.json();
      
      // Check if the array is inside the 'data' property
      const appointmentsArray = Array.isArray(jsonResponse.data) ? jsonResponse.data : [];
      
      const pending = appointmentsArray.filter(app => app?.status === "Pending");
      setNewRequestsCount(pending.length);
    } catch (error) {
      console.error("Error fetching badge count:", error);
      setNewRequestsCount(0);
    }
  };

  fetchPendingCount();
  
  // Optional: Re-fetch every 30 seconds to keep it "live"
  const interval = setInterval(fetchPendingCount, 30000);
  return () => clearInterval(interval);
}, []);


  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex bg-card text-foreground border-r border-border flex-col h-screen sticky top-0 w-56">
        
        {/* Logo Section */}
        <div className="p-4 border-b border-border">
          <h1 className="font-bold text-lg text-emerald-600">MedClinic</h1>
          <p className="text-xs text-muted-foreground">Reception Portal</p>
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
                <span className="flex-1">{item.label}</span>
                {/* Show notification badge for new requests */}
                {item.hasBadge && newRequestsCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {newRequestsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-border">
          <Link
            href="/"
            aria-label="Logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full min-h-[44px]"
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
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px] relative ${
                  isActive ? "text-emerald-600" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label.split(" ")[0]}</span>
                {/* Badge for mobile */}
                {item.hasBadge && newRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] text-center">
                    {newRequestsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
