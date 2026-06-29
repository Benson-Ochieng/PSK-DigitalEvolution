import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Pet Boarding Facilities — PetStore Kenya" },
    { name: "description", content: "Discover trusted and safe pet boarding options in Nairobi, Karen, Kiambu, and across Kenya to keep your pet safe while you are away." },
  ];
}

const BOARDING_FACILITIES = [
  {
    name: "Crystal Boarding kennels",
    contact: "0733 690 416",
    location: "Mombasa Road, Nairobi"
  },
  {
    name: "Pet Paradise Boarding",
    contact: "0792 752 523",
    location: "Karen, Nairobi"
  },
  {
    name: "Pet Village Boarding Facility",
    contact: "0725 709 445",
    location: "Wangige, Kiambu County"
  },
  {
    name: "Cat Habitat Boarding",
    contact: "0710 880 291",
    location: "Karen, Nairobi"
  },
  {
    name: "Yapperville Pet Boarding",
    contact: "0722 732 547",
    location: "Makueni County"
  },
  {
    name: "Pawsitive Pet Care Kenya",
    contact: "0780 377 363",
    location: "Ngong, Kajiado County"
  }
];

export default function BoardingDirectory() {
  function formatPhoneUrl(phone: string) {
    if (!phone) return "";
    const clean = phone.trim().replace(/[^0-9+]/g, "");
    return `tel:${clean}`;
  }

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
        <PageHeader title="Boarding Facilities" />

        {/* Page Subtitle & Description */}
        <div style={{ textAlign: "center", marginTop: "2rem", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "#1E5DA7",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              margin: "0 0 10px 0"
            }}
          >
            PET BOARDING FACILITIES
          </h2>
          <p
            style={{
              fontSize: "1.05rem",
              color: "#1E5DA7",
              fontWeight: 600,
              margin: 0
            }}
          >
            Trusted boarding options to keep your pet safe while away.
          </p>
        </div>

        {/* Grid of Boarding Facilities */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "3rem"
          }}
        >
          {BOARDING_FACILITIES.map((facility, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.03)";
              }}
            >
              {/* Facility Name */}
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#1E5DA7",
                  margin: 0
                }}
              >
                {facility.name}
              </h3>

              {/* Facility Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Contact */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.95rem" }}>
                  <span style={{ color: "#1E5DA7", fontSize: "1rem" }}>📞</span>
                  <span style={{ color: "#475569", fontWeight: 600 }}>Contact:</span>
                  <a
                    href={formatPhoneUrl(facility.contact)}
                    style={{
                      color: "#1E5DA7",
                      textDecoration: "none",
                      fontWeight: 700,
                      transition: "color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#0e3e75"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#1E5DA7"}
                  >
                    {facility.contact}
                  </a>
                </div>

                {/* Location */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.95rem" }}>
                  <span style={{ color: "#ef4444", fontSize: "1rem" }}>📍</span>
                  <span style={{ color: "#475569", fontWeight: 600 }}>Location:</span>
                  <span style={{ color: "#1e293b", fontWeight: 500 }}>{facility.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer Warning Box */}
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fef3c7",
            borderRadius: "8px",
            padding: "20px",
            fontSize: "0.88rem",
            lineHeight: "1.6"
          }}
        >
          <div
            style={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#b45309",
              marginBottom: "8px"
            }}
          >
            <span>⚠️</span> Disclaimer <span>⚠️</span>
          </div>
          <p style={{ margin: 0, color: "#78350f" }}>
            The boarding facilities listed are not affiliated with PetStore Kenya. Pet owners are advised to conduct their own due diligence by contacting and enquiring directly with the facilities. These listings are provided for convenience only, and the final decision rests with the pet owner.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
