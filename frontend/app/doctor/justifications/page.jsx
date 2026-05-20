"use client";

import { useState, useEffect } from "react";
import { Search, FileText, Printer, Calendar, User } from "lucide-react";
import { API_DOCTOR } from "@/config/api";

export default function JustificationArchive() {
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchJustifications = async () => {
      try {
        const token = localStorage.getItem('token');
        // Matches the 'doctorName' query requirement in your controller[cite: 4]
        const response = await fetch(`${API_DOCTOR}/justifications?doctorName=Dr. Ahmed Nouar&search=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setJustifications(data);
        }
      } catch (err) {
        console.error("Failed to load archive", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJustifications();
  }, [searchTerm]); // Re-fetch when user types in search bar

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Medical Justifications Archive</h1>
        <p className="text-muted-foreground">Search and reprint issued medical leaves</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by patient name..." 
          className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="p-4 font-semibold">Date Issued</th>
              <th className="p-4 font-semibold">Patient</th>
              <th className="p-4 font-semibold">Reason/Notes</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {justifications.map((j) => (
              <tr key={j._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm"><Calendar size={14} className="inline mr-2"/> {new Date(j.date).toLocaleDateString()}</td>
                <td className="p-4 font-medium"><User size={14} className="inline mr-2"/> {j.patientId?.firstName} {j.patientId?.lastName}</td>
                <td className="p-4 text-sm text-gray-600 italic">"{j.notes || "No notes provided"}"</td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-2 ml-auto">
                    <Printer size={16} /> Reprint
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {justifications.length === 0 && !loading && (
          <div className="p-10 text-center text-gray-400 font-medium">No justifications found.</div>
        )}
      </div>
    </div>
  );
}