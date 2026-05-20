/**
 * =============================================================================
 * PATIENT PROFILE VIEW COMPONENT
 * =============================================================================
 * 
 * PURPOSE:
 * This component displays detailed patient profile information.
 * It's used inside the ConsultationModal and can also be used standalone.
 * 
 * FEATURES:
 * - Basic Info: Age, contact, last visit date
 * - Editable Fields: Allergies, Chronic Conditions (click to edit)
 * - Visit History: List of previous visits with dates and notes
 * - Medical Records: Documents like lab reports, imaging, etc.
 * - "Ask for Upload" button to request documents from receptionist
 * 
 * EDITING WORKFLOW:
 * 1. Click edit icon next to a field (allergies or chronic conditions)
 * 2. Field becomes an input with save/cancel buttons
 * 3. Click save to update, or cancel to discard changes
 * 
 * UPLOAD REQUEST WORKFLOW:
 * 1. Click "Ask for Upload" button
 * 2. Modal opens with title, type dropdown, and notes
 * 3. Submit sends request to receptionist (mock alert in demo)
 * 
 * PROPS:
 * - patient: object - patient data including name, age, allergies, etc.
 * - onUpdatePatient: function - called when editable fields are saved
 * - showUploadRequest: boolean - whether to show upload request button
 * - onUploadRequest: function - called when upload request is submitted
 * 
 * =============================================================================
 */

"use client";

import { useState } from "react";
import { Calendar, FileText, Plus, Check, Edit2, X } from "lucide-react";

