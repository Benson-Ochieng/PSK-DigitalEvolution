import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("contact") || {
    title: "CONTACT US",
    seo: {
      title: "Contact Us — PetStore Kenya",
      description: "Get in touch with PetStore Kenya. Send us your order inquiries, delivery questions, or wholesale requests.",
    },
  };
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Contact Us — PetStore Kenya";
  const description =
    data?.page?.seo?.description ||
    "Get in touch with PetStore Kenya. Send us your order inquiries, delivery questions, or wholesale requests.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function ContactPage() {
  const { page } = useLoaderData() as any;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    enquiryNature: "Order Issue",
    orderNumber: "",
    message: "",
    hearAbout: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate server processing
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        enquiryNature: "Order Issue",
        orderNumber: "",
        message: "",
        hearAbout: "",
      });
    }, 600);
  };

  return (
    <>
      <Navbar />

      <div
        className="page-container"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "2.5rem var(--page-pad) 5rem",
          fontFamily: "var(--font-sans)",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Title Banner */}
        <PageHeader title={page?.title || "CONTACT US"} />

        {/* Informational Text Section */}
        <div
          className="contact-info-block"
          style={{
            fontSize: "1.02rem",
            lineHeight: "1.75",
            color: "#4a5568",
            marginBottom: "2.5rem",
          }}
        >
          <p style={{ marginBottom: "1.25rem", fontWeight: "500", color: "#2d3748" }}>
            Customer feedback is the lifeblood of our business. Tell us what&apos;s on your mind, good or bad. We particularly want to know if you have an issue with your <strong>ORDER</strong>, a <strong>PRODUCT</strong> or our <strong>SERVICE</strong>.
          </p>

          <p style={{ marginBottom: "1.25rem" }}>
            <strong>Delivery Timelines:</strong> All orders <strong>WITHIN NAIROBI</strong> will be delivered within 24 hours (except for weekends). Orders placed after 8am on Saturday will be dispatched Monday. Orders to be delivered <strong>OUTSIDE NAIROBI</strong> will be dispatched through a transporter (expect 3-5 business days for delivery to reach).
          </p>

          <p style={{ marginBottom: "1.5rem" }}>
            <strong>Delivery Cost:</strong> All orders <strong>WITHIN NAIROBI</strong> will incur a charge of KSh 300/-. Orders to be delivered <strong>OUTSIDE NAIROBI</strong> will incur a charge of KSh 400/- for the first 15kg and 200/- per additional 15kg increment. Delivery is <strong>FREE</strong> for orders <strong>WITHIN NAIROBI</strong> greater than KSh 4,000/-.
          </p>

          <p style={{ marginBottom: "0.85rem", fontWeight: "600" }}>
            <Link to="/faq" style={{ color: "#1E5DA7", textDecoration: "underline" }}>
              Please see our FAQs for fast answers to common questions.
            </Link>
          </p>

          <p style={{ marginBottom: "0.85rem" }}>
            Or, buy from our{" "}
            <Link to="/locations" style={{ color: "#1E5DA7", textDecoration: "underline", fontWeight: "600" }}>
              outlets.
            </Link>
          </p>

          <p style={{ marginBottom: "1.75rem" }}>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, enquiryNature: "Wholesale Enquiry" }));
                document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#1E5DA7",
                textDecoration: "underline",
                fontWeight: "600",
                fontSize: "1.02rem",
                cursor: "pointer",
              }}
            >
              Click HERE if you have a WHOLESALE enquiry.
            </button>
          </p>

          <p style={{ fontWeight: "600", color: "#2d3748", fontSize: "1.05rem" }}>
            We respond to all customer queries &mdash; We look forward to hear from you!
          </p>
        </div>

        {/* Success Alert Banner */}
        {submitted && (
          <div
            style={{
              padding: "1.25rem 1.5rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
            }}
          >
            <i className="fa fa-check-circle" style={{ fontSize: "1.4rem", color: "#16a34a" }}></i>
            <div>
              <strong>Thank you for reaching out!</strong>
              <div style={{ fontSize: "0.95rem", marginTop: "0.2rem" }}>
                We have received your message and will respond to your query as quickly as possible.
              </div>
            </div>
          </div>
        )}

        {/* Contact Form */}
        <form
          id="contact-form"
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            maxWidth: "750px",
          }}
        >
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              First Name <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              Last Name <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              Email <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="0700 000 000"
              value={formData.phone}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Nature of Enquiry */}
          <div>
            <label
              htmlFor="enquiryNature"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              Nature of Your Enquiry (Choose One) <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select
              id="enquiryNature"
              name="enquiryNature"
              required
              value={formData.enquiryNature}
              onChange={handleChange}
              style={{ ...inputStyle, backgroundColor: "#ffffff" }}
            >
              <option value="Order Issue">Order Issue</option>
              <option value="Product Enquiry">Product Enquiry</option>
              <option value="Service / Delivery Feedback">Service / Delivery Feedback</option>
              <option value="Wholesale Enquiry">Wholesale Enquiry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Order Number */}
          <div>
            <label
              htmlFor="orderNumber"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              Order Number
            </label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              placeholder="Required if you selected 'Order Issue'"
              value={formData.orderNumber}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Message textarea */}
          <div>
            <label
              htmlFor="message"
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.35rem" }}
            >
              How may we help you? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              value={formData.message}
              onChange={handleChange}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* How did you hear about us? */}
          <div style={{ marginTop: "0.5rem" }}>
            <label
              style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#4a5568", marginBottom: "0.75rem" }}
            >
              How did you hear about us? <span style={{ color: "#e53e3e" }}>*</span>
            </label>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                fontSize: "0.85rem",
                color: "#4a5568",
              }}
            >
              {[
                "Family / Friend",
                "Internet Search",
                "Social Media",
                "Dog Show or Event",
                "Other",
              ].map((option) => (
                <label
                  key={option}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="radio"
                    name="hearAbout"
                    value={option}
                    checked={formData.hearAbout === option}
                    onChange={handleChange}
                    style={{ accentColor: "#2e7d76", width: "16px", height: "16px" }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#2e7d76",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                padding: "0.7rem 2.2rem",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background-color 0.2s ease-in-out",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#24645e")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2e7d76")}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  fontSize: "0.95rem",
  borderRadius: "4px",
  border: "1px solid #cbd5e1",
  outline: "none",
  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
};
