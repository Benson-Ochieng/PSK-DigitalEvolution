import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Veterinary Care — PetStore Kenya" },
    { name: "description", content: "View our comprehensive directory of verified veterinary clinics and animal hospitals in Nairobi, Mombasa, Kisumu, and across Kenya." },
  ];
}

const VET_CLINICS = [
  { name: "Aniworld Veterinary Clinic Ltd", instagram: "@Aniworldvet", contact: "0732355125", location: "Kisumu, Opp Kondele Police Station" },
  { name: "Penwell Vet Clinic", instagram: "@penwellvetclinic", contact: "0722879232", location: "Mtwapa / Mombasa" },
  { name: "Penwell Vet Clinic Nrb", instagram: "", contact: "0748080080", location: "Nairobi - Riara" },
  { name: "Rottcher Vet Clinic", instagram: "", contact: "0714831248", location: "Karen, Miotoni" },
  { name: "Isapet Vet", instagram: "@isapetvetclinic", contact: "0720904113", location: "Mombasa" },
  { name: "Elvet", instagram: "@elvet_veterinary_clinic", contact: "0723790766", location: "Ruaka" },
  { name: "Dr. Sercombe", instagram: "", contact: "0722720730", location: "Karen – Karen Hospital" },
  { name: "Animal Care", instagram: "", contact: "0721546956", location: "Kiambu Road – Ridgeways" },
  { name: "Small Five Vet Clinic", instagram: "@smallfive_vetclinic", contact: "0702624945", location: "Karen & Rongai" },
  { name: "Dr. Amandeep Suri", instagram: "", contact: "0722699710", location: "Rhapta Road, Westlands" },
  { name: "Petville Animal Hospital", instagram: "@petvillevet", contact: "0724950978", location: "Mbaruk Road" },
  { name: "The Andys Vet Clinic - Ngong Rd", instagram: "@andysvet", contact: "0722245812", location: "Ngong Road – Near Meteorological Dept." },
  { name: "Kikuyu Pet Love Vet Clinic", instagram: "@petlove_vet", contact: "0713661143", location: "Kikuyu" },
  { name: "Charlie's Pet Care", instagram: "", contact: "0721880885", location: "Mombasa – Links Road" },
  { name: "Hardy Vet", instagram: "@Hardyvet", contact: "0727517101", location: "Karen Hardy" },
  { name: "A. Megre", instagram: "", contact: "0733842129", location: "Karen – Marula Lane" },
  { name: "Diani Vet", instagram: "", contact: "0722473707", location: "Diani" },
  { name: "St. Austin Vet", instagram: "@staustinvetsclinic", contact: "0797748858", location: "James Gichuru Rd" },
  { name: "Mobivet Clinic", instagram: "@mobivet_ke", contact: "0727333722", location: "75 Olenugruone Avenue" },
  { name: "Dr. Wilson", instagram: "@coastpetlimited", contact: "0790261171", location: "Watamu" },
  { name: "Pets Centre Vet", instagram: "@pets_centre", contact: "0722815802", location: "Muthaiga Limuru Rd" },
  { name: "Pawprints", instagram: "@well_pet_veterinary_clinic", contact: "0720138604", location: "21 Masi Mahila Rd – South C" },
  { name: "Queens Vet", instagram: "", contact: "0718031580", location: "Garden Estate Rd." },
  { name: "Noble Vet", instagram: "@thenoblevetn", contact: "0727127078", location: "Westlands / South C / Kiambu Road / Mwimbi" },
  { name: "Companion Vet", instagram: "@companionvetclinicparklands", contact: "0745776494", location: "Parklands" },
  { name: "Acada Vet", instagram: "@acadaveterinary", contact: "0733444445", location: "Karen" },
  { name: "Dr. Mamlani", instagram: "", contact: "2557565696156", location: "Dar es Salaam" },
  { name: "Andys Vet Limuru", instagram: "@andysvet", contact: "0715911018", location: "Limuru" },
  { name: "Poseidon Vet", instagram: "@poseidon_veterinary_clinic", contact: "0722875109", location: "South C" },
  { name: "Kilimo Vetcare", instagram: "", contact: "0721759877", location: "Kikuyu" },
  { name: "Jacaranda Vet – Thika", instagram: "", contact: "0750802591", location: "Thika" },
  { name: "Jacaranda Vet – Westlands", instagram: "@jacarandavetclinicwestlands", contact: "0722485557", location: "Westlands" },
  { name: "Star Vet Clinic", instagram: "@starvetclinic", contact: "0791225027", location: "Mobile" },
  { name: "Shifaz Veterinary Clinic", instagram: "", contact: "0722875946", location: "Village Market" },
  { name: "Dr. Nelly Dargoltz", instagram: "", contact: "0700723186", location: "Mobile" },
  { name: "Coral Veterinary Clinic", instagram: "", contact: "0722723737", location: "Kitisuru" },
  { name: "The Ark Pet Services", instagram: "", contact: "0795470003", location: "Tigoni" },
  { name: "Vetzcopes Limited", instagram: "", contact: "255754834948", location: "Arusha" },
  { name: "Cocker Veterinary Clinic", instagram: "", contact: "0733866448", location: "Rosslyn Lone Tree Estate Rd, Nairobi" },
  { name: "Garden Vet", instagram: "", contact: "0722818522", location: "No.56 Woodvale Drive, Runda Evergreen off Kiambu Road, Nairobi" }
];

