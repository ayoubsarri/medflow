/**
 * =============================================================================
 * DOCTOR SETTINGS PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * Settings page for doctor to view/edit profile and get help via FAQ.
 * 
 * FEATURES:
 * - Profile card with photo, name (bold, read-only), DOB (read-only)
 * - Editable fields: Email, Phone, Emergency Contact, Address
 * - Edit button at top right of profile card
 * - FAQ accordion for common questions
 * 
 * =============================================================================
 */

"use client";

import { useState } from "react";
import { User, ChevronDown, ChevronUp, Check, Edit2, X } from "lucide-react";

// -----------------------------------------------------------------------------
// MOCK DATA: Doctor profile information
// -----------------------------------------------------------------------------
const initialProfile = {
  name: "Dr. Ahmed Nouar",
  dateOfBirth: "March 15, 1975",
  address: "123 Medical Center Blvd, Algiers",
  email: "ahmed.nouar@medclinic.dz",
  phone: "+213 555 111222",
  emergencyContact: "+213 555 999888",
};

// -----------------------------------------------------------------------------
// FAQ ITEMS: Common questions about using the app
// -----------------------------------------------------------------------------
const faqItems = [
  {
    question: "How do I start a consultation?",
    answer: "From the Dashboard, click on a patient in the waiting list or click 'Start Consultation' on the current appointment card. This opens the consultation modal where you can view patient info, write notes, and create prescriptions.",
  },
  {
    question: "How do I view my schedule for the day?",
    answer: "Go to 'Today's Schedule' from the sidebar. You'll see all appointments for today with patient names, times, and visit reasons. Use the filter buttons to show only 'Waiting' or 'Completed' patients.",
  },
  {
    question: "How do I view a patient's full medical history?",
    answer: "Go to 'My Patients', find the patient and click 'View Profile'. You'll see their allergies, chronic conditions, visit history, and all medical records.",
  },
  {
    question: "How do I request documents from a patient?",
    answer: "In the Patient Profile modal, go to 'Medical Records' section and click 'Ask for Upload'. Fill in the document title, type, and notes. The request will be sent to the patient's dashboard for them to upload.",
  },
  {
    question: "How do I message the receptionist?",
    answer: "Click 'Messages' in the sidebar. You'll see the chat window with the receptionist. Type your message and press Enter or click the send button.",
  },
  {
    question: "How do I print a prescription?",
    answer: "During a consultation, after writing the prescription in the text area, click the 'Print' button. This opens a professional prescription format in a new window ready for printing.",
  },
  {
    question: "Can I add new allergies or conditions to a patient's record?",
    answer: "Yes, go to 'My Patients', click 'View Profile', and use the '+' button next to Allergies or Chronic Conditions to add new entries. Note: You can only delete entries, not edit existing ones.",
  },
  {
    question: "How do I edit my profile information?",
    answer: "On this Settings page, click the 'Edit' button at the top right of the Profile Information card. You can then edit your email, phone, emergency contact, and address. Name and date of birth cannot be changed.",
  },
];

export default function DoctorSettings() {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(initialProfile);
  const [openFaq, setOpenFaq] = useState(null);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  
  // Start editing - copy current profile to edit state
  const handleStartEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  // Save changes - update profile with edited values
  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  // Cancel editing - discard changes
  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // Toggle FAQ item open/closed
  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="space-y-6 max-w-2xl pb-20 md:pb-0">
      {/* Page Title - No subtitle */}
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* ===================================================================
          PROFILE INFORMATION CARD
          =================================================================== */}
      <div className="bg-card border border-border rounded-xl p-6">
        {/* Card Header with Edit Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-foreground text-lg">Profile Information</h2>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              aria-label="Edit profile"
              className="flex items-center gap-2 text-[#1d4ed8] hover:text-[#1e40af] px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-[#1d4ed8]/20 min-h-[44px] transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                aria-label="Save changes"
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
              <button
                onClick={handleCancel}
                aria-label="Cancel editing"
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 min-h-[44px] transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Cancel</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Header - Photo + Name (always visible, not editable) */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-xl text-foreground">{profile.name}</p>
            <p className="text-muted-foreground">Doctor</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          {/* Date of Birth - Read only */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Date of Birth</label>
            <p className="text-foreground bg-muted px-4 py-3 rounded-lg min-h-[48px] flex items-center">
              {profile.dateOfBirth}
            </p>
          </div>

          {/* Email - Editable */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white min-h-[48px]"
              />
            ) : (
              <p className="text-foreground bg-muted px-4 py-3 rounded-lg min-h-[48px] flex items-center">
                {profile.email}
              </p>
            )}
          </div>

          {/* Phone - Editable */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedProfile.phone}
                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white min-h-[48px]"
              />
            ) : (
              <p className="text-foreground bg-muted px-4 py-3 rounded-lg min-h-[48px] flex items-center">
                {profile.phone}
              </p>
            )}
          </div>

          {/* Emergency Contact - Editable */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Emergency Contact</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedProfile.emergencyContact}
                onChange={(e) => setEditedProfile({ ...editedProfile, emergencyContact: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white min-h-[48px]"
              />
            ) : (
              <p className="text-foreground bg-muted px-4 py-3 rounded-lg min-h-[48px] flex items-center">
                {profile.emergencyContact}
              </p>
            )}
          </div>

          {/* Address - Editable */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Address</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.address}
                onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white min-h-[48px]"
              />
            ) : (
              <p className="text-foreground bg-muted px-4 py-3 rounded-lg min-h-[48px] flex items-center">
                {profile.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================
          FAQ SECTION
          =================================================================== */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground text-lg mb-4">Frequently Asked Questions</h2>

        <div className="space-y-2">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                aria-label={`Toggle ${item.question}`}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 min-h-[48px]"
              >
                <span className="font-medium text-foreground pr-4">{item.question}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
