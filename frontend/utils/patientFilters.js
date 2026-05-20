/**
 * 
 * PATIENT FILTER UTILITIES — utils/patientFilters.js
 * =============================================================================
 *
 * Production-grade defensive utilities for patient search and filtering.
 * Handles:=============================================================================
 *   - Undefined/null patients and properties
 *   - Arabic names and RTL text
 *   - Special characters and diacritics
 *   - Empty strings and whitespace
 *   - Case-insensitive searching
 *
 * RATIONALE:
 * Frontend data can be unpredictable due to:
 *   - Browser caching stale code
 *   - API response variations
 *   - Incomplete data from database migrations
 *   - User input edge cases
 *
 * We use defensive programming to ensure the app never crashes.
 * =============================================================================
 */

/**
 * Safely extracts a patient's full name.
 * Handles missing or undefined firstName/lastName, including Arabic names.
 *
 * @param {Object} patient - The patient object
 * @returns {string} Full name or "Unknown Patient"
 */
export function getPatientFullName(patient) {
  // Guard against null/undefined patient
  if (!patient || typeof patient !== 'object') {
    return 'Unknown Patient';
  }

  const firstName = (patient.firstName ?? '').trim();
  const lastName = (patient.lastName ?? '').trim();

  // Return combined name, or just firstName if lastName is missing
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }

  // Fallback if both are empty
  return 'Unknown Patient';
}

/**
 * Safely extracts a patient's ID string.
 * Handles missing _id property.
 *
 * @param {Object} patient - The patient object
 * @returns {string} Patient ID or empty string
 */
export function getPatientId(patient) {
  if (!patient || typeof patient !== 'object') {
    return '';
  }

  const id = patient._id ?? '';
  return String(id).toLowerCase().trim();
}

/**
 * Safely extracts a patient's phone number.
 * Handles missing phone property and non-string values.
 *
 * @param {Object} patient - The patient object
 * @returns {string} Phone number or empty string
 */
export function getPatientPhone(patient) {
  if (!patient || typeof patient !== 'object') {
    return '';
  }

  const phone = patient.phone ?? '';
  return String(phone).trim();
}

/**
 * Normalizes text for searching.
 * Removes extra whitespace, handles Arabic/RTL text, and converts to lowercase.
 *
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeSearchText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()          // Case-insensitive
    .trim()                 // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ')   // Collapse multiple spaces into one
    .replace(/\u0640/g, ''); // Remove Arabic tatweel (kashida) character
}

/**
 * Filters patients by name (firstName + lastName).
 * Handles missing properties and Arabic text.
 *
 * @param {Object} patient - The patient object
 * @param {string} query - Search query (will be normalized)
 * @returns {boolean} True if patient matches query
 */
export function matchesByName(patient, query) {
  if (!patient || !query) {
    return !query; // Show all patients if query is empty
  }

  const fullName = getPatientFullName(patient);
  const normalizedName = normalizeSearchText(fullName);
  const normalizedQuery = normalizeSearchText(query);

  return normalizedName.includes(normalizedQuery);
}

/**
 * Filters patients by ID.
 * Handles missing _id property.
 *
 * @param {Object} patient - The patient object
 * @param {string} query - Search query
 * @returns {boolean} True if patient ID matches query
 */
export function matchesById(patient, query) {
  if (!patient || !query) {
    return !query;
  }

  const id = getPatientId(patient);
  const normalizedQuery = normalizeSearchText(query);

  return id.includes(normalizedQuery);
}

/**
 * Filters patients by phone number.
 * Handles missing phone property and various phone formats.
 *
 * @param {Object} patient - The patient object
 * @param {string} query - Search query (digits, spaces, dashes, parentheses)
 * @returns {boolean} True if phone matches query
 */
export function matchesByPhone(patient, query) {
  if (!patient || !query) {
    return !query;
  }

  const phone = getPatientPhone(patient);
  // Remove non-numeric characters from query for flexible matching
  const queryDigits = query.replace(/\D/g, '');
  const phoneDigits = phone.replace(/\D/g, '');

  // Match if digits are present and included in phone
  return queryDigits.length > 0 && phoneDigits.includes(queryDigits);
}

/**
 * Main filter function for patient search.
 * Safely filters an array of patients by the given search type and query.
 *
 * @param {Array} patients - Array of patient objects
 * @param {string} searchQuery - Search query from user input
 * @param {string} searchType - Type of search: 'name', 'id', or 'phone'
 * @returns {Array} Filtered array of patients
 */
export function filterPatients(patients, searchQuery, searchType = 'name') {
  // Guard against invalid input
  if (!Array.isArray(patients)) {
    console.warn('[filterPatients] patients is not an array:', patients);
    return [];
  }

  if (!searchQuery || typeof searchQuery !== 'string') {
    // No search query = return all valid patients
    return patients.filter(p => p && typeof p === 'object');
  }

  const query = normalizeSearchText(searchQuery);
  if (!query) {
    // Empty normalized query = return all valid patients
    return patients.filter(p => p && typeof p === 'object');
  }

  // Filter based on search type
  switch (searchType) {
    case 'name':
      return patients.filter(p => matchesByName(p, searchQuery));
    case 'id':
      return patients.filter(p => matchesById(p, searchQuery));
    case 'phone':
      return patients.filter(p => matchesByPhone(p, searchQuery));
    default:
      console.warn('[filterPatients] Unknown search type:', searchType);
      return patients.filter(p => p && typeof p === 'object');
  }
}
