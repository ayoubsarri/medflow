"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Check, CheckCheck } from "lucide-react";

import { API_RECEPTIONIST } from "@/config/api";
import apiFetch from "@/utils/apiFetch";

const STORAGE_KEY = "medflow_receptionist_chats";

export default function MessagesPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [chats, setChats] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load doctors + restore persisted chats from localStorage
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await apiFetch(`${API_RECEPTIONIST}/doctors`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const doctorList = data.data.map(doc => ({
            id: doc._id,
            name: doc.name,
            specialty: doc.specialization || "Specialist"
          }));
          setDoctors(doctorList);
          setSelectedDoctor(doctorList[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    // Restore chats from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChats(JSON.parse(saved));
    } catch (e) {
      // ignore parse errors
    }

    fetchDoctors();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedDoctor]);

  const currentDoctor = doctors.find((d) => d.id === selectedDoctor);
  const currentChat = chats[selectedDoctor] || [];

  function sendMessage() {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: "me",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      status: "sent",
    };

    setChats((prev) => {
      const updated = {
        ...prev,
        [selectedDoctor]: [...(prev[selectedDoctor] || []), message],
      };
      // Persist to localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setNewMessage("");
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Loading messages...</p></div>;
  if (doctors.length === 0) return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">No doctors available</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        <p className="text-muted-foreground">Chat with doctors</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Doctor Selector */}
        <div className="p-4 border-b border-border">
          <label className="block text-sm font-medium text-foreground mb-2">Select Doctor</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background min-h-[44px]"
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} - {doc.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#1d4ed8] flex items-center justify-center font-bold">
              {currentDoctor?.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-foreground">{currentDoctor?.name}</p>
              <p className="text-sm text-muted-foreground">{currentDoctor?.specialty}</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {currentChat.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Start a conversation.
            </div>
          ) : (
            currentChat.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender === "me"
                      ? "bg-[#1d4ed8] text-white"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                    msg.sender === "me" ? "text-blue-200" : "text-muted-foreground"
                  }`}>
                    <span>{msg.time}</span>
                    {msg.sender === "me" && (
                      msg.status === "seen" ? (
                        <CheckCheck className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-input rounded-lg bg-background min-h-[44px]"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-[#1d4ed8] text-white rounded-lg hover:bg-[#1e40af] disabled:opacity-50 min-h-[44px] flex items-center gap-2"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
