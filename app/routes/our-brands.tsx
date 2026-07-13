import React from "react";
import { useLoaderData, Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getAdminUser } from "~/lib/sessions.server";

export function meta() {
  return [
    { title: "Our Brands - PetStore Kenya" },
    { name: "description", content: "Explore the premium pet food and care brands available at PetStore Kenya, including Proline, Reflex, Spectrum, Josera, Royal Canin, and more." },
  ];
}

export async function loader({ request }: { request: Request }) {
  let isAdmin = false;
  try {
    const admin = await getAdminUser(request);
    isAdmin = !!admin;
  } catch (e) {
    // Silent fallback
  }
  return { isAdmin };
}

const BRANDS_ROW_1_2 = [
  { name: "Proline", logo: "/images/brands/Proline_Logo-300x105.png.webp", url: "/shop?brand=Proline" },
  { name: "Reflex", logo: "/images/brands/Reflex_logo_plain-300x180.png.webp", url: "/shop?brand=Reflex" },
  { name: "Spectrum", logo: "/images/brands/Spectrum_Logo.png.webp", url: "/shop?brand=Spectrum" },
  { name: "Trendline", logo: "/images/brands/Trendline-logo-300x75.jpg.webp", url: "/shop?brand=Trendline" },
  { name: "Josera", logo: "/images/brands/Josera_logo1.png.webp", url: "/shop?brand=Josera" },
  { name: "Bonnie", logo: "/images/brands/Bonnie_Logo-300x102.png.webp", url: "/shop?brand=Bonnie" },
  { name: "King", logo: "/images/brands/King-Logo-1080x1080.png.webp", url: "/shop?brand=King" },
  { name: "Unique", logo: "/images/brands/Unique-Logo.png.webp", url: "/shop?brand=Unique" }
];

const BRANDS_ROW_3 = [
  { name: "Morando", logo: "/images/brands/logo-morando.png.webp", url: "/shop?brand=Morando" },
  { name: "Royal Canin", logo: "/images/brands/Royal-Canin-Logo.svg_.png.webp", url: "/shop?brand=Royal%20Canin" },
  { name: "Bravecto", logo: "/assets/brands/Bravecto.png", url: "/shop?brand=Bravecto" }
];

export default function OurBrandsPage() {
  const { isAdmin } = useLoaderData() as { isAdmin: boolean };

  return (
    <>
      <Navbar />

      <style dangerouslySetInnerHTML={{
        __html: `
        .brands-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem var(--page-pad) 5rem;
          font-family: var(--font-sans);
          background-color: #ffffff;
        }

        .brands-wrapper {
          max-width: 1000px;
          margin: 0 auto;
        }

        .edit-link-container {
          margin-bottom: 2rem;
          text-align: left;
          padding: 0 1rem;
        }

        .edit-link {
          color: #3182ce;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.15s ease;
        }

        .edit-link:hover {
          color: #2b6cb0;
          text-decoration: underline;
        }

        .brands-top-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          padding: 0 1rem;
        }

        .brands-bottom-flex {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 40px;
          padding: 0 1rem;
        }

        .brand-item {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background: transparent;
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 150px;
          text-decoration: none;
        }

        .brand-item:hover {
          transform: translateY(-6px);
        }

        .brands-bottom-flex .brand-item {
          width: calc(25% - 30px);
        }

        .brand-img {
          max-width: 100%;
          max-height: 120px;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .brand-item:hover .brand-img {
          transform: scale(1.08);
        }

        @media (max-width: 900px) {
          .brands-top-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          .brands-bottom-flex {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-top: 24px;
          }
          .brands-bottom-flex .brand-item {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .brands-top-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .brands-bottom-flex {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 16px;
          }
          .brands-bottom-flex .brand-item {
            width: 100%;
          }
          .brands-bottom-flex .brand-item:last-child {
            grid-column: span 2;
            max-width: calc(50% - 8px);
            margin: 0 auto;
            width: 100%;
          }
          .brand-item {
            padding: 16px;
            min-height: 110px;
          }
          .brand-img {
            max-height: 65px;
          }
        }
      ` }} />

      <div className="brands-page-container">
        <PageHeader title="OUR BRANDS" />

        <div className="brands-wrapper">

          {/* Row 1 & 2 Grid (4 columns) */}
          <div className="brands-top-grid">
            {BRANDS_ROW_1_2.map((brand, idx) => (
              <Link key={idx} to={brand.url} className="brand-item">
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="brand-img"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>

          {/* Row 3 Flex (3 columns centered on desktop) */}
          <div className="brands-bottom-flex">
            {BRANDS_ROW_3.map((brand, idx) => (
              <Link key={idx} to={brand.url} className="brand-item">
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="brand-img"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
