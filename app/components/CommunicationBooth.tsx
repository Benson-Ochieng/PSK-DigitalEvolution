import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";

interface Message {
  id?: string;
  senderType: "visitor" | "agent" | "system";
  senderName?: string;
  content: string;
  timestamp: string;
}

export default function CommunicationBooth() {
  const location = useLocation();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"lead_form" | "chat">("lead_form");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [shakeFieldId, setShakeFieldId] = useState<string | null>(null);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const BACKEND_URL = "https://connect.petstore.co.ke";
  const WELCOME_MSG = "Hi there! Welcome to Petstore Kenya. How can we help you today?";

  // Load session from sessionStorage on mount
  useEffect(() => {
    const savedId = sessionStorage.getItem("petstore_conversation_id");
    const savedName = sessionStorage.getItem("petstore_visitor_name");
    const savedEmail = sessionStorage.getItem("petstore_visitor_email");
    const savedPhone = sessionStorage.getItem("petstore_visitor_phone");

    if (savedId && savedName) {
      setConversationId(savedId);
      setVisitorName(savedName);
      if (savedEmail) setVisitorEmail(savedEmail);
      if (savedPhone) setVisitorPhone(savedPhone);
      setStep("chat");
    }
  }, []);

  // Scroll to bottom of message list whenever messages or typing state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Load and poll messages when chat step is active and booth is open
  useEffect(() => {
    if (step === "chat" && conversationId && isOpen) {
      // Initial load
      fetchMessages();

      // Start polling
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [step, conversationId, isOpen]);

  // Polling management
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      pollMessages();
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Fetch all messages for the current conversation
  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/messages/${conversationId}`);
      const data = await response.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
        
        // Check if support has ended conversation remotely
        const ended = data.messages.some(
          (m: any) => m.senderType === "system" && m.content === "Support has ended this conversation."
        );
        if (ended) {
          stopPolling();
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // Poll for message updates
  const pollMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/messages/${conversationId}`);
      const data = await response.json();
      if (data.success && data.messages) {
        if (data.messages.length !== messages.length) {
          setMessages(data.messages);
          setIsTyping(false);
        }
      }
    } catch (err) {
      // Silent error
    }
  };

  // Handle lead form submission
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim()) {
      shakeField("lead-name");
      return;
    }
    if (!visitorEmail.trim() || !visitorEmail.includes("@")) {
      shakeField("lead-email");
      return;
    }
    if (!visitorPhone.trim()) {
      shakeField("lead-phone");
      return;
    }

    const submitBtn = document.getElementById("petstore-lead-submit") as HTMLButtonElement | null;
    if (submitBtn) submitBtn.disabled = true;

    try {
      const context = {
        url: window.location.href,
        path: location.pathname,
        title: document.title,
      };

      const response = await fetch(`${BACKEND_URL}/api/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: visitorName.trim(),
          email: visitorEmail.trim(),
          phone: visitorPhone.trim(),
          context,
          source: "website",
        }),
      });

      const data = await response.json();

      if (data.success && data.conversationId) {
        setConversationId(data.conversationId);
        setStep("chat");
        
        // Persist session
        sessionStorage.setItem("petstore_conversation_id", data.conversationId);
        sessionStorage.setItem("petstore_visitor_name", visitorName.trim());
        sessionStorage.setItem("petstore_visitor_email", visitorEmail.trim());
        sessionStorage.setItem("petstore_visitor_phone", visitorPhone.trim());

        const initialMsg: Message = {
          senderType: "system",
          content: `Welcome ${visitorName.trim()}! An assistant will be with you shortly.`,
          timestamp: new Date().toISOString(),
        };
        setMessages([initialMsg]);
      } else {
        throw new Error(data.message || "Failed to start conversation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to connect. Please check details and try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  // Shake invalid field helper
  const shakeField = (fieldId: string) => {
    setShakeFieldId(fieldId);
    setTimeout(() => {
      setShakeFieldId(null);
    }, 400);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const text = messageInput.trim();
    if (!text || !conversationId) return;

    setMessageInput("");
    setIsSending(true);

    // Optimistic visitor message append
    const userMsg: Message = {
      senderType: "visitor",
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true); // Assume AI will reply

    try {
      const context = {
        url: window.location.href,
        path: location.pathname,
        title: document.title,
      };

      await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          context,
        }),
      });
      
      // Immediately trigger a fetch to catch updates (like message saving confirms)
      setTimeout(() => pollMessages(), 1000);
      setTimeout(() => pollMessages(), 2500);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errSystemMsg: Message = {
        senderType: "system",
        content: "Message delivery failed. Please check your connection.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errSystemMsg]);
      setIsTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  // End conversation
  const handleEndConversation = () => {
    // Stop polling
    stopPolling();

    // Send closing message to server
    if (conversationId) {
      // Non-blocking cleanup notification
      fetch(`${BACKEND_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: "Visitor has ended the chat session.",
          skipSave: true,
        }),
      }).catch(() => {});
    }

    // Reset local session storage
    sessionStorage.removeItem("petstore_conversation_id");
    sessionStorage.removeItem("petstore_visitor_name");
    sessionStorage.removeItem("petstore_visitor_email");
    sessionStorage.removeItem("petstore_visitor_phone");

    // Clear state
    setConversationId(null);
    setVisitorName("");
    setVisitorEmail("");
    setVisitorPhone("");
    setMessages([]);
    setStep("lead_form");
    setShowEndConfirm(false);
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Render check for ended status
  const isChatEnded = messages.some(
    (m) => m.senderType === "system" && m.content === "Support has ended this conversation."
  );

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        id="petstore-chat-bubble"
        className={isOpen ? "open" : ""}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open support chat"
      >
        {isOpen ? (
          // Close Icon
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        ) : (
          // Simple Chat Bubble Icon
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "26px", height: "26px" }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Window Panel */}
      <div id="petstore-chat-window" className={isOpen ? "visible" : ""}>
        {/* Header */}
        <div className="petstore-chat-header">
          <div className="petstore-chat-header-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
              <circle cx="11" cy="4" r="2"/>
              <circle cx="18" cy="8" r="2"/>
              <circle cx="20" cy="15" r="2"/>
              <circle cx="8" cy="9" r="2"/>
              <path d="M7.242 17.242a3 3 0 1 1-4.243-4.243 3 3 0 0 1 4.243 4.243Z"/>
              <path d="M17 14a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4Z"/>
              <path d="M10 14a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4Z"/>
            </svg>
          </div>
          <div className="petstore-chat-header-info">
            <h3>Petstore Kenya</h3>
            <p>Typically replies in minutes</p>
          </div>
          {step === "chat" && !isChatEnded && (
            <button
              className="petstore-chat-end-btn"
              onClick={() => setShowEndConfirm(true)}
              title="End Conversation"
              style={{ display: "block" }}
            >
              End Chat
            </button>
          )}
          <button className="petstore-chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Body Container */}
        <div className="petstore-chat-body">
          {step === "lead_form" ? (
            /* LEAD FORM STEP */
            <>
              <div className="petstore-welcome">
                <div className="petstore-welcome-emoji">🐾</div>
                <h4>Welcome to Petstore Kenya!</h4>
                <p>{WELCOME_MSG}</p>
              </div>
              <form onSubmit={handleSubmitLead} className="petstore-lead-form">
                <div className="petstore-form-group">
                  <label htmlFor="cb-lead-name">Your Name</label>
                  <input
                    type="text"
                    id="cb-lead-name"
                    placeholder="John Doe"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className={shakeFieldId === "lead-name" ? "petstore-shake" : ""}
                    required
                  />
                </div>
                <div className="petstore-form-group">
                  <label htmlFor="cb-lead-email">Email Address</label>
                  <input
                    type="email"
                    id="cb-lead-email"
                    placeholder="john@example.com"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className={shakeFieldId === "lead-email" ? "petstore-shake" : ""}
                    required
                  />
                </div>
                <div className="petstore-form-group">
                  <label htmlFor="cb-lead-phone">Phone Number</label>
                  <input
                    type="tel"
                    id="cb-lead-phone"
                    placeholder="+254 700 000 000"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className={shakeFieldId === "lead-phone" ? "petstore-shake" : ""}
                    required
                  />
                </div>
                <button type="submit" id="petstore-lead-submit" className="petstore-submit-btn">
                  Start Chat
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px", marginLeft: "6px", verticalAlign: "middle", display: "inline-block" }}>
                    <path d="m3 3 3 9-3 9 19-9Z"/>
                    <path d="M6 12h16"/>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            /* CHAT WINDOW STEP */
            <div className="petstore-messages">
              {messages.length === 0 ? (
                <div className="petstore-message system">
                  Send a message to start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => {
                  if (msg.senderType === "system") {
                    return (
                      <div key={index} className="petstore-message system">
                        {msg.content}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={index} className={`petstore-message ${msg.senderType}`}>
                      {msg.content}
                      <span className="petstore-message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="petstore-message agent petstore-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Footer Input Row */}
        {step === "chat" && !isChatEnded && (
          <form onSubmit={handleSendMessage} className="petstore-chat-footer">
            <div className="petstore-chat-input-wrap">
              <input
                type="text"
                className="petstore-chat-input"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={isSending}
                autoComplete="off"
              />
              <button
                type="submit"
                className="petstore-send-btn"
                disabled={isSending || !messageInput.trim()}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* Ended Chat Banner / Reset Action */}
        {step === "chat" && isChatEnded && (
          <div className="petstore-ended-banner">
            <div className="petstore-ended-icon">
              <svg viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#cbd5e1" />
              </svg>
            </div>
            <h4 className="petstore-ended-title">Chat Concluded</h4>
            <p className="petstore-ended-msg">
              This conversation has been ended by support.
            </p>
            <button className="petstore-ended-btn" onClick={handleEndConversation}>
              Start New Conversation
            </button>
          </div>
        )}

        {/* End Confirmation Overlay */}
        {showEndConfirm && (
          <div className="petstore-confirm-overlay">
            <p>Are you sure you want to end this conversation and start a new one?</p>
            <div className="petstore-confirm-buttons">
              <button className="petstore-confirm-btn yes" onClick={handleEndConversation}>
                Yes, End
              </button>
              <button className="petstore-confirm-btn no" onClick={() => setShowEndConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Brand Powered Footer */}
        <div className="petstore-powered-by">
          Powered by <a href="/" target="_blank" rel="noreferrer">Petstore Kenya</a>
        </div>
      </div>
      
      {/* Dynamic style for field shaking */}
      <style>{`
        @keyframes petstore-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
        }
        .petstore-shake {
          animation: petstore-shake 0.4s ease;
        }
      `}</style>
    </>
  );
}
