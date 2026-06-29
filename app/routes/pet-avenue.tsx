import { Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Pet Avenue — PetStore Kenya" },
    { name: "description", content: "Explore Pet Avenue at PetStore Kenya. Find trusted veterinary care, luxury pet boarding facilities, pet-friendly restaurants, and pet adoption services." },
  ];
}

export default function PetAvenue() {
  const cards = [
    {
      title: "Veterinary Care",
      icon: "🩺",
      desc: "Trusted vets to keep your pet healthy before, during, and after their stay, covering checkups and support.",
      buttonText: "VETS",
      link: "/pet-avenue/veterinary-care",
      bgImage: "/images/pet-avenue/veterinary_care.png"
    },
    {
      title: "Pet Boarding Facilities",
      icon: "🏡",
      desc: "Safe, comfortable boarding options where pets enjoy care, routines, and attention while you're away.",
      buttonText: "BOARDING FACILITIES",
      link: "/pet-avenue/boarding-facilities",
      bgImage: "/images/pet-avenue/boarding_facilities.png"
    },
    {
      title: "Pet-Friendly Restaurants",
      icon: "🍽️",
      desc: "Enjoy dining out without leaving your pet behind—discover restaurants that welcome pets with open arms.",
      buttonText: "RESTAURANTS",
      link: "/pet-avenue/restaurants",
      bgImage: "/images/pet-avenue/friendly_restaurants.png"
    },
    {
      title: "Pet Adoption",
      icon: "🏡",
      desc: "Find your perfect companion. Adopt, love, and repeat—your forever friend is waiting.",
      buttonText: "PET ADOPTION",
      link: "/pet-avenue/pet-adoption",
      bgImage: "/images/pet-avenue/pet_adoption.png"
    }
  ];

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
        <PageHeader title="Pet Avenue" />

        {/* CSS Grid for Pet Avenue Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginTop: "2rem"
          }}
        >
          {cards.map((card, idx) => {
            const isInternal = card.link.startsWith("/");
            const cardStyles = {
              display: "flex",
              flexDirection: "column" as const,
              justifyContent: "flex-end" as const,
              height: "320px",
              backgroundImage: `url(${card.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "12px",
              position: "relative" as const,
              overflow: "hidden",
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              cursor: "pointer"
            };

            const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 12px 25px rgba(0, 0, 0, 0.2)";
              const overlay = e.currentTarget.querySelector(".card-overlay") as HTMLElement;
              if (overlay) overlay.style.background = "linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.85) 100%)";
              const btn = e.currentTarget.querySelector(".card-btn") as HTMLElement;
              if (btn) {
                btn.style.backgroundColor = "#1E5DA7";
                btn.style.color = "#ffffff";
              }
            };

            const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
              const overlay = e.currentTarget.querySelector(".card-overlay") as HTMLElement;
              if (overlay) overlay.style.background = "linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.7) 100%)";
              const btn = e.currentTarget.querySelector(".card-btn") as HTMLElement;
              if (btn) {
                btn.style.backgroundColor = "#ffffff";
                btn.style.color = "#1e293b";
              }
            };

            const innerContent = (
              <>
                {/* Overlay for readable text */}
                <div
                  className="card-overlay"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.7) 100%)",
                    transition: "background 0.3s ease",
                    zIndex: 1
                  }}
                />

                {/* Card Contents */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      color: "#ffffff",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{card.icon}</span>
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#e2e8f0",
                      lineHeight: 1.5,
                      margin: 0
                    }}
                  >
                    {card.desc}
                  </p>

                  {/* Button */}
                  <div
                    className="card-btn"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#1e293b",
                      padding: "10px 22px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginTop: "10px",
                      width: "max-content",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      transition: "background-color 0.2s ease, color 0.2s ease"
                    }}
                  >
                    {card.buttonText}
                  </div>
                </div>
              </>
            );

            if (isInternal) {
              return (
                <Link
                  key={idx}
                  to={card.link}
                  style={cardStyles}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {innerContent}
                </Link>
              );
            }

            return (
              <a
                key={idx}
                href={card.link}
                target="_blank"
                rel="noreferrer"
                style={cardStyles}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {innerContent}
              </a>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}
