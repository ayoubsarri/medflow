/**
 * =============================================================================
 * MASTER API CONFIGURATION — frontend/config/api.js
 * 
 *=============================================================================
 * SINGLE SOURCE OF TRUTH for all API endpoints.
 * Import this constant into any page/component that needs to make API calls.
 *
 * WHY THIS MATTERS:
 * - If you ever need to change the backend URL, you only change it in ONE place
 * - No more hardcoded "http://localhost:5000" scattered throughout 100 files
 * - Easy to switch between dev/production URLs based on environment
 *
 * USAGE IN YOUR PAGES:
 * ```javascript
 * import { API_ADMIN, API_PATIENTS } from '@/config/api';
 * 
 * const response = await fetch(`${API_ADMIN}/reports`);
 * const patientRes = await fetch(`${API_PATIENTS}/${patientId}`);
 * ```
 * =============================================================================
 */

// Detects the backend host dynamically so the app works from any device on the
// local network (e.g. another laptop or phone accessing via 172.20.10.x).
// Server-side (window undefined) always falls back to localhost.
function getBackendBase() {
  if (typeof window === "undefined") return "http://localhost:5000";
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }
  return "https://medflow-ehfg.onrender.com";
}

const BACKEND = getBackendBase();

// This provides access to all administrator functions like staff management, reports, and system settings.
export const API_ADMIN = `${BACKEND}/api/admin`;

// This provides access to patient records, medical history, and portal login.
export const API_PATIENTS = `${BACKEND}/api/patients`;

// This provides access to appointments, queue management, and patient registration for the receptionist.
export const API_RECEPTIONIST = `${BACKEND}/api/receptionist`;

// This provides access to all general appointment scheduling operations.
export const API_APPOINTMENTS = `${BACKEND}/api/appointments`;

// This provides access to doctor-specific operations like the daily dashboard and medical justifications.
export const API_DOCTOR = `${BACKEND}/api/doctor`;

// This provides access to authentication endpoints for user login and sessions.
export const API_AUTH = `${BACKEND}/api/auth`;

// This provides a health check endpoint useful for checking backend connection status.
export const API_HEALTH = `${BACKEND}/api/health`;

// This provides access to general user profile endpoints and data.
export const API_USERS = `${BACKEND}/api/users`;

// This provides a fallback default base URL for simple cases.
export const API_BASE = BACKEND;
