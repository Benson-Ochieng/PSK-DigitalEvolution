import { useState, useEffect, useRef } from "react";

interface Review {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

const FALLBACK_REVIEWS: Review[] = [
  {
    author_name: "Nelson M.",
    rating: 5,
    relative_time_description: "a year ago",
    text: "Excellent service! They have a wide variety of premium pet foods and the delivery was fast. Highly recommend PetStore Kenya!"
  },
  {
    author_name: "Tabitha K.",
    rating: 5,
    relative_time_description: "2 months ago",
    text: "Very helpful customer support. They assisted me in selecting the right puppy food and it was delivered within hours."
  },
  {
    author_name: "Alex M.",
    rating: 5,
    relative_time_description: "3 weeks ago",
    text: "The food comparison feature on the website is amazing. Prices are competitive and the order process is very smooth."
  },
  {
    author_name: "Mercy W.",
    rating: 5,
    relative_time_description: "5 days ago",
    text: "Top-notch quality products! Best pet shop in Nairobi. Will definitely purchase again."
  }
];

export default function GoogleReviewsPopup() {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch reviews on mount
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/google-reviews");
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.warn("[GoogleReviewsPopup] Failed to fetch reviews, using fallbacks:", err);
      }
    }
    fetchReviews();
  }, []);

  const clearAllTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
  };

  const startLoop = () => {
    clearAllTimers();

    // Show current review
    setIsVisible(true);

    // Hide after 6 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    // Every 10 seconds, move to next review and show it
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      setIsVisible(true);
      
      // Hide after 6 seconds
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    }, 10000);
  };

  // Control rotation and show/hide states
  useEffect(() => {
    if (reviews.length === 0) return;

    // Start loop after 1.5 seconds initial delay
    showTimeoutRef.current = setTimeout(() => {
      startLoop();
    }, 1500);

    return () => {
      clearAllTimers();
    };
  }, [reviews.length]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    clearAllTimers();

    // Schedule the next review to show in 10 seconds (the next cycle)
    showTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      startLoop();
    }, 10000);
  };

  // Pause rotation on hover
  const handleMouseEnter = () => {
    clearAllTimers();
  };

  const handleMouseLeave = () => {
    // Wait 4 seconds, then slide out
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);

      // Wait 500ms for slide out transition, then increment and start loop
      showTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        startLoop();
      }, 500);
    }, 4000);
  };

  if (reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];
  const initial = currentReview.author_name ? currentReview.author_name.charAt(0).toUpperCase() : "P";

  // Colors for initials avatars
  const avatarColors = ["#1E5DA7", "#5ba672", "#fb8e28", "#e11d48", "#8b5cf6", "#06b6d4"];
  const avatarBg = avatarColors[currentIndex % avatarColors.length];

  return (
    <>
      <div
        className={`google-review-popup-container ${isVisible ? "slide-in" : "slide-out"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Close Button */}
        <button className="google-review-close-btn" onClick={handleClose} aria-label="Dismiss review">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>

        {/* Google G Logo Badge */}
        <div className="google-g-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>

        <div className="google-review-inner">
          {/* Avatar */}
          <div className="google-review-avatar-container">
            {currentReview.profile_photo_url ? (
              <img
                src={currentReview.profile_photo_url}
                alt={currentReview.author_name}
                className="google-review-avatar"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="google-review-avatar-fallback" style={{ backgroundColor: avatarBg }}>
                {initial}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="google-review-content">
            <div className="google-review-header">
              <span className="google-review-author">{currentReview.author_name}</span>
              <span className="google-review-verified">Just left us a 5★ review</span>
            </div>
            
            <div className="google-review-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="star-icon">★</span>
              ))}
            </div>
            
            <div className="google-review-time">
              {currentReview.relative_time_description}
            </div>

            {/* Hover Tooltip or detailed text (optional snippet, matching screenshot layout) */}
            {currentReview.text && (
              <p className="google-review-text-tooltip">
                "{currentReview.text.length > 80 ? currentReview.text.slice(0, 77) + "..." : currentReview.text}"
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .google-review-popup-container {
          position: fixed;
          bottom: 104px; /* Float nicely above the chat bubble */
          right: 24px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          padding: 14px 16px;
          width: 320px;
          z-index: 99990;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          overflow: hidden;
          cursor: pointer;
        }

        @media (max-width: 480px) {
          .google-review-popup-container {
            bottom: 90px;
            right: 16px;
            width: 290px;
            padding: 12px;
          }
        }

        .google-review-popup-container.slide-in {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .google-review-popup-container.slide-out {
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          pointer-events: none;
        }

        .google-review-inner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .google-review-avatar-container {
          flex-shrink: 0;
        }

        .google-review-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #fff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .google-review-avatar-fallback {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #ffffff;
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-shadow: 0 1px 1px rgba(0,0,0,0.15);
        }

        .google-review-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .google-review-header {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px;
          line-height: 1.25;
        }

        .google-review-author {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
        }

        .google-review-verified {
          font-size: 0.72rem;
          font-weight: 500;
          color: #64748b;
        }

        .google-review-rating {
          display: flex;
          color: #fb8e28; /* ratings orange color */
          font-size: 0.85rem;
          margin-top: 1px;
        }

        .google-review-time {
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: 1px;
        }

        .google-review-text-tooltip {
          font-size: 0.75rem;
          color: #475569;
          margin: 6px 0 0 0;
          line-height: 1.4;
          font-style: italic;
          border-top: 1px solid #f1f5f9;
          padding-top: 6px;
        }

        /* Close Button styling */
        .google-review-close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: transparent;
          border: none;
          color: #94a3b8;
          width: 18px;
          height: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: 50%;
          transition: background-color 0.2s, color 0.2s;
        }

        .google-review-close-btn:hover {
          background-color: #f1f5f9;
          color: #475569;
        }

        .google-review-close-btn svg {
          width: 12px;
          height: 12px;
        }

        /* Google Logo Badge */
        .google-g-badge {
          position: absolute;
          top: 10px;
          right: 30px;
          opacity: 0.95;
          display: flex;
          align-items: center;
        }
      `}</style>
    </>
  );
}
