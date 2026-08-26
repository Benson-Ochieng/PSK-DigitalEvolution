import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";

interface Message {
  id?: string;
  senderType: "visitor" | "agent" | "bot" | "system";
  senderName?: string;
  content: string;
  mediaUrls?: string[];
  timestamp: string;
}

export default function CommunicationBooth() {
  const location = useLocation();

  // Constants
  const BACKEND_URL = "https://connect.petstore.co.ke";
  const WELCOME_MSG = "Hi there! Welcome to Petstore Kenya. How can we help you and your pets today?";

  // State - Main flow
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"lead_form" | "chat">("lead_form");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");

  // State - Messages & Input
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // State - Media Attachment
  const [pendingMedia, setPendingMedia] = useState<{
    base64: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  // State - SLA & Escalation
  const [isSlaActive, setIsSlaActive] = useState(false);
  const [slaSecondsRemaining, setSlaSecondsRemaining] = useState(90);
  const [assignedAgent, setAssignedAgent] = useState<string | null>(null);

  // State - Ticket Modal & Card
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketDept, setTicketDept] = useState("General Support");
  const [ticketSubject, setTicketSubject] = useState("Assistance Request");
  const [ticketDesc, setTicketDesc] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [activeTicketPromptRef, setActiveTicketPromptRef] = useState<string | null>(null);

  // State - CSAT Rating
  const [showCsatBox, setShowCsatBox] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatHoverRating, setCsatHoverRating] = useState(0);
  const [csatFeedback, setCsatFeedback] = useState("");
  const [isSubmittingCsat, setIsSubmittingCsat] = useState(false);
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  // State - End Conversation
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [endedBannerText, setEndedBannerText] = useState<string>("");

  // Validation Shake
  const [shakeFieldId, setShakeFieldId] = useState<string | null>(null);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Clear unread count when widget is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Scroll to bottom of message list whenever messages or typing state changes
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isSlaActive, activeTicketPromptRef, showCsatBox]);

  // Initialize Socket.io and polling when chat is active
  useEffect(() => {
    if (step === "chat" && conversationId) {
      fetchMessages();
      startPolling();
      initSocket();
    } else {
      stopPolling();
      cleanupSocket();
    }

    return () => {
      stopPolling();
      cleanupSocket();
      if (slaTimerRef.current) clearInterval(slaTimerRef.current);
    };
  }, [step, conversationId]);

  // Dynamic Socket.io connection helper
  const initSocket = () => {
    if (socketRef.current) return;

    const connectToSocket = () => {
      try {
        const io = (window as any).io;
        if (!io) return;

        const socket = io(BACKEND_URL, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 4,
          timeout: 10000,
        });

        socket.on("connect", () => {
          if (conversationId) {
            socket.emit("join_conversation", conversationId);
          }
        });

        socket.on("new_message", (data: any) => {
          if (data.conversationId !== conversationId) return;
          setIsTyping(false);

          if (data.message) {
            setMessages((prev) => {
              const exists = prev.some(
                (m) =>
                  (m.id && m.id === data.message.id) ||
                  (m.content === data.message.content && m.senderType === data.message.senderType)
              );
              if (exists) return prev;
              return [...prev, data.message];
            });

            if (!isOpen) {
              setUnreadCount((c) => c + 1);
            }
          }
        });

        socket.on("agent_typing", (data: any) => {
          if (data.conversationId === conversationId) {
            setIsTyping(!!data.typing);
          }
        });

        socket.on("chat_escalated", (data: any) => {
          if (data.conversationId === conversationId) {
            startSlaCountdown(data.timeoutSeconds || 90);
          }
        });

        socket.on("agent_joined", (data: any) => {
          if (data.conversationId === conversationId) {
            stopSlaCountdown();
            setAssignedAgent(data.agentName || "Support Agent");
            const agentMsg: Message = {
              senderType: "system",
              content: `🧑‍💼 Agent ${data.agentName || "Support"} has joined the conversation.`,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, agentMsg]);
          }
        });

        socket.on("agent_timeout_ticket_prompt", (data: any) => {
          if (data.conversationId === conversationId) {
            stopSlaCountdown();
            setActiveTicketPromptRef(data.ticketRef || "UNAVAILABLE");
          }
        });

        socket.on("conversation_ended", (data: any) => {
          if (data.conversationId === conversationId) {
            stopPolling();
            stopSlaCountdown();
            setIsChatEnded(true);
            setEndedBannerText("Support has ended this conversation.");
          }
        });

        socketRef.current = socket;
      } catch (e) {
        console.warn("Socket.io initialization skipped or failed, using HTTP polling fallback.", e);
      }
    };

    if ((window as any).io) {
      connectToSocket();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
      script.async = true;
      script.onload = () => connectToSocket();
      document.head.appendChild(script);
    }
  };

  const cleanupSocket = () => {
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (e) {}
      socketRef.current = null;
    }
  };

  // Polling management (every 3.5 seconds)
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      pollMessages();
    }, 3500);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // SLA Countdown Management
  const startSlaCountdown = (seconds = 90) => {
    stopSlaCountdown();
    setIsSlaActive(true);
    setSlaSecondsRemaining(seconds);

    slaTimerRef.current = setInterval(() => {
      setSlaSecondsRemaining((prev) => {
        if (prev <= 1) {
          stopSlaCountdown();
          setActiveTicketPromptRef("TIMEOUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopSlaCountdown = () => {
    if (slaTimerRef.current) {
      clearInterval(slaTimerRef.current);
      slaTimerRef.current = null;
    }
    setIsSlaActive(false);
  };

  // Fetch all messages for the current conversation
  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/messages/${conversationId}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);

        // Check if support has ended conversation remotely
        const ended = data.messages.some(
          (m: any) =>
            m.senderType === "system" &&
            (m.content?.includes("ended this conversation") || m.content?.includes("closed"))
        );
        if (ended) {
          setIsChatEnded(true);
          setEndedBannerText("This conversation has been ended by support.");
          stopPolling();
          stopSlaCountdown();
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
      if (data.success && Array.isArray(data.messages)) {
        if (data.messages.length !== messages.length) {
          setMessages(data.messages);
          setIsTyping(false);

          if (!isOpen && data.messages.length > messages.length) {
            setUnreadCount((c) => c + (data.messages.length - messages.length));
          }

          const ended = data.messages.some(
            (m: any) =>
              m.senderType === "system" &&
              (m.content?.includes("ended this conversation") || m.content?.includes("closed"))
          );
          if (ended) {
            setIsChatEnded(true);
            setEndedBannerText("This conversation has been ended by support.");
            stopPolling();
            stopSlaCountdown();
          }
        }
      }
    } catch (err) {
      // Silent error
    }
  };

  // Shake invalid field helper
  const shakeField = (fieldId: string) => {
    setShakeFieldId(fieldId);
    setTimeout(() => {
      setShakeFieldId(null);
    }, 450);
  };

  // Handle lead form submission
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim()) {
      shakeField("cb-lead-name");
      return;
    }
    if (!visitorEmail.trim() || !visitorEmail.includes("@")) {
      shakeField("cb-lead-email");
      return;
    }
    if (!visitorPhone.trim()) {
      shakeField("cb-lead-phone");
      return;
    }

    const submitBtn = document.getElementById("petstore-lead-submit") as HTMLButtonElement | null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Connecting...";
    }

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

        const initialWelcomeMsg: Message = {
          senderType: "bot",
          content: `Hello ${visitorName.trim()}! 👋 I'm your Petstore Kenya Assistant.\n\nHow can I help you and your furry (or feathered!) friends today? 😊`,
          timestamp: new Date().toISOString(),
        };
        setMessages([initialWelcomeMsg]);
      } else {
        throw new Error(data.message || data.error || "Failed to start conversation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to connect. Please check your details and try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Start Chat";
      }
    }
  };

  // Handle media file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPendingMedia({
          base64: ev.target.result as string,
          filename: file.name,
          mimeType: file.type || "image/jpeg",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Send message (typed or option chip)
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();

    const text = (customText !== undefined ? customText : messageInput).trim();
    const media = pendingMedia;

    if ((!text && !media) || !conversationId || isSending) return;

    if (!customText) setMessageInput("");
    setPendingMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsSending(true);

    // Optimistic visitor message append
    const localMedia = media ? [media.base64] : undefined;
    const userMsg: Message = {
      senderType: "visitor",
      content: text || (media ? "Sent an image attachment" : ""),
      mediaUrls: localMedia,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    let mediaUrls: string[] = [];

    // Upload attachment if present
    if (media) {
      try {
        const upRes = await fetch(`${BACKEND_URL}/api/chat/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: media.base64,
            filename: media.filename,
            mimeType: media.mimeType,
          }),
        });
        const upData = await upRes.json();
        if (upData.success && upData.url) {
          mediaUrls.push(upData.url);
        }
      } catch (upErr) {
        console.warn("Attachment upload warning:", upErr);
      }
    }

    try {
      const context = {
        url: window.location.href,
        path: location.pathname,
        title: document.title,
      };

      const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          mediaUrls: mediaUrls.length ? mediaUrls : undefined,
          context,
          metadata: {
            customer: {
              name: visitorName || sessionStorage.getItem("petstore_visitor_name") || "Website Visitor",
              email: visitorEmail || sessionStorage.getItem("petstore_visitor_email") || "",
              phone: visitorPhone || sessionStorage.getItem("petstore_visitor_phone") || "",
            },
          },
        }),
      });

      const resData = await response.json();

      if (resData.escalated || resData.status === "queued_for_agent") {
        startSlaCountdown(90);
      }

      // Schedule immediate message check
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

  // Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      alert("Please fill in the subject and description.");
      return;
    }

    setIsSubmittingTicket(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: ticketDept,
          subject: ticketSubject.trim(),
          description: ticketDesc.trim(),
          customerName: visitorName,
          customerEmail: visitorEmail,
          customerPhone: visitorPhone,
          channel: "website_widget",
          conversationId,
          priority: "high",
        }),
      });

      const data = await res.json();
      setShowTicketModal(false);
      setActiveTicketPromptRef(null);
      setTicketDesc("");

      const shortRef = data.ticketId
        ? `TK-${data.ticketId.slice(-8).toUpperCase()}`
        : "SUBMITTED";

      const confirmMsg: Message = {
        senderType: "system",
        content: `✅ Support Ticket #${shortRef} created successfully! Our team will contact you shortly via email or phone.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMsg]);

      // Trigger CSAT prompt
      setShowCsatBox(true);
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Submit CSAT Rating
  const handleSubmitCsat = async () => {
    if (!csatRating || !conversationId) return;

    setIsSubmittingCsat(true);

    try {
      await fetch(`${BACKEND_URL}/api/chat/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          rating: csatRating,
          feedback: csatFeedback.trim(),
        }),
      });

      setCsatSubmitted(true);
      setTimeout(() => {
        setShowCsatBox(false);
      }, 3500);
    } catch (err) {
      console.error("Failed to submit CSAT rating:", err);
    } finally {
      setIsSubmittingCsat(false);
    }
  };

  // End conversation cleanly
  const handleEndConversation = async () => {
    stopPolling();
    stopSlaCountdown();

    if (conversationId) {
      try {
        await fetch(`${BACKEND_URL}/api/chat/conversations/${conversationId}/end`, {
          method: "POST",
        }).catch(() => {});
      } catch (e) {}
    }

    // Clear local session storage
    sessionStorage.removeItem("petstore_conversation_id");
    sessionStorage.removeItem("petstore_visitor_name");
    sessionStorage.removeItem("petstore_visitor_email");
    sessionStorage.removeItem("petstore_visitor_phone");

    // Update state to ended banner
    setShowEndConfirm(false);
    setIsChatEnded(true);
    setEndedBannerText("You have concluded this conversation.");
    setAssignedAgent(null);

    const endNoticeMsg: Message = {
      senderType: "system",
      content: "You have ended this conversation.",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, endNoticeMsg]);

    // Offer CSAT rating on end
    setShowCsatBox(true);
  };

  // Reset to brand new lead form
  const handleStartNewConversation = () => {
    setIsChatEnded(false);
    setEndedBannerText("");
    setConversationId(null);
    setVisitorName("");
    setVisitorEmail("");
    setVisitorPhone("");
    setMessages([]);
    setPendingMedia(null);
    setShowCsatBox(false);
    setCsatSubmitted(false);
    setCsatRating(0);
    setCsatFeedback("");
    setActiveTicketPromptRef(null);
    setStep("lead_form");
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Render markdown text & clickable links cleanly
  const renderFormattedText = (content: string) => {
    if (!content) return null;

    // URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const lines = content.split("\n");

    return lines.map((line, lineIdx) => {
      // Check for bullet lines
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("- ");
      const cleanLine = isBullet ? line.trim().replace(/^[•\-]\s*/, "") : line;

      // Parse bold **text** or *text* and URLs
      const parts = cleanLine.split(urlRegex);

      const parsedLine = parts.map((part, partIdx) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={partIdx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="petstore-msg-link"
            >
              {part}
            </a>
          );
        }

        // Parse bold *bold* or **bold**
        const boldParts = part.split(/(\*\*?[^*]+\*\*?)/g);
        return (
          <span key={partIdx}>
            {boldParts.map((sub, subIdx) => {
              if (sub.startsWith("**") && sub.endsWith("**")) {
                return <strong key={subIdx}>{sub.slice(2, -2)}</strong>;
              }
              if (sub.startsWith("*") && sub.endsWith("*")) {
                return <strong key={subIdx}>{sub.slice(1, -1)}</strong>;
              }
              return sub;
            })}
          </span>
        );
      });

      if (isBullet) {
        return (
          <div key={lineIdx} style={{ display: "flex", gap: "6px", margin: "3px 0" }}>
            <span>•</span>
            <div>{parsedLine}</div>
          </div>
        );
      }

      return (
        <div key={lineIdx} style={{ minHeight: line === "" ? "8px" : undefined }}>
          {parsedLine}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        id="petstore-chat-bubble"
        className={isOpen ? "open" : ""}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Petstore Support Chat"
      >
        {isOpen ? (
          // Close Cross Icon
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              fill="currentColor"
            />
          </svg>
        ) : (
          // Simple Chat Bubble Icon
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Unread notification badge */}
        {!isOpen && unreadCount > 0 && (
          <span id="petstore-chat-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Chat Window Panel */}
      <div id="petstore-chat-window" className={isOpen ? "visible" : ""}>
        {/* Header */}
        <div className="petstore-chat-header">
          <div className="petstore-chat-header-avatar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "20px", height: "20px" }}
            >
              <circle cx="11" cy="4" r="2" />
              <circle cx="18" cy="8" r="2" />
              <circle cx="20" cy="15" r="2" />
              <circle cx="8" cy="9" r="2" />
              <path d="M7.242 17.242a3 3 0 1 1-4.243-4.243 3 3 0 0 1 4.243 4.243Z" />
              <path d="M17 14a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4Z" />
              <path d="M10 14a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4Z" />
            </svg>
          </div>
          <div className="petstore-chat-header-info">
            <h3>Petstore Kenya</h3>
            <p>
              {assignedAgent
                ? `Live Agent: ${assignedAgent}`
                : isSlaActive
                ? "Connecting to live agent..."
                : "Typically replies in minutes"}
            </p>
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

          <button
            className="petstore-chat-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat window"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* 90-Second SLA Countdown Banner */}
        {isSlaActive && (
          <div className="petstore-sla-banner">
            <span>⏳ Waiting for live agent...</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
              {Math.floor(slaSecondsRemaining / 60)
                .toString()
                .padStart(2, "0")}
              :{(slaSecondsRemaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}

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
                  <label htmlFor="cb-lead-name">Your Full Name</label>
                  <input
                    type="text"
                    id="cb-lead-name"
                    placeholder="e.g. Mitzi Sales"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className={shakeFieldId === "cb-lead-name" ? "petstore-shake" : ""}
                    required
                  />
                </div>

                <div className="petstore-form-group">
                  <label htmlFor="cb-lead-email">Email Address</label>
                  <input
                    type="email"
                    id="cb-lead-email"
                    placeholder="mitzi@example.com"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className={shakeFieldId === "cb-lead-email" ? "petstore-shake" : ""}
                    required
                  />
                </div>

                <div className="petstore-form-group">
                  <label htmlFor="cb-lead-phone">Phone Number (M-Pesa / WhatsApp)</label>
                  <input
                    type="tel"
                    id="cb-lead-phone"
                    placeholder="0710507389"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className={shakeFieldId === "cb-lead-phone" ? "petstore-shake" : ""}
                    required
                  />
                </div>

                <button type="submit" id="petstore-lead-submit" className="petstore-submit-btn">
                  Start Chat
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: "16px", height: "16px", marginLeft: "6px", display: "inline-block" }}
                  >
                    <path d="m3 3 3 9-3 9 19-9Z" />
                    <path d="M6 12h16" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            /* CHAT WINDOW STEP */
            <div className="petstore-messages">
              {messages.length === 0 ? (
                <div className="petstore-message system">
                  Send a message or select an option to begin!
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

                  const isVisitor = msg.senderType === "visitor";
                  const bubbleTypeClass = isVisitor ? "visitor" : msg.senderType === "agent" ? "agent" : "bot";

                  return (
                    <div key={index} className={`petstore-message ${bubbleTypeClass}`}>
                      {/* Attached media preview */}
                      {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                        <div className="petstore-msg-media">
                          {msg.mediaUrls.map((url, uIdx) => (
                            <img
                              key={uIdx}
                              src={url}
                              alt="Attachment"
                              onClick={() => window.open(url, "_blank")}
                            />
                          ))}
                        </div>
                      )}

                      {/* Formatted message content */}
                      {renderFormattedText(msg.content)}

                      <span className="petstore-message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Quick Options Menu (Visible after greeting) */}
              {!isChatEnded && messages.length <= 2 && (
                <div className="petstore-options-menu">
                  <button
                    type="button"
                    className="petstore-opt-btn"
                    onClick={() => handleSendMessage(undefined, "Track my order 📦")}
                  >
                    1️⃣ Track my order 📦
                  </button>
                  <button
                    type="button"
                    className="petstore-opt-btn"
                    onClick={() => handleSendMessage(undefined, "Search for products 🛍️")}
                  >
                    2️⃣ Search for products 🛍️
                  </button>
                  <button
                    type="button"
                    className="petstore-opt-btn"
                    onClick={() => handleSendMessage(undefined, "Active discounts & coupons 🎫")}
                  >
                    3️⃣ Active discounts & coupons 🎫
                  </button>
                  <button
                    type="button"
                    className="petstore-opt-btn"
                    onClick={() => handleSendMessage(undefined, "Store hours & locations 📍")}
                  >
                    4️⃣ Store hours & locations 📍
                  </button>
                  <button
                    type="button"
                    className="petstore-opt-btn"
                    onClick={() => handleSendMessage(undefined, "I need to talk to a human agent 🧑‍💼")}
                  >
                    🧑‍💼 Talk to human agent
                  </button>
                </div>
              )}

              {/* Offline / Busy Agent Ticket Prompt Card */}
              {activeTicketPromptRef && (
                <div className="petstore-ticket-prompt-card">
                  <h5>📋 Support Team Offline or Busy</h5>
                  <p>
                    All representatives are currently helping other pet parents. Submit a quick
                    follow-up ticket and our team will get back to you promptly!
                  </p>
                  <button
                    type="button"
                    className="petstore-ticket-open-btn"
                    onClick={() => setShowTicketModal(true)}
                  >
                    🎫 Submit Support Ticket
                  </button>
                </div>
              )}

              {/* CSAT 1-5 Star Interactive Rating Box */}
              {showCsatBox && (
                <div className="petstore-csat-box">
                  {csatSubmitted ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "#10b981", fontWeight: 600 }}>
                      🎉 Thank you for your feedback! ⭐ ({csatRating}/5)
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                        How satisfied were you with this chat experience?
                      </p>
                      <div className="petstore-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`petstore-star ${
                              (csatHoverRating || csatRating) >= star ? "active" : ""
                            }`}
                            onMouseEnter={() => setCsatHoverRating(star)}
                            onMouseLeave={() => setCsatHoverRating(0)}
                            onClick={() => setCsatRating(star)}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      {csatRating > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                          <input
                            type="text"
                            placeholder="Optional comments..."
                            value={csatFeedback}
                            onChange={(e) => setCsatFeedback(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.15)",
                              background: "rgba(255,255,255,0.06)",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            className="petstore-submit-btn"
                            style={{ padding: "8px", fontSize: "12px" }}
                            onClick={handleSubmitCsat}
                            disabled={isSubmittingCsat}
                          >
                            {isSubmittingCsat ? "Submitting..." : "Submit Rating ⭐"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
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

        {/* Media Attachment Preview Bar */}
        {pendingMedia && (
          <div className="petstore-attach-preview">
            <img src={pendingMedia.base64} alt="Attachment Preview" />
            <span style={{ fontSize: "12px", color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pendingMedia.filename}
            </span>
            <button
              type="button"
              className="petstore-remove-img"
              onClick={() => {
                setPendingMedia(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer Input Row */}
        {step === "chat" && !isChatEnded && (
          <form onSubmit={handleSendMessage} className="petstore-chat-footer">
            <div className="petstore-chat-input-wrap">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {/* Paperclip attach button */}
              <button
                type="button"
                className="petstore-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo"
                aria-label="Attach photo"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

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
                disabled={isSending || (!messageInput.trim() && !pendingMedia)}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* Ended Chat Banner / Restart Conversation Action */}
        {step === "chat" && isChatEnded && (
          <div className="petstore-ended-banner">
            <div className="petstore-ended-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                  fill="#cbd5e1"
                />
              </svg>
            </div>
            <h4 className="petstore-ended-title">Chat Concluded</h4>
            <p className="petstore-ended-msg">
              {endedBannerText || "This conversation has been concluded."}
            </p>
            <button
              type="button"
              className="petstore-ended-btn"
              onClick={handleStartNewConversation}
            >
              Start New Conversation
            </button>
          </div>
        )}

        {/* End Confirmation Modal Overlay */}
        {showEndConfirm && (
          <div className="petstore-confirm-overlay">
            <p>Are you sure you want to end this conversation?</p>
            <div className="petstore-confirm-buttons">
              <button
                type="button"
                className="petstore-confirm-btn yes"
                onClick={handleEndConversation}
              >
                Yes, End
              </button>
              <button
                type="button"
                className="petstore-confirm-btn no"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Support Ticket Modal Overlay */}
        {showTicketModal && (
          <div className="petstore-modal-overlay">
            <div className="petstore-modal-header">
              <h4>🎫 Create Support Ticket</h4>
              <button
                type="button"
                className="petstore-modal-close"
                onClick={() => setShowTicketModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="petstore-lead-form" style={{ padding: 0 }}>
              <div className="petstore-form-group">
                <label>Department</label>
                <select
                  value={ticketDept}
                  onChange={(e) => setTicketDept(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--petstore-border)",
                    color: "#fff",
                  }}
                >
                  <option value="General Support" style={{ background: "#1e293b", color: "#fff" }}>
                    General Support
                  </option>
                  <option value="Orders & Account" style={{ background: "#1e293b", color: "#fff" }}>
                    Orders & Account
                  </option>
                  <option value="Product Quality" style={{ background: "#1e293b", color: "#fff" }}>
                    Product Quality & Info
                  </option>
                  <option value="Returns / Refunds" style={{ background: "#1e293b", color: "#fff" }}>
                    Returns / Refunds
                  </option>
                  <option value="Payment / Invoice" style={{ background: "#1e293b", color: "#fff" }}>
                    Payment / Invoice Issue
                  </option>
                </select>
              </div>

              <div className="petstore-form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Brief issue summary"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
              </div>

              <div className="petstore-form-group">
                <label>Issue Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your request or question in detail..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--petstore-border)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="petstore-submit-btn"
                disabled={isSubmittingTicket}
              >
                {isSubmittingTicket ? "Submitting..." : "Submit Ticket 📩"}
              </button>
            </form>
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
          animation: petstore-shake 0.4s ease !important;
          border-color: #ef4444 !important;
        }
      `}</style>
    </>
  );
}
