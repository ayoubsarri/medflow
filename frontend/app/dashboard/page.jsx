'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import BookAppointmentContent from '@/components/dashboard/BookAppointmentContent';
import MedicalHistoryContent from '@/components/dashboard/MedicalHistoryContent';
import OldRecordsContent from '@/components/dashboard/OldRecordsContent';
import SettingsHelpContent from '@/components/dashboard/SettingsHelpContent';
import { API_USERS } from '@/config/api';

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch User Data on Load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login'); // Redirect if no token found
          return;
        }

        const response = await fetch(`${API_USERS}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data); // This data now flows into Sidebar and Settings!
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // 2. Decide which content to show based on Sidebar clicks
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardContent user={user} />;
      case 'book': return <BookAppointmentContent />;
      case 'history': return <MedicalHistoryContent />;
      case 'records': return <OldRecordsContent />;
      case 'settings': return <SettingsHelpContent user={user} />;
      default: return <DashboardContent user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50"> {/* bg-gray-50: Lightest gray for the app background */}
      
      {/* Sidebar gets the 'user' data to show name/ID[cite: 4] */}
      <Sidebar 
        user={user} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto"> {/* overflow-y-auto: Allows only the content to scroll, keeping sidebar fixed */}
        <div className="max-w-7xl mx-auto p-4 md:p-8"> {/* max-w-7xl: Limits width on huge monitors. mx-auto: Centers it. */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}