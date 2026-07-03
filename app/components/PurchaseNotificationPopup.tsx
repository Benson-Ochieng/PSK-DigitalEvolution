import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";

interface PurchaseEvent {
  productName: string;
  slug: string;
  imageUrl: string;
}

const PURCHASE_PRODUCTS: PurchaseEvent[] = [
  {
    productName: "Dudu Bites Dog Biscuit 100g (40pcs)",
    slug: "katango-dudu-bites-dog-biscuit-100g-40pcs",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2024/05/WhatsApp-Image-2024-04-29-at-12.48.32.jpeg",
  },
  {
    productName: "Proline Bentonite Clumping Activated Carbon Cat Litter 10l",
    slug: "proline-bentonite-clumping-activated-carbon-cat-litter-10l",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-09-at-15.27.49-1.jpeg",
  },
  {
    productName: "Bonnie Adult Cat Food - Chicken 0.5kg",
    slug: "bonnie-adult-cat-food-chicken",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2019/09/Bonnie-Adult-Cat-Chicken-500g-min.png",
  },
  {
    productName: "Churu Cat Treats Chicken Recipe 4 Tubes",
    slug: "churu-cat-lickable-treats-chicken-recipe",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2026/01/CHURU-CHICKEN-RECIPE-4CT.png",
  },
  {
    productName: "Bioline Dental Water for Dogs & Cats 300ml",
    slug: "bioline-dental-water-for-dogs-cats-300ml",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2023/12/DENTAL-WATER-FOR-CATS-DOGS.jpg",
  },
  {
    productName: "Biten Joy Beef & Chicken Treats",
    slug: "biten-joy-beef-chicken-duck-dog-treats",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2026/02/Biten-Joy-Beef-Chicken.png",
  },
  {
    productName: "Bonnie Budgie Bird Food 500g",
    slug: "bonnie-budgie-bird-food-500gr-3",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2021/12/Bonnie-Budgie-Food-500g-01.jpg",
  },
  {
    productName: "Bonnie Canary Bird Food 500g",
    slug: "bonnie-canary-bird-food-500gr-3",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2021/12/Bonnie-Canary-Food-500g-01.jpg",
  },
  {
    productName: "Bonnie Adult Cat Food Canned Chicken Chunks 400g",
    slug: "bonnie-adult-cat-food-canned-chicken-chunks-in-gravy-0-4kg",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2018/02/Bonnie-Adult-Cat-Canned-Chicken-Chunks-in-Gravy-1080x1080-c.png",
  },
  {
    productName: "Bonnie Adult Cat Food Canned Fish Chunks 400g",
    slug: "bonnie-adult-cat-food-canned-fish-chunks-in-gravy-0-4kg",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2018/02/Untitled-design-24.png",
  },
  {
    productName: "Bonnie Adult Cat Food - Cocktail 0.5kg",
    slug: "bonnie-adult-cat-food-cocktail",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2019/09/Bonnie-Adult-Cat-Cocktail-500g-min.png",
  },
  {
    productName: "Bonnie Adult Dog Food - Beef 15kg",
    slug: "bonnie-adult-dog-food-beef-15kg",
    imageUrl: "https://petstore.co.ke/wp-content/uploads/2017/07/Bonnie-Adult-Dog-Beef-min.png",
  },
];

const KENYAN_NAMES = [
  "Njoki", "Mwangi", "Kamau", "Ochieng", "Amina", 
  "Wanjiku", "Otieno", "Mutua", "Chepngetich", "Njoroge", 
  "Fatuma", "Kiprono", "Anyango", "Karanja", "Atieno", 
  "Zawadi", "Baraka", "Waweru", "Juma", "Moraa"
];

const KENYAN_LOCATIONS = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", 
  "Karen", "Westlands", "Kilimani", "Ngong", "Runda", 
  "Thika", "Kitengela", "Ruiru", "Lavington", "Gigiri"
];

const TIME_OFFSETS = [
  "About 5 minutes ago", "About 12 minutes ago", "About 24 minutes ago", 
  "About 45 minutes ago", "About 1 hour ago", "About 2 hours ago", "About 8 hours ago"
];

