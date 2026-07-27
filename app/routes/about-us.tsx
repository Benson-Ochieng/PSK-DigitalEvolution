import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "About Us — PetStore Kenya" },
    { name: "description", content: "Learn about PetStore Kenya, our mission, values, and how we make pet food shopping convenient and affordable across Kenya." }
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
        <PageHeader title="ABOUT US" />

        {/* Content Section matching Live Site */}
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
          <p style={{ marginBottom: "1.5rem" }}>
            <strong style={{ color: "#1053a0" }}>PetStore Kenya</strong> was born as a solution to a common problem to pet-friendly households in Kenya. We love our cats and dogs, but buying cat food and dog food can be an arduous chore. And too often your cat's or dog's favourite brand is out-of-stock at your local market or veterinarian.
          </p>

          <p style={{ marginBottom: "1.5rem" }}>
            <strong style={{ color: "#1053a0" }}>Our Solution:</strong> premium quality pet food available through CONVENIENT <strong style={{ color: "#1053a0" }}>online shopping</strong> with <strong style={{ color: "#1053a0" }}>delivery to your door.</strong>
          </p>

          <p style={{ marginBottom: "1.5rem" }}>
            Our goal is to provide both a superior customer experience and tremendous value for our customers. Nothing less.
          </p>

          <p style={{ marginBottom: "1.5rem" }}>
            <strong style={{ color: "#1053a0" }}>
              We I<span style={{ color: "#e2401c" }}>♥</span>ve our customers and their pets.
            </strong>{" "}
            We welcome your feedback and suggestions. Use our{" "}
            <a href="/contact-us" style={{ color: "#3b82f6", textDecoration: "none" }}>
              Contact Us
            </a>{" "}
            page to tell us what we're doing right or what we can improve on.
          </p>

          <p style={{ marginBottom: "1.5rem", color: "#4a5568" }}>
            ‘Until one has loved an animal, a part of one's soul remains unawakened.’ ~Anatole France
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
