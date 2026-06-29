import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Pet-Friendly Places & Restaurants — PetStore Kenya" },
    { name: "description", content: "Explore a list of pet-friendly places in Kenya, including hotels, campgrounds, outdoor stays, parks, and dining options where pets are welcome." },
  ];
}

const ACROSS_KENYA = [
  { name: "Joy Palace", desc: "Nairobi pet-friendly hotel" },
  { name: "The Drexel House Kenya", desc: "Nairobi pet-friendly stay" },
  { name: "Bidwood Suite Hotel", desc: "Nairobi (pets allowed with conditions)" },
  { name: "Swiss Lenana Mount Hotel", desc: "Nairobi pet-friendly" },
  { name: "Elmolo Crocodile Park & Lodge", desc: "Baringo pet-friendly" },
  { name: "Simba House", desc: "Watamu pet-friendly" },
  { name: "Temple Point Resort", desc: "Watamu allows pets" },
  { name: "Diani Hostel", desc: "Ukunda (pets allowed)" },
  { name: "Eco Mara Tented Camp", desc: "Maasai Mara pet-friendly" },
  { name: "Mzima Beach Residences", desc: "Diani Beach (pets allowed)" },
  { name: "Galu Ecolodge", desc: "Diani Beach pet-friendly" },
  { name: "Tails of the city", desc: "Thigiri" },
  { name: "Cotton Tree", desc: "Thigiri" }
];

const CAMPGROUNDS = [
  "Enchipai Campsite & Cottages (Isinya)",
  "Punda Milias Lodge (Nakuru)",
  "Kikopey Beach Camp (Gilgil)",
  "Greenwood Safari Camp",
  "Talek Bush Camp (Masai Mara)",
  "Arcadia East Africa Bush Camp (Kilifi)",
  "Lillypond Camp (Elmenteita)",
  "Popo Camp Lake Baringo",
  "Amanya tents in Amboseli",
  "Rhino Camp (Ololaimutiek)",
  "Kongoni Camp & Le Rustique – Nanyuki",
  "Lake Naivasha Crescent Camp & Aloepark Art Hotel – Naivasha",
  "Pet-Friendly Vacation Rentals (Kitengela, Kilifi, Kisumu, Thika) – owner-based policies"
];

const PARKS_PUBLIC_SPACES = [
  { name: "Karura Forest (Nairobi)", desc: "dogs allowed on leash with control rules." },
  { name: "Nairobi Arboretum", desc: "great for walks with pets." },
  { name: "Ngong Forest Sanctuary, Ngong Road", desc: "on leash" },
  { name: "Oloolua Nature Trail (Karen)", desc: "leashed pet's welcome." },
  { name: "Misitu Raha, Karen", desc: "on leash" }
];

export default function RestaurantsDirectory() {
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
        <PageHeader title="Restaurants" />

        {/* Page Titles */}
        <div style={{ textAlign: "center", marginTop: "2rem", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "#1E5DA7",
              margin: "0 0 10px 0"
            }}
          >
            Places in Kenya That Do Allow Pets
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#475569",
              fontWeight: 600,
              margin: 0
            }}
          >
            Hotels & Campsites Confirmed Pet-Friendly
          </p>
        </div>

        {/* Three Columns Directory Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "24px",
            marginBottom: "3rem"
          }}
        >
          {/* Column 1: Across Kenya */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#1E5DA7",
                borderBottom: "2px solid rgba(30, 93, 167, 0.1)",
                paddingBottom: "10px",
                marginBottom: "16px",
                marginTop: 0
              }}
            >
              Across Kenya
            </h3>
            <ul style={{ paddingLeft: "16px", margin: 0, display: "flex", flexDirection: "column", gap: "12px", color: "#334155", fontSize: "0.93rem", lineHeight: "1.5" }}>
              {ACROSS_KENYA.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.name}</strong> – {item.desc}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Campgrounds & Outdoor Stays */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#1E5DA7",
                borderBottom: "2px solid rgba(30, 93, 167, 0.1)",
                paddingBottom: "10px",
                marginBottom: "16px",
                marginTop: 0
              }}
            >
              Campgrounds & Outdoor Stays (Dogs & Cats Welcome):
            </h3>
            <ul style={{ paddingLeft: "16px", margin: 0, display: "flex", flexDirection: "column", gap: "12px", color: "#334155", fontSize: "0.93rem", lineHeight: "1.5" }}>
              {CAMPGROUNDS.map((item, idx) => (
                <li key={idx}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Parks & Outdoor Public Spaces */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#1E5DA7",
                borderBottom: "2px solid rgba(30, 93, 167, 0.1)",
                paddingBottom: "10px",
                marginBottom: "16px",
                marginTop: 0
              }}
            >
              Parks & Outdoor Public Spaces Where Pets Are Allowed
            </h3>
            <ul style={{ paddingLeft: "16px", margin: 0, display: "flex", flexDirection: "column", gap: "12px", color: "#334155", fontSize: "0.93rem", lineHeight: "1.5" }}>
              {PARKS_PUBLIC_SPACES.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.name}</strong> – {item.desc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Important Notes Before Visiting Box */}
        <div
          style={{
            backgroundColor: "rgba(30, 93, 167, 0.03)",
            border: "1px solid rgba(30, 93, 167, 0.1)",
            borderRadius: "12px",
            padding: "24px",
            color: "#475569"
          }}
        >
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#1e293b",
              textAlign: "center",
              margin: "0 0 16px 0"
            }}
          >
            Important Notes Before Visiting
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "0.93rem",
              lineHeight: "1.6"
            }}
          >
            <li>
              <strong>Always call ahead</strong> – Some hotels <em>may allow pets in rooms but not in restaurants or common areas</em>.
            </li>
            <li>
              <strong>Outdoor cafes/restaurant gardens</strong> are more likely to accept pets, but policies can differ by location.
            </li>
            <li>
              <strong>Wildlife parks & national reserves (e.g., Nairobi NP, Maasai Mara)</strong> usually <em>do not allow pets</em> due to wildlife safety – but some <em>pet-friendly lodges near parks</em> can be a base for stays.
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
