import { useState, useEffect, useRef } from "react";

export interface UpsellProduct {
  id: number;
  name: string;
  brand: string;
  image_url: string | null;
  regular_price: number;
  sale_price: number;
  weight_kg: number | null;
  slug?: string;
  category?: string;
  isPrimary?: boolean;
}

interface CheckoutUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: UpsellProduct) => void;
  product: UpsellProduct;
  timerSeconds?: number;
}

export function CheckoutUpsellModal({
  isOpen,
  onClose,
  onAddToCart,
  product,
  timerSeconds = 30,
}: CheckoutUpsellModalProps) {
  const [countdown, setCountdown] = useState(timerSeconds || 30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Reset and start countdown when opened, auto-close when countdown ends (0s)
  useEffect(() => {
    if (isOpen) {
      const initialSeconds = timerSeconds && timerSeconds > 0 ? timerSeconds : 30;
      setCountdown(initialSeconds);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            onCloseRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, timerSeconds]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="upsell-modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
        padding: "1rem",
        animation: "fadeIn 0.25s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="upsell-modal-container"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          padding: "2rem 1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          animation: "scaleIn 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Countdown Badge */}
        <div
          style={{
            border: "2px solid #ef4444",
            borderRadius: "6px",
            padding: "0.2rem 0.85rem",
            color: "#ef4444",
            fontWeight: "bold",
            fontSize: "1.2rem",
            lineHeight: 1.2,
            fontFamily: "var(--font-sans)",
            userSelect: "none",
          }}
        >
          {countdown}
        </div>

        {/* Heading */}
        <h2
          style={{
            margin: "0.85rem 0 1.25rem 0",
            color: "#1e5da7",
            fontSize: "1.6rem",
            fontWeight: 800,
            textAlign: "center",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.02em",
          }}
        >
          Limited Time Offer!
        </h2>

        {/* Product Card */}
        <div
          style={{
            width: "100%",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
            padding: "1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Product Image */}
          <div
            style={{
              width: "100%",
              height: "150px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
              />
            ) : (
              <span style={{ fontSize: "3rem" }}>🐾</span>
            )}
          </div>

          {/* Product Name */}
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#374151",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.35,
              maxWidth: "92%",
              marginBottom: "0.75rem",
            }}
          >
            {product.name}
          </div>

          {/* Regular Price Struck Through */}
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "#9ca3af",
              textDecoration: "line-through",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.2,
            }}
          >
            {Math.round(product.regular_price)}KSh
          </div>

          {/* Sale Price in Red */}
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#dc2626",
              fontFamily: "var(--font-sans)",
              marginTop: "0.2rem",
              lineHeight: 1.2,
            }}
          >
            {Math.round(product.sale_price)}KSh
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            width: "100%",
            marginTop: "1.5rem",
          }}
        >
          {/* Add to Cart & Checkout Button */}
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            style={{
              flex: "1 1 50%",
              background: "#00c853",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.75rem 0.5rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              boxShadow: "0 2px 6px rgba(0, 200, 83, 0.3)",
              transition: "background 0.2s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#00b248")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#00c853")}
          >
            Add to Cart & Checkout
          </button>

          {/* Do Not Add to Cart & Checkout Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: "1 1 50%",
              background: "#737373",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.75rem 0.5rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              boxShadow: "0 2px 6px rgba(115, 115, 115, 0.2)",
              transition: "background 0.2s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#5a5a5a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#737373")}
          >
            Do Not Add to Cart & Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
