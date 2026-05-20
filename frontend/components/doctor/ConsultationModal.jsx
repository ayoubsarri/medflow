/**
 * =============================================================================
 * CONSULTATION MODAL COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * This is a SHARED modal component used by doctors during patient consultations.
 * It provides a consistent interface across Dashboard, Queue, and Schedule pages.
 * 
 * FEATURES:
 * - Shows patient info (name, age, reason for visit)
 * - "View Profile" toggle to see full patient details
 * - Quick info box (allergies, chronic conditions, last visit)
 * - Notes and Prescription text areas for documentation
 * - "Save & Complete" - marks consultation done, closes modal
 * - "Save & Next" - saves and opens next waiting patient (optional)
 * 
 * USAGE:
 * <ConsultationModal
 *   isOpen={true}
 *   onClose={handleClose}
 *   patient={patientObject}
 *   onSaveComplete={handleSave}
 *   onSaveNext={handleNext}  // optional
 *   hasNextPatient={true}     // enables Save & Next button
 *   onUpdatePatient={handleUpdate}  // for profile edits
 * />
 * 
 * PROPS:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - called when modal is closed without saving
 * - patient: object - patient/appointment data with fields like name, age, etc.
 * - onSaveComplete: function - called with {notes, prescription} when saving
 * - onSaveNext: function - called when "Save & Next" is clicked (optional)
 * - hasNextPatient: boolean - enables the "Save & Next" button
 * - onUpdatePatient: function - updates patient data for profile edits
 * 
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { X, User, ChevronDown, ChevronUp } from "lucide-react";
import PatientProfileView from "./PatientProfileView";

export default function ConsultationModal({
  isOpen,
  onClose,
  patient,
  onSaveComplete,
  onSaveNext,
  hasNextPatient = false,
  onUpdatePatient
}) {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  // Form fields for consultation notes and prescription
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  
  // Controls visibility of the expanded patient profile section
  const [showProfile, setShowProfile] = useState(false);

  // ---------------------------------------------------------------------------
  // EFFECT: RESET FORM WHEN PATIENT CHANGES
  // ---------------------------------------------------------------------------
  // When a new patient is loaded, populate form with existing notes (if any)
  // and collapse the profile section
  useEffect(() => {
    if (patient) {
      setNotes(patient.notes || "");
      setPrescription(patient.prescription || "");
      setShowProfile(false);
    }
  }, [patient]);

  // ---------------------------------------------------------------------------
  // EARLY RETURN: DON'T RENDER IF CLOSED OR NO PATIENT
  // ---------------------------------------------------------------------------
  if (!isOpen || !patient) return null;

  // ---------------------------------------------------------------------------
  // HANDLER: SAVE AND COMPLETE CONSULTATION
  // ---------------------------------------------------------------------------
  // Calls parent's save handler and resets the form
  const handleSaveComplete = () => {
    onSaveComplete({
      notes,
      prescription
    });
    // Reset form state
    setNotes("");
    setPrescription("");
    setShowProfile(false);
  };

  // ---------------------------------------------------------------------------
  // HANDLER: SAVE AND MOVE TO NEXT PATIENT
  // ---------------------------------------------------------------------------
  // Saves current consultation and triggers next patient load
  const handleSaveNext = () => {
    if (onSaveNext) {
      onSaveNext({
        notes,
        prescription
      });
      // Reset form for next patient
      setNotes("");
      setPrescription("");
      setShowProfile(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: CLOSE WITHOUT SAVING
  // ---------------------------------------------------------------------------
  // Closes modal and resets form state
  const handleClose = () => {
    onClose();
    setNotes("");
    setPrescription("");
    setShowProfile(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        
        {/* =====================================================================
            MODAL HEADER
            - Patient name, age, and reason for visit
            - Profile toggle button
            - Close button
            ===================================================================== */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          {/* Patient Info */}
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-foreground">Consultation</h2>
            <p className="text-sm text-muted-foreground">
              {patient.patient || patient.name} - {patient.age} yrs
            </p>
            <p className="text-xs text-muted-foreground">
              Reason: {patient.reason || "General consultation"}
            </p>
          </div>
          
          {/* Header Buttons */}
          <div className="flex items-center gap-2">
            {/* View Profile Toggle - Expands/collapses full patient profile */}
            <button
              onClick={() => setShowProfile(!showProfile)}
              aria-label={showProfile ? "Hide profile" : "View profile"}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                showProfile 
                  ? "bg-[#1d4ed8] text-white shadow-sm" 
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <User className="w-4 h-4" />
              Profile
              {showProfile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              aria-label="Close Modal"
              className="p-2 hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            MODAL CONTENT
            ===================================================================== */}
        <div className="p-4 space-y-4">
          
          {/* -----------------------------------------------------------------
              EXPANDED PATIENT PROFILE SECTION
              Shows when "View Profile" is toggled on
              Contains full patient details via PatientProfileView component
              ----------------------------------------------------------------- */}
          {showProfile && (
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#1d4ed8]" />
                Patient Profile
              </h3>
              <PatientProfileView 
                patient={patient} 
                onUpdatePatient={onUpdatePatient}
                showUploadRequest={true}
              />
            </div>
          )}

          {/* -----------------------------------------------------------------
              QUICK INFO BOX
              Shows essential info when profile is collapsed
              Displays allergies, chronic conditions, last visit
              ----------------------------------------------------------------- */}
          {!showProfile && (
            <div className="bg-muted rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Allergies:</span>{" "}
                  <span className="text-foreground">{patient.allergies || "None"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chronic:</span>{" "}
                  <span className="text-foreground">{patient.chronicConditions || "None"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Last Visit:</span>{" "}
                  <span className="text-foreground">{patient.lastVisit || "First visit"}</span>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              NOTES TEXTAREA
              Doctor writes consultation notes here
              ----------------------------------------------------------------- */}
          <div>
            <label htmlFor="consult-notes" className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              id="consult-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write consultation notes..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white placeholder:text-gray-400 min-h-[100px]"
            />
          </div>

          {/* -----------------------------------------------------------------
              PRESCRIPTION TEXTAREA
              Doctor writes medication prescriptions here
              ----------------------------------------------------------------- */}
          <div>
            <label htmlFor="consult-prescription" className="block text-sm font-medium text-foreground mb-1">
              Prescription
            </label>
            <textarea
              id="consult-prescription"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="Medication, dosage, duration..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white placeholder:text-gray-400 min-h-[100px]"
            />
          </div>
        </div>

        {/* =====================================================================
            MODAL FOOTER - ACTION BUTTONS
            - Save & Complete: Always shown, marks consultation as done
            - Save & Next: Only shown if onSaveNext provided, opens next patient
            ===================================================================== */}
        <div className="p-4 border-t border-border flex gap-3 sticky bottom-0 bg-card">
          {/* Save & Complete Button - Always visible */}
          <button
            onClick={handleSaveComplete}
            aria-label="Save and Complete"
            className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]"
          >
            Save & Complete
          </button>
          
          {/* Save & Next Button - Only shown when onSaveNext is provided */}
          {onSaveNext && (
            <button
              onClick={handleSaveNext}
              disabled={!hasNextPatient}
              aria-label="Save and Call Next"
              className="flex-1 bg-[#1d4ed8] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#1e40af] disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] transition-colors"
            >
              Save & Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