export default function PurchaseNotificationPopup() {
  const [currentEvent, setCurrentEvent] = useState<{
    name: string;
    location: string;
    timeAgo: string;
    product: PurchaseEvent;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialShowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random purchase event
  const generateRandomEvent = () => {
    const randomProduct = PURCHASE_PRODUCTS[Math.floor(Math.random() * PURCHASE_PRODUCTS.length)];
    const randomName = KENYAN_NAMES[Math.floor(Math.random() * KENYAN_NAMES.length)];
    const randomLocation = KENYAN_LOCATIONS[Math.floor(Math.random() * KENYAN_LOCATIONS.length)];
    const randomTime = TIME_OFFSETS[Math.floor(Math.random() * TIME_OFFSETS.length)];

    return {
      name: randomName,
      location: randomLocation,
      timeAgo: randomTime,
      product: randomProduct,
    };
  };

  const clearAllTimers = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (initialShowTimeoutRef.current) clearTimeout(initialShowTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const triggerShowEvent = () => {
    const newEvent = generateRandomEvent();
    setCurrentEvent(newEvent);
    setIsVisible(true);

    // Slide out after 6 seconds
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  };

  useEffect(() => {
    // Initial load: show the first event after 8 seconds of page load
    initialShowTimeoutRef.current = setTimeout(() => {
      triggerShowEvent();
    }, 8000);

    // Repeat every 3 minutes (180,000 milliseconds)
    intervalRef.current = setInterval(() => {
      triggerShowEvent();
    }, 180000);

    return () => {
      clearAllTimers();
    };
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };

  const handleMouseEnter = () => {
    // Keep visible by clearing the slide-out timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Slide out after a short grace period of 3 seconds
    if (isVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
  };

  if (!currentEvent) return null;

  return (
    <>
      <div
        className={`purchase-notification-container ${isVisible ? "slide-in" : "slide-out"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link to={`/product/${currentEvent.product.slug}`} className="purchase-notification-content-link">
          {/* Left Side: Product Image (White Background Container) */}
          <div className="purchase-notification-left">
            <img
              src={currentEvent.product.imageUrl}
              alt={currentEvent.product.productName}
              className="purchase-notification-image"
            />
          </div>

          {/* Right Side: Buyer details (Solid Blue Background Container) */}
          <div className="purchase-notification-right">
            {/* Wave overlay graphic */}
            <div className="wave-decor">
              <svg viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 15C30 15 30 5 60 5C90 5 90 25 120 25V28H0V15Z" fill="rgba(255, 255, 255, 0.12)" />
              </svg>
            </div>

            <div className="buyer-info">
              <span className="buyer-name">{currentEvent.name}</span> purchased a
            </div>
            <div className="product-name">
              {currentEvent.product.productName}
            </div>
            <div className="time-ago">
              {currentEvent.timeAgo}
            </div>
          </div>
        </Link>

        {/* Close Button */}
        <button className="purchase-notification-close-btn" onClick={handleClose} aria-label="Dismiss notification">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <style>{`
        .purchase-notification-container {
          position: fixed;
          bottom: 1.5rem;
          left: 1rem;
          width: 360px;
          height: 80px;
          background: #ffffff;
          border-radius: 6px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          z-index: 99999; /* Displayed on top of the WhatsApp floating button */
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          overflow: hidden;
          display: flex;
        }

        @media (max-width: 480px) {
          .purchase-notification-container {
            bottom: 5.5rem;
            left: 1rem;
            width: 290px;
            height: 72px;
          }
        }

        .purchase-notification-container.slide-in {
          transform: translateX(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .purchase-notification-container.slide-out {
          transform: translateX(-30px) scale(0.95);
          opacity: 0;
          pointer-events: none;
        }

        .purchase-notification-content-link {
          display: flex;
          width: 100%;
          height: 100%;
          text-decoration: none;
          color: inherit;
        }

        .purchase-notification-content-link:hover,
        .purchase-notification-content-link:focus,
        .purchase-notification-content-link *,
        .purchase-notification-content-link *:hover {
          text-decoration: none !important;
        }

        /* Left Side Image Container */
        .purchase-notification-left {
          width: 80px;
          height: 100%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          flex-shrink: 0;
        }

        .purchase-notification-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        /* Right Side Text Block */
        .purchase-notification-right {
          flex: 1;
          background-color: #0a80e5; /* Exact blue color match */
          padding: 10px 14px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          text-align: left;
        }

        .buyer-info {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          line-height: 1.2;
          margin-bottom: 2px;
          z-index: 2;
        }

        .buyer-name {
          font-weight: 700;
        }

        .product-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
          z-index: 2;
        }

        .time-ago {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
          z-index: 2;
        }

        /* Wave decoration at the bottom-right */
        .wave-decor {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 140px;
          opacity: 0.6;
          pointer-events: none;
          z-index: 1;
        }

        /* Close Button inside blue portion */
        .purchase-notification-close-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          width: 18px;
          height: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: 50%;
          transition: background-color 0.2s, color 0.2s;
          z-index: 10;
        }

        .purchase-notification-close-btn:hover {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .purchase-notification-close-btn svg {
          width: 12px;
          height: 12px;
        }
      `}</style>
    </>
  );
}
