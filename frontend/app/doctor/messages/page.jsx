/**
 * DOCTOR MESSAGES PAGE
 * Chat interface for doctor to communicate with the receptionist.
 * Messages are persisted in localStorage so they survive page reloads.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Check, CheckCheck, User } from "lucide-react";

const STORAGE_KEY = "medflow_doctor_messages";

export default function DoctorMessages() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Load persisted messages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const newMsg = {
      id: Date.now(),
      text: newMessage,
      sender: "doctor",
      time,
      status: "sent",
    };

    setMessages((prev) => {
      const updated = [...prev, newMsg];
      // Persist to localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setNewMessage("");

    // Simulate message being seen after 1 second
    setTimeout(() => {
      setMessages((prev) => {
        const updated = prev.map((m) => (m.status === "sent" ? { ...m, status: "seen" } : m));
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] flex flex-col pb-16 md:pb-0">
      <h1 className="text-2xl font-bold text-foreground mb-4">Messages</h1>

      <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">

        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center dark:bg-emerald-900/30">
              <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">Karima Belmahdi (Receptionist)</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Start a conversation with the receptionist.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.sender === "doctor"
                      ? "bg-[#1d4ed8] text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1.5 mt-2 ${
                    msg.sender === "doctor" ? "text-blue-200" : "text-muted-foreground"
                  }`}>
                    <span className="text-xs">{msg.time}</span>
                    {msg.sender === "doctor" && (
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

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all text-gray-900 bg-white placeholder:text-gray-400 min-h-[48px] text-base"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              aria-label="Send message"
              className="bg-[#1d4ed8] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#1e40af] disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
