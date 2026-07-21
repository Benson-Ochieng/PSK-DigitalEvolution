import { useState } from "react";
import { useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export interface ReviewItem {
  id: string;
  author_name: string;
  avatar_bg?: string;
  relative_time: string;
  rating: number;
  text?: string;
  response?: string;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    author_name: "LYDIA ADHO",
    avatar_bg: "#6b21a8",
    relative_time: "2 months ago",
    rating: 5,
    text: "Best Customer service experience",
    response: "Wow, what a wonderful review! We're so glad you enjoyed the customer service at our store. Your feedback means...",
  },
  {
    id: "rev-2",
    author_name: "Pablo Vianney",
    avatar_bg: "#c2410c",
    relative_time: "2 months ago",
    rating: 4,
    text: "Very nice pet food, chakula ni tamu sana lowa punda ni paka wenge",
    response: "Thank you so much for your star rating! We're happy to hear your pets are enjoying the food from our store. Your...",
  },
  {
    id: "rev-3",
    author_name: "Silvia Chepkirui",
    avatar_bg: "#15803d",
    relative_time: "2 months ago",
    rating: 5,
    text: "",
    response: "We truly appreciate your 5-star rating! It brightens our day knowing that you're satisfied with our offerings. We hope...",
  },
  {
    id: "rev-4",
    author_name: "Subira Abdalla",
    avatar_bg: "#be185d",
    relative_time: "4 months ago",
    rating: 5,
    text: "",
    response: "We're truly grateful for your fantastic 5-star rating! Knowing that you've had a positive experience with us is so...",
  },
  {
    id: "rev-5",
    author_name: "Kennedy Waweru",
    avatar_bg: "#1d4ed8",
    relative_time: "4 months ago",
    rating: 5,
    text: "They have a wide variety of products. The customer care team is very helpful, and they deliver products in a timely manner. Highly recommend for any new comers. No extra - 10/10",
    response: "Thank you so much for your glowing review! We're delighted to hear that our customer care team left a positive...",
  },
  {
    id: "rev-6",
    author_name: "Zilpha Akinyi",
    avatar_bg: "#0f766e",
    relative_time: "4 months ago",
    rating: 5,
    text: "",
    response: "We deeply appreciate your 5-star rating! Knowing we met your expectations fills us with joy. Our goal is to provide a wonderful...",
  },
  {
    id: "rev-7",
    author_name: "Lyna Mohammed",
    avatar_bg: "#6b21a8",
    relative_time: "5 months ago",
    rating: 5,
    text: "Excellent pet store! The customer service is outstanding, and the staff are very helpful, understanding and patient. The store is clean, well-organized, and stocked with quality products. Amazing offers and sales! Definitely worth visiting. Highly recommend to all pet owners!",
    response: "We truly appreciate your fantastic review! It's wonderful to know that our team made such a positive impression. We're...",
  },
  {
    id: "rev-8",
    author_name: "Priya Garabi Bharadwaj",
    avatar_bg: "#0284c7",
    relative_time: "5 months ago",
    rating: 5,
    text: "",
    response: "We're so happy to receive your glowing rating! It's heartwarming to know that you had a positive experience with us. Looking...",
  },
  {
    id: "rev-9",
    author_name: "Brian Otieno",
    avatar_bg: "#15803d",
    relative_time: "5 months ago",
    rating: 5,
    text: "Best petshop",
    response: "Thanks a ton for this wonderful review! We're delighted that you enjoyed our store. Hope to see you and your furry friends...",
  },
  {
    id: "rev-10",
    author_name: "Stephen Maina",
    avatar_bg: "#475569",
    relative_time: "5 months ago",
    rating: 5,
    text: "Great customer service and delivery services.",
    response: "We truly appreciate your lovely feedback! It's fantastic to know you were happy with our service. We'd love to welcome...",
  },
  {
    id: "rev-11",
    author_name: "Alice Njeri",
    avatar_bg: "#b91c1c",
    relative_time: "6 months ago",
    rating: 5,
    text: "Prompt delivery and very fresh cat food! PetStore Kenya is my go-to shop in Nairobi.",
    response: "Thank you so much Alice! We pride ourselves on fast delivery and fresh products. See you again soon!",
  },
  {
    id: "rev-12",
    author_name: "David Ochieng",
    avatar_bg: "#4338ca",
    relative_time: "6 months ago",
    rating: 5,
    text: "Affordable prices compared to major supermarkets. Highly recommended!",
    response: "Thank you David! Direct sourcing lets us pass those savings directly to pet parents.",
  },
];

