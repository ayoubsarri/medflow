"use client";

/**
 * =============================================================================
 * RECEPTIONIST SETTINGS PAGE
 * =============================================================================
 * 
 * PURPOSE:
 * Profile information (editable) and FAQ section.
 * Card style matches doctor settings page.
 * Personal info can be edited. No employee ID field.
 * 
 * =============================================================================
 */

import { useState } from "react";
import { User, Mail, Phone, Calendar, MapPin, Edit, Save, X, ChevronDown, ChevronUp, HelpCircle, UserCircle } from "lucide-react";

// Receptionist profile data
const initialProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@medclinic.com",
  role: "Receptionist",
  dob: "1992-08-15",
  phone: "0555-987-654",
  address: "45 Medical District, Algiers",
  emergencyContact: "0555-123-456",
};

// FAQ items - updated for new page structure
const faqItems = [
  {
    id: 1,
    question: "How to confirm a new appointment request?",
    answer: "Go to the \"New Requests\" page from the navigation menu. You'll see all pending requests from patients. Click \"Confirm\" to approve the appointment, or \"Failed Attempt\" if you couldn't reach the patient by phone.",
  },
  {
    id: 2,
    question: "What happens to failed attempt requests?",
    answer: "Failed attempts are moved to the bottom of the requests list so you can try calling again later. The number of failed attempts is tracked. You can delete a request permanently if needed.",
  },
  {
    id: 3,
    question: "How to view appointments by date?",
    answer: "Go to the Appointments page. Use the calendar on the left to select a date - you can toggle between week view and month view. Click any date to see all appointments scheduled for that day.",
  },
  {
    id: 4,
    question: "How to search for a specific appointment?",
    answer: "In the Appointments page, use the search bar at the top to search by patient name or doctor name. You can also filter by specific doctor using the dropdown menu.",
  },
  {
    id: 5,
    question: "How to add a walk-in patient?",
    answer: "Go to the Patients page and click \"Add New Patient\". Fill in the patient's details and create an appointment for them directly.",
  },
  {
    id: 6,
    question: "How to upload documents for a patient?",
    answer: "Navigate to the Documents page. Select the document type, add a title, choose the file, then search and select the patient. Click \"Upload\" to add it to their profile.",
  },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(initialProfile);
  const [openFaqId, setOpenFaqId] = useState(null);

  // Handle edit mode
  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  // Save changes
  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // Toggle FAQ
  function toggleFaq(id) {
    setOpenFaqId(openFaqId === id ? null : id);
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Help & Settings</h2>
      </div>

      {/* Profile Section - Styled like doctor settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Profile Information</h3>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 min-h-[40px]"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 min-h-[40px]"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 flex items-center gap-2 min-h-[40px]"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar - like doctor sidebar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-3xl font-bold">
              {profile.name.charAt(0)}
            </div>
            <p className="mt-3 font-bold text-foreground text-lg">{profile.name}</p>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-sm font-medium">
              {profile.role}
            </span>
          </div>

          {/* Profile Details */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email - Editable */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                />
              ) : (
                <p className="font-medium text-foreground">{profile.email}</p>
              )}
            </div>

            {/* Phone - Editable */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Phone Number</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                />
              ) : (
                <p className="font-medium text-foreground">{profile.phone}</p>
              )}
            </div>

            {/* Date of Birth - Read Only */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date of Birth</span>
              </div>
              <p className="font-medium text-foreground">{profile.dob}</p>
            </div>

            {/* Emergency Contact - Editable */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <UserCircle className="w-4 h-4" />
                <span className="text-sm">Emergency Contact</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile.emergencyContact}
                  onChange={(e) => setEditedProfile({ ...editedProfile, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                />
              ) : (
                <p className="font-medium text-foreground">{profile.emergencyContact}</p>
              )}
            </div>

            {/* Address - Editable */}
            <div className="bg-muted p-4 rounded-lg sm:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Address</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.address}
                  onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background"
                />
              ) : (
                <p className="font-medium text-foreground">{profile.address}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-[#1d4ed8]" />
          <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-3">
          {faqItems.map((faq) => (
            <div
              key={faq.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 min-h-[44px]"
              >
                <span className="font-medium text-foreground">{faq.question}</span>
                {openFaqId === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>
              {openFaqId === faq.id && (
                <div className="px-4 py-3 bg-muted/50 border-t border-border">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
