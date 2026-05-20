/**
 * Drop-in replacement for fetch() that handles auth automatically.
 *
 * - Reads the JWT from localStorage and injects the Authorization header on every request.
 * - Redirects to /login on a 401 response (expired or missing token).
 * - Otherwise behaves identically to the native fetch() — same signature, same return value.
 *
 * @example
 * // GET
 * const res = await apiFetch(`${API_DOCTOR}/my-patients`);
 *
 * @example
 * // POST with body (still pass Content-Type yourself)
 * const res = await apiFetch(`${API_ADMIN}/add-staff`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(payload),
 * });
 *
 * @param {string} url - The endpoint URL.
 * @param {RequestInit} [options={}] - Standard fetch options (method, body, headers, etc.).
 * @returns {Promise<Response>}
 */
export default async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // 401 = no/expired token  |  403 = wrong role (stale session) — both need a fresh login
  if (response.status === 401 || response.status === 403) {
    window.location.href = '/login';
    return response;
  }

  return response;
}