export function loader() {
  const page = getPage("reviews") || {
    title: "REVIEWS",
    seo: {
      title: "Customer Reviews — PetStore Kenya",
      description: "Read genuine Google reviews and customer feedback for PetStore Kenya.",
    },
  };
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Customer Reviews — PetStore Kenya";
  const description =
    data?.page?.seo?.description ||
    "Read genuine Google reviews and customer feedback for PetStore Kenya.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function ReviewsPage() {
  const { page } = useLoaderData() as any;
  const [visibleCount, setVisibleCount] = useState(10);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, INITIAL_REVIEWS.length));
  };

  const displayedReviews = INITIAL_REVIEWS.slice(0, visibleCount);

  return (
    <>
      <Navbar />

      <div
        className="page-container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2.5rem var(--page-pad) 5rem",
          fontFamily: "var(--font-sans)",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header Banner */}
        <PageHeader title={page?.title || "REVIEWS"} />

        {/* 2-Column Responsive Layout */}
        <div
          className="reviews-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "3rem",
            alignItems: "start",
          }}
        >
          {/* Left Column: Info & Contact Details */}
          <div
            style={{
              color: "#334155",
              fontSize: "0.98rem",
              lineHeight: "1.75",
            }}
          >
            <p style={{ marginBottom: "1.25rem" }}>
              We always strive to deliver the best of service to our clients. So we actively search for feedback from our customers to be able to improve in areas that we may have not met expectations.
            </p>

            <p style={{ marginBottom: "1.25rem" }}>
              If you have any feedback for our services, we would appreciate if you took the time to share it with us through our contact details:
            </p>

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "8px",
                borderLeft: "4px solid #1E5DA7",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ marginBottom: "0.75rem", fontWeight: "600" }}>
                Phone:{" "}
                <a
                  href="tel:+254795359292"
                  style={{ color: "#1E5DA7", textDecoration: "none" }}
                >
                  +254795359292
                </a>{" "}
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "400" }}>
                  (WhatsApp button at the bottom left)
                </span>
              </p>

              <p style={{ margin: 0, fontWeight: "600" }}>
                Email:{" "}
                <a
                  href="mailto:customercare@petstore.co.ke"
                  style={{ color: "#1E5DA7", textDecoration: "none" }}
                >
                  customercare@petstore.co.ke
                </a>
              </p>
            </div>

            <p style={{ marginBottom: "1.25rem" }}>
              If you want to share your experience publicly, click on the <strong>review us on Google</strong> button below &amp; help us serve you better.
            </p>

            <p style={{ fontWeight: "600", color: "#1e293b", marginTop: "1.5rem" }}>
              Thank you for choosing PetStore!
            </p>
          </div>

          {/* Right Column: Google Reviews Badge & Review Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Google Reviews Summary Header Box */}
            <div
              style={{
                backgroundColor: "#f0f4f8",
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* Store Badge Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                {/* Store Icon */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    backgroundColor: "#1E5DA7",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                  }}
                >
                  <i className="fa fa-shopping-bag" />
                </div>

                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E5DA7" }}>
                    Excellent
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                    PetStore Kenya
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#334155" }}>
                      4.4
                    </span>
                    <div style={{ color: "#f59e0b", fontSize: "0.85rem", display: "flex", gap: "2px" }}>
                      <i className="fa fa-star" />
                      <i className="fa fa-star" />
                      <i className="fa fa-star" />
                      <i className="fa fa-star" />
                      <i className="fa fa-star-half-o" />
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Based on 164 reviews
                    </span>

                    {/* Google Icon SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginLeft: "4px" }}>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <a
                  href="https://www.google.com/maps/place/PetStore+Kenya/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  See all reviews
                </a>

                <a
                  href="https://www.google.com/maps/place/PetStore+Kenya/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>Review us on</span>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path
                      fill="#ffffff"
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Review Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {displayedReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: "10px",
                    padding: "1.25rem 1.5rem",
                    border: "1px solid #e2e8f0",
                    position: "relative",
                  }}
                >
                  {/* Google G Logo in Top Right */}
                  <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>

                  {/* Header: Avatar, Name & Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.6rem" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        backgroundColor: rev.avatar_bg || "#1E5DA7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      {rev.author_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b" }}>
                        {rev.author_name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {rev.relative_time}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div style={{ color: "#f59e0b", fontSize: "0.88rem", display: "flex", gap: "3px", marginBottom: "0.6rem" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className={`fa ${i < rev.rating ? "fa-star" : "fa-star-o"}`}
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  {rev.text && (
                    <p style={{ margin: "0 0 0.85rem 0", color: "#334155", fontSize: "0.92rem", lineHeight: "1.6" }}>
                      {rev.text}
                    </p>
                  )}

                  {/* Response from the owner */}
                  {rev.response && (
                    <div
                      style={{
                        backgroundColor: "#e2e8f0",
                        borderRadius: "8px",
                        padding: "0.85rem 1rem",
                        marginTop: "0.6rem",
                        fontSize: "0.86rem",
                        color: "#334155",
                        lineHeight: "1.6",
                      }}
                    >
                      <strong style={{ color: "#1e293b", display: "block", marginBottom: "0.2rem" }}>
                        Response from the owner:
                      </strong>
                      {rev.response}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* More Reviews Button */}
            {visibleCount < INITIAL_REVIEWS.length && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  style={{
                    backgroundColor: "transparent",
                    color: "#475569",
                    border: "none",
                    fontSize: "0.92rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "0.5rem 1.5rem",
                    textDecoration: "underline",
                  }}
                >
                  More reviews
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
