/**
 * =============================================================================
 * LOGIN PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * Entry point for staff authentication. Users enter their email and password
 * to access the clinic management system.
 * 
 * AUTHENTICATION FLOW:
 * 1. User enters email and password
 * 2. System validates against mock user database
 * 3. If single role: redirect directly to that role's dashboard
 * 4. If multiple roles: redirect to role selection page
 * 
 * =============================================================================
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { API_AUTH } from "@/config/api";

const roleRoutes = {
  Admin: "/admin/dashboard",
  Doctor: "/doctor/dashboard",
  Receptionist: "/receptionist/dashboard"
};

export default function LoginPage() {
  const router = useRouter();
  
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_AUTH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("staffRole", data.user.role);
      localStorage.setItem("staffName", data.user.name);
      localStorage.setItem("staffEmail", email);
      localStorage.setItem("staffId", data.user.id);

      router.push(roleRoutes[data.user.role] || "/");
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center items-center p-4">
      {/* Back Link */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Portal</h1>
          <p className="text-gray-600">Access your clinic management dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-4 py-3 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Link to Patient Portal */}
          <Link
            href="/patient-access"
            className="block w-full text-center px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Access Patient Portal
          </Link>
        </div>

        {/* Demo Credentials Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <p className="text-xs font-semibold text-blue-900 mb-4 uppercase tracking-wide">
            Demo Credentials
          </p>
          
          <div className="space-y-3">
            {/* Admin */}
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Admin</p>
              <code className="text-xs text-gray-600 block font-mono">
                admin@clinic.com / password123
              </code>
            </div>

            {/* Doctor */}
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Doctor</p>
              <code className="text-xs text-gray-600 block font-mono">
                dr.nouar@clinic.com / password123
              </code>
            </div>

            {/* Receptionist */}
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Receptionist</p>
              <code className="text-xs text-gray-600 block font-mono">
                reception@clinic.com / password123
              </code>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-4 text-center">
            For testing purposes only
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact IT support at <span className="font-medium">support@clinic.com</span></p>
        </div>
      </div>
    </div>
  );
}