export default function PatientProfileView({ 
  patient, 
  onUpdatePatient,
  showUploadRequest = true,
  onUploadRequest
}) {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  // Track which field is being edited (null = none)
  const [editingField, setEditingField] = useState(null);
  // Current value in the edit input
  const [editValue, setEditValue] = useState("");
  
  // Upload request modal visibility
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Upload request form data
  const [uploadRequest, setUploadRequest] = useState({ 
    title: "", 
    type: "Lab report", 
    notes: "" 
  });

  // ---------------------------------------------------------------------------
  // EARLY RETURN: NO PATIENT DATA
  // ---------------------------------------------------------------------------
  if (!patient) return null;

  // ---------------------------------------------------------------------------
  // EDIT HANDLERS
  // ---------------------------------------------------------------------------
  
  // Start editing a field - sets the field name and copies current value
  const handleStartEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || "");
  };

  // Save the edited value and call parent update function
  const handleSaveEdit = () => {
    if (!editingField || !onUpdatePatient) return;
    // Update patient with new value for the edited field
    onUpdatePatient({ ...patient, [editingField]: editValue });
    // Reset edit state
    setEditingField(null);
    setEditValue("");
  };

  // Cancel editing without saving
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  // ---------------------------------------------------------------------------
  // UPLOAD REQUEST HANDLER
  // ---------------------------------------------------------------------------
  // Submit upload request to receptionist
  const handleUploadSubmit = () => {
    if (!uploadRequest.title) return;
    
    if (onUploadRequest) {
      // Use provided callback if available
      onUploadRequest(uploadRequest);
    } else {
      // Mock: show alert with request details
      alert(`Request sent to receptionist:\nTitle: ${uploadRequest.title}\nType: ${uploadRequest.type}\nNotes: ${uploadRequest.notes}`);
    }
    
    // Reset form and close modal
    setUploadRequest({ title: "", type: "Lab report", notes: "" });
    setShowUploadModal(false);
  };

  // ---------------------------------------------------------------------------
  // SUB-COMPONENT: EDITABLE FIELD
  // ---------------------------------------------------------------------------
  // Renders a field that can be clicked to edit
  // Shows either the display view or edit input based on editingField state
  const EditableField = ({ label, field, value }) => (
    <div>
      {/* Field Label with Edit Button */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {/* Only show edit button if not currently editing this field and update function exists */}
        {editingField !== field && onUpdatePatient && (
          <button
            onClick={() => handleStartEdit(field, value)}
            aria-label={`Edit ${label.toLowerCase()}`}
            className="text-[#1d4ed8] hover:text-[#1e40af] p-1 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Edit Mode: Input with Save/Cancel buttons */}
      {editingField === field ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white"
          />
          <button
            onClick={handleSaveEdit}
            aria-label="Save"
            className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            aria-label="Cancel"
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 min-h-[44px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Display Mode: Show value in styled box */
        <p className="text-foreground bg-muted px-3 py-2 rounded-lg">{value || "None"}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      
      {/* =====================================================================
          BASIC INFO SECTION
          Non-editable patient demographics
          ===================================================================== */}
      <div className="bg-muted rounded-lg p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Age:</span>{" "}
            <span className="text-foreground">{patient.age} years</span>
          </div>
          <div>
            <span className="text-muted-foreground">Contact:</span>{" "}
            <span className="text-foreground">{patient.contact || "N/A"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Last Visit:</span>{" "}
            <span className="text-foreground">{patient.lastVisit || "First visit"}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          EDITABLE FIELDS SECTION
          Allergies and Chronic Conditions - can be clicked to edit
          ===================================================================== */}
      <div className="space-y-3">
        <EditableField label="Allergies" field="allergies" value={patient.allergies} />
        <EditableField label="Chronic Conditions" field="chronicConditions" value={patient.chronicConditions} />
      </div>

      {/* =====================================================================
          VISIT HISTORY SECTION
          List of previous visits with date, reason, and notes
          ===================================================================== */}
      <div>
        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-[#1d4ed8]" />
          Visit History
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {patient.visitHistory?.length > 0 ? (
            patient.visitHistory.map((visit, idx) => (
              <div key={idx} className="bg-muted rounded-lg p-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-foreground">{visit.reason}</span>
                  <span className="text-xs text-muted-foreground">{visit.date}</span>
                </div>
                <p className="text-muted-foreground text-xs">{visit.notes}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No visit history</p>
          )}
        </div>
      </div>

      {/* =====================================================================
          MEDICAL RECORDS SECTION
          Documents like lab reports, imaging, prescriptions
          Includes "Ask for Upload" button
          ===================================================================== */}
      <div>
        {/* Section Header with Upload Button */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1d4ed8]" />
            Medical Records
          </h4>
          {showUploadRequest && (
            <button
              onClick={() => setShowUploadModal(true)}
              aria-label="Request document upload"
              className="bg-[#1d4ed8] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#1e40af] flex items-center gap-1 min-h-[32px] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Ask for Upload
            </button>
          )}
        </div>
        
        {/* Records List */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {patient.medicalRecords?.length > 0 ? (
            patient.medicalRecords.map((record) => (
              <div key={record.id} className="bg-muted rounded-lg p-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-foreground">{record.title}</span>
                  <span className="text-xs text-muted-foreground">{record.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Record Type Badge */}
                  <span className="text-xs bg-blue-100 text-[#1d4ed8] px-1.5 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-400">
                    {record.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{record.notes}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No medical records</p>
          )}
        </div>
      </div>

      {/* =====================================================================
          UPLOAD REQUEST MODAL
          Form to request document upload from receptionist
          ===================================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-card rounded-xl w-full max-w-md shadow-xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Request Document Upload</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                aria-label="Close"
                className="p-2 hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Modal Form */}
            <div className="p-4 space-y-4">
              {/* Title Input */}
              <div>
                <label htmlFor="upload-title" className="block text-sm font-medium text-foreground mb-1">
                  Title
                </label>
                <input
                  id="upload-title"
                  type="text"
                  value={uploadRequest.title}
                  onChange={(e) => setUploadRequest({ ...uploadRequest, title: e.target.value })}
                  placeholder="e.g., Blood Test Results"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white min-h-[44px]"
                />
              </div>
              
              {/* Document Type Dropdown */}
              <div>
                <label htmlFor="upload-type" className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <select
                  id="upload-type"
                  value={uploadRequest.type}
                  onChange={(e) => setUploadRequest({ ...uploadRequest, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white min-h-[44px]"
                >
                  <option value="Lab report">Lab report</option>
                  <option value="Imaging">Imaging</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {/* Notes Textarea */}
              <div>
                <label htmlFor="upload-notes" className="block text-sm font-medium text-foreground mb-1">
                  Notes
                </label>
                <textarea
                  id="upload-notes"
                  value={uploadRequest.notes}
                  onChange={(e) => setUploadRequest({ ...uploadRequest, notes: e.target.value })}
                  placeholder="Additional instructions..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            
            {/* Modal Footer - Submit Button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadRequest.title}
                aria-label="Send request"
                className="w-full bg-[#1d4ed8] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#1e40af] disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
