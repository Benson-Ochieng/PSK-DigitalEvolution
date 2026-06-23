import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "About Us — PetStore Kenya" },
    { name: "description", content: "Learn about PetStore Kenya, our mission, values, and how we make pet food shopping convenient and affordable across Kenya." },
  ];
}

export default function AboutUs() {
  return (
    <>
      <Navbar />
      <div 
        className="page-container" 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "3rem var(--page-pad) 5rem",
          fontFamily: "var(--font-sans)",
          backgroundColor: "#ffffff"
        }}
      >
        
        {/* Title Banner */}
        <PageHeader title="About Us" />

        {/* Content Section */}
        <div 
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333",
            lineHeight: "1.8",
            fontSize: "1.05rem"
          }}
        >
          {/* Paragraph 1 */}
          <p style={{ marginBottom: "1.8rem" }}>
            <strong style={{ color: "#1E5DA7" }}>PetStore Kenya</strong> was born as a solution to a common problem to pet-friendly households in Kenya. We love our <strong>cats and dogs</strong>, but buying cat food and dog food can be an arduous chore. And too often your cat's or dog's favourite brand is out-of-stock at your local market or veterinarian.
          </p>

          {/* Paragraph 2 */}
          <p style={{ marginBottom: "1.8rem" }}>
            <strong>Our Solution:</strong> premium quality pet food available through CONVENIENT <strong style={{ color: "#1E5DA7" }}>online shopping</strong> with <strong style={{ color: "#1E5DA7" }}>delivery to your door</strong>.
          </p>

          {/* Paragraph 3 */}
          <p style={{ marginBottom: "1.8rem" }}>
            Our goal is to provide both a superior customer experience and tremendous value for our customers. Nothing less.
          </p>

          {/* Paragraph 4 */}
          <p style={{ marginBottom: "2.5rem" }}>
            <strong style={{ color: "#1E5DA7" }}>We l❤️ve our customers and their pets.</strong> We welcome your feedback and suggestions. Use our{" "}
            <a 
              href="https://wa.me/254795350292" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}
            >
              Contact Us
            </a>{" "}
            page to tell us what we're doing right or what we can improve on.
          </p>

          {/* Quote Section */}
          <blockquote 
            style={{ 
              margin: "3rem 0 0 0",
              paddingLeft: "1.5rem",
              borderLeft: "4px solid #f7c276",
              fontStyle: "italic",
              color: "#555555",
              fontSize: "1.1rem"
            }}
          >
            "Until one has loved an animal, a part of one's soul remains unawakened."
            <span style={{ display: "block", fontSize: "0.95rem", marginTop: "0.5rem", color: "#777777", fontWeight: 600 }}>
              — Anatole France
            </span>
          </blockquote>

        </div>

      </div>
      <Footer />
    </>
  );
}
