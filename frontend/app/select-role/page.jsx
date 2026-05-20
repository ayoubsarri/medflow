/**
 * =============================================================================
 * ROLE SELECTION PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * This page is shown after login for users who have MULTIPLE roles.
 * It allows them to choose which role/dashboard they want to access.
 * 
 * WHEN SHOWN:
 * - After successful login
 * - Only if user has 2+ roles (e.g., Admin + Doctor)
 * - Single-role users skip this and go directly to their dashboard
 * 
 * HOW IT WORKS:
 * 1. Gets email from URL query parameter (?email=...)
 * 2. Looks up user in mock database to get their roles
 * 3. Shows a button for each role they have
 * 4. Clicking a role redirects to that dashboard
 * 
 * ERROR HANDLING:
 * - If no email in URL or user not found, shows "Session Expired" message
 * - User can click "Back to Login" to start over
 * 
 * ROLE CONFIGURATIONS:
 * - Admin: Purple button, Shield icon -> /admin/dashboard
 * - Doctor: Blue button, Stethoscope icon -> /doctor/dashboard
 * - Receptionist: Green button, UserCheck icon -> /receptionist/dashboard
 * 
 * =============================================================================
 */

"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Stethoscope, UserCheck, ArrowLeft } from "lucide-react";

// -----------------------------------------------------------------------------
// MOCK USER DATABASE
// -----------------------------------------------------------------------------
// Same user list as login page for consistency
// In production, this would be fetched from backend
const users = [
  { email: "admin@clinic.com", password: "admin123", roles: ["admin"] },
  { email: "doctor@clinic.com", password: "doctor123", roles: ["doctor"] },
  { email: "reception@clinic.com", password: "recep123", roles: ["receptionist"] },
  { email: "sarah@clinic.com", password: "multi123", roles: ["admin", "doctor"] },
  { email: "karim@clinic.com", password: "multi123", roles: ["doctor", "receptionist"] }
];

// -----------------------------------------------------------------------------
// ROLE CONFIGURATION
// -----------------------------------------------------------------------------
// Defines appearance and behavior for each role button
// - label: Display name for the role
// - description: Short explanation of what the role can do
// - icon: Lucide icon component to display
// - route: URL to redirect to when selected
// - color: Tailwind classes for button background
const roleConfig = {
  admin: {
    label: "Administrator",
    description: "Manage users, settings, and system configuration",
    icon: Shield,
    route: "/admin/dashboard",
    color: "bg-purple-600 hover:bg-purple-700"
  },
  doctor: {
    label: "Doctor",
    description: "View appointments, manage patients, and consultations",
    icon: Stethoscope,
    route: "/doctor/dashboard",
    color: "bg-[#1d4ed8] hover:bg-[#1d4ed8]"
  },
  receptionist: {
    label: "Receptionist",
    description: "Handle appointments, queue, and patient check-ins",
    icon: UserCheck,
    route: "/receptionist/dashboard",
    color: "bg-emerald-600 hover:bg-emerald-700"
  }
};

function SelectRolePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get email from URL query parameter
  const email = searchParams.get("email") || "";

  // Look up user by email to get their available roles
  const user = users.find((u) => u.email === email);
  const userRoles = user ? user.roles : [];

  // ---------------------------------------------------------------------------
  // ROLE SELECTION HANDLER
  // ---------------------------------------------------------------------------
  // Redirects to the selected role's dashboard
  const handleRoleSelect = (role) => {
    router.push(roleConfig[role].route);
  };

  // ---------------------------------------------------------------------------
  // ERROR STATE: NO USER FOUND
  // ---------------------------------------------------------------------------
  // Show error if no valid user or email in URL (session expired)
  if (!user || userRoles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session Expired
          </h2>
          <p className="text-gray-500 mb-6">
            Please login again to continue.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#1d4ed8] hover:bg-[#1d4ed8] text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER: ROLE SELECTION
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* =====================================================================
            LOGO SECTION
            Same branding as login page for consistency
            ===================================================================== */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1d4ed8] to-emerald-600 rounded-2xl mb-4">
            <span className="text-2xl font-bold text-white">CM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MedFlow Clinic</h1>
        </div>

        {/* =====================================================================
            ROLE SELECTION CARD
            ===================================================================== */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Select Your Role
          </h2>
          {/* Show logged in email for confirmation */}
          <p className="text-gray-500 text-center text-sm mb-6">
            Logged in as <span className="font-medium text-gray-700">{email}</span>
          </p>

          {/* -----------------------------------------------------------------
              ROLE BUTTONS
              One button per role the user has
              Each styled with role-specific color and icon
              ----------------------------------------------------------------- */}
          <div className="space-y-3">
            {userRoles.map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full ${config.color} text-white rounded-xl p-4 flex items-center gap-4 transition-colors text-left`}
                >
                  {/* Role Icon in semi-transparent box */}
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  {/* Role Label and Description */}
                  <div>
                    <div className="font-semibold">Continue as {config.label}</div>
                    <div className="text-sm text-white/80">{config.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* -----------------------------------------------------------------
              BACK TO LOGIN LINK
              Allows user to sign in with different account
              ----------------------------------------------------------------- */}
          <button
            onClick={() => router.push("/login")}
            className="w-full mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <SelectRolePageContent />
    </Suspense>
  );
}
