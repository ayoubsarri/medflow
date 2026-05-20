/**
 * =============================================================================
 * DARK MODE TOGGLE COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * This component provides a button to switch between light and dark themes.
 * It persists the user's preference in localStorage so it remembers their
 * choice across page refreshes and sessions.
 * 
 * HOW IT WORKS:
 * 1. On mount, check localStorage for saved preference
 * 2. If dark mode was saved, add "dark" class to document
 * 3. When clicked, toggle the state and update both class and localStorage
 * 
 * STYLING:
 * - Uses Tailwind's dark mode (class-based)
 * - Sun icon shown in dark mode (to switch to light)
 * - Moon icon shown in light mode (to switch to dark)
 * 
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  // Track current theme state (false = light, true = dark)
  const [isDark, setIsDark] = useState(false);

  // ---------------------------------------------------------------------------
  // LOAD SAVED PREFERENCE ON MOUNT
  // ---------------------------------------------------------------------------
  // Check localStorage when component first renders to restore user's preference
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setIsDark(true);
      // Add "dark" class to <html> element to enable dark styles
      document.documentElement.classList.add("dark");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // TOGGLE DARK MODE
  // ---------------------------------------------------------------------------
  // Switch between light and dark themes and save preference
  function toggleDarkMode() {
    const newValue = !isDark;
    setIsDark(newValue);
    
    if (newValue) {
      // Switching TO dark mode
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      // Switching TO light mode
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-lg hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground"
    >
      {/* Show Sun icon in dark mode (click to go light), Moon in light mode */}
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
