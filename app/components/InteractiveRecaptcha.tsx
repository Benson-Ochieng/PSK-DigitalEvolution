import { useState } from "react";

interface InteractiveRecaptchaProps {
  name?: string;
  onVerify?: (token: string) => void;
}

const CHALLENGES = [
  {
    target: "motorcycles",
    instruction: "Select all squares with motorcycles",
    images: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80"
    ]
  },
  {
    target: "traffic lights",
    instruction: "Select all squares with traffic lights",
    images: [
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=150&q=80"
    ]
  }
];

export function InteractiveRecaptcha({ name = "mock_recaptcha", onVerify }: InteractiveRecaptchaProps) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedSquares, setSelectedSquares] = useState<Record<number, boolean>>({});

  const challenge = CHALLENGES[challengeIdx];

  const handleCheckboxClick = () => {
    if (verified) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowModal(true);
    }, 400);
  };

  const toggleSquare = (idx: number) => {
    setSelectedSquares(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleVerify = () => {
    setShowModal(false);
    setVerified(true);
    if (onVerify) onVerify("verified_token");
  };

  const handleRefresh = () => {
    setChallengeIdx(prev => (prev + 1) % CHALLENGES.length);
    setSelectedSquares({});
  };

  const selectedCount = Object.values(selectedSquares).filter(Boolean).length;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "302px" }}>
      <input type="hidden" name={name} value={verified ? "on" : ""} />

      {/* Main reCAPTCHA Widget Box */}
      <div style={{
        width: "100%",
        maxWidth: "302px",
        height: "76px",
        background: "#f9f9f9",
        border: "1px solid #d3d3d3",
        borderRadius: "3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        boxSizing: "border-box",
        marginTop: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            onClick={handleCheckboxClick}
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid #c1c1c1",
              borderRadius: "2px",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              cursor: verified ? "default" : "pointer"
            }}
          >
            {loading ? (
              <div style={{
                width: "14px",
                height: "14px",
                border: "2px solid #1A73E8",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite"
              }} />
            ) : verified ? (
              <svg viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
                <path
                  fill="none"
                  stroke="#009933"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 12l5 5L20 6"
                />
              </svg>
            ) : null}
          </div>
          <span
            onClick={handleCheckboxClick}
            style={{
              fontSize: "14px",
              color: "#2d2d2d",
              fontFamily: "Roboto, helvetica, arial, sans-serif",
              cursor: verified ? "default" : "pointer",
              userSelect: "none"
            }}
          >
            I'm not a robot
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA logo" style={{ width: "32px", height: "32px" }} />
          <span style={{ fontSize: "8px", color: "#555555", fontFamily: "Roboto, helvetica, arial, sans-serif" }}>reCAPTCHA</span>
          <div style={{ display: "flex", gap: "4px", fontSize: "8px", fontFamily: "Roboto, helvetica, arial, sans-serif" }}>
            <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: "#555555", textDecoration: "none" }}>Privacy</a>
            <span style={{ color: "#555555" }}>-</span>
            <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noopener noreferrer" style={{ color: "#555555", textDecoration: "none" }}>Terms</a>
          </div>
        </div>
      </div>

      {/* Interactive Challenge Modal Popup */}
      {showModal && (
        <div style={{
          position: "absolute",
          top: "-340px",
          left: "0",
          width: "320px",
          background: "#ffffff",
          borderRadius: "3px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          zIndex: 99999,
          border: "1px solid #ccc",
          fontFamily: "Roboto, sans-serif"
        }}>
          {/* Blue Header */}
          <div style={{
            background: "#1A73E8",
            color: "#ffffff",
            padding: "16px 20px"
          }}>
            <div style={{ fontSize: "14px", fontWeight: 400, opacity: 0.9 }}>Select all squares with</div>
            <div style={{ fontSize: "24px", fontWeight: 700, textTransform: "lowercase", marginTop: "2px" }}>
              {challenge.target}
            </div>
            <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.85 }}>
              If there are none, click skip
            </div>
          </div>

          {/* 4x4 Grid of Tiles */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "3px",
            padding: "8px",
            background: "#ffffff"
          }}>
            {challenge.images.map((imgUrl, idx) => {
              const isSelected = !!selectedSquares[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleSquare(idx)}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    cursor: "pointer",
                    overflow: "hidden",
                    border: isSelected ? "3px solid #1A73E8" : "1px solid #eee",
                    boxSizing: "border-box"
                  }}
                >
                  <img
                    src={imgUrl}
                    alt="challenge tile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: isSelected ? "scale(0.92)" : "scale(1)",
                      transition: "transform 0.15s ease"
                    }}
                  />
                  {isSelected && (
                    <div style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      background: "#1A73E8",
                      color: "#ffffff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Toolbar */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderTop: "1px solid #e5e5e5",
            background: "#ffffff"
          }}>
            <div style={{ display: "flex", gap: "14px", color: "#555", fontSize: "18px" }}>
              <span onClick={handleRefresh} style={{ cursor: "pointer" }} title="Reload Challenge">🔄</span>
              <span style={{ cursor: "pointer" }} title="Audio Challenge">🎧</span>
              <span style={{ cursor: "pointer" }} title="Help">ℹ️</span>
            </div>
            <button
              type="button"
              onClick={handleVerify}
              style={{
                background: "#1A73E8",
                color: "#ffffff",
                border: "none",
                borderRadius: "2px",
                padding: "8px 22px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {selectedCount > 0 ? "VERIFY" : "SKIP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
