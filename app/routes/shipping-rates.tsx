import { Link, useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("shipping-rates") || {
    title: "SHIPPING RATES",
    seo: {
      title: "Shipping Rates & Delivery Timelines — PetStore Kenya",
      description: "Review delivery timelines and shipping rates for Nairobi and outside Nairobi orders at PetStore Kenya.",
    },
  };
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Shipping Rates & Delivery Timelines — PetStore Kenya";
  const description =
    data?.page?.seo?.description ||
    "Review delivery timelines and shipping rates for Nairobi and outside Nairobi orders at PetStore Kenya.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function ShippingRatesPage() {
  const { page } = useLoaderData() as any;

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
        <PageHeader title={page?.title || "SHIPPING RATES"} />

        {/* Content Section */}
        <div
          className="shipping-content"
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            color: "#334155",
            fontSize: "1.02rem",
            lineHeight: "1.8",
          }}
        >
          {/* Section 1: DELIVERY TIMELINES */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#1E5DA7",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              DELIVERY TIMELINES
            </h2>

            <p style={{ color: "#334155", margin: 0 }}>
              All orders <strong>WITHIN NAIROBI</strong> will be delivered within 24 hours (except for weekends). Orders placed after 8am on Saturday will be dispatched Monday. Orders to be delivered <strong>OUTSIDE NAIROBI</strong> will be dispatched through a transporter (expect 3-5 business days for delivery to reach).
            </p>
          </div>

          {/* Section 2: DELIVERY COST */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#1E5DA7",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                marginBottom: "1.25rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              DELIVERY COST
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "#334155" }}>
              <p style={{ margin: 0 }}>
                <strong>WITHIN NAIROBI:</strong> 300KES for orders under 5000KES
              </p>

              <p style={{ margin: 0 }}>
                <strong>WITHIN NAIROBI:</strong> Free delivery for orders worth 4000KES or greater
              </p>

              <p style={{ margin: 0 }}>
                <strong>Outside NAIROBI:</strong> Cost is dependent on distance &amp; provided at Checkout.
              </p>
            </div>
          </div>

          {/* Centered Helper Links */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.85rem",
              marginTop: "2rem",
            }}
          >
            <p style={{ margin: 0, fontWeight: "600" }}>
              <Link
                to="/faq"
                style={{
                  color: "#1E5DA7",
                  textDecoration: "underline",
                  fontSize: "1.02rem",
                }}
              >
                Please see our FAQs for fast answers to common questions.
              </Link>
            </p>

            <p style={{ margin: 0, fontWeight: "600" }}>
              <Link
                to="/contact"
                style={{
                  color: "#1E5DA7",
                  textDecoration: "underline",
                  fontSize: "1.02rem",
                }}
              >
                Click HERE if you have a WHOLESALE inquiry.
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