export default function VetsDirectory() {
  function formatInstagramUrl(handle: string) {
    if (!handle || handle === "-") return "";
    const clean = handle.trim().replace("@", "");
    return `https://www.instagram.com/${clean}/`;
  }

  function formatPhoneUrl(phone: string) {
    if (!phone) return "";
    const clean = phone.trim().replace(/[^0-9+]/g, "");
    if (clean.startsWith("+")) return `tel:${clean}`;
    if (clean.startsWith("255")) return `tel:+${clean}`;
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
        <PageHeader title="Veterinary Care" />

        {/* Directory Table Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
            overflow: "hidden"
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.95rem"
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0"
                  }}
                >
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569", width: "30%" }}>Outlet</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569", width: "20%" }}>Instagram</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569", width: "20%" }}>Contact</th>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569", width: "30%" }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {VET_CLINICS.map((clinic, idx) => {
                  const hasInstagram = clinic.instagram && clinic.instagram !== "-";
                  const hasContact = clinic.contact && clinic.contact !== "-";

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(30, 93, 167, 0.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Outlet Name */}
                      <td style={{ padding: "16px 20px", fontWeight: 600, color: "#1e293b" }}>
                        {clinic.name}
                      </td>

                      {/* Instagram Link */}
                      <td style={{ padding: "16px 20px" }}>
                        {hasInstagram ? (
                          <a
                            href={formatInstagramUrl(clinic.instagram)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#1E5DA7",
                              textDecoration: "none",
                              fontWeight: 600,
                              transition: "color 0.15s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#0e3e75"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#1E5DA7"}
                          >
                            {clinic.instagram}
                          </a>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      {/* Contact Link */}
                      <td style={{ padding: "16px 20px" }}>
                        {hasContact ? (
                          <a
                            href={formatPhoneUrl(clinic.contact)}
                            style={{
                              color: "#1E5DA7",
                              textDecoration: "none",
                              fontWeight: 600,
                              transition: "color 0.15s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#0e3e75"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#1E5DA7"}
                          >
                            {clinic.contact}
                          </a>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td style={{ padding: "16px 20px", color: "#475569" }}>
                        {clinic.location}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer Warning Box */}
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fef3c7",
            borderRadius: "8px",
            padding: "20px",
            marginTop: "30px",
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
            The veterinary clinics listed are not affiliated with PetStore Kenya. This information is provided for convenience only, and pet owners are encouraged to conduct their own due diligence by contacting the clinics directly. The final choice of service provider rests with the pet owner.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
