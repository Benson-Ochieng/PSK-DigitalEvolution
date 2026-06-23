import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Cat Food Comparison — PetStore Kenya" },
    { name: "description", content: "How does your cat food compare? Check out our comparison chart and detailed grading criteria." },
  ];
}

export default function FoodComparison() {
  const [expanded, setExpanded] = useState(false);

  const products = [
    "Royal Canin: Adult Fit32",
    "Spectrum: Adult Delicate32",
    "Reflex Plus: Adult Hairball",
    "Reflex: Adult Chicken",
    "Bonnie: Adult Chicken",
    "Proline: Adult Fish",
    "King: Adult Fish",
    "Lara: Adult Beef",
    "Snappy Tom: Adult Ocean fish with vegetables",
    "Josi Cat: Adult Poultry",
    "Kari Cat: Adult Poultry"
  ];

  const criteria = [
    {
      title: "Animal Protein as First Ingredient",
      content: <>International labeling standards state that the list of ingredients must be in the order of proportion. Having animal protein as the first ingredient means that the highest proportion ingredient in the food is in fact animal protein. <strong>Cats are obligate carnivores</strong> so animal protein is the most important component of a cat's diet.</>
    },
    {
      title: "Multiple Animal Based Proteins",
      content: <>Certain cats prefer certain protein sources, once you find a brand your cat likes, it's good to have options of protein sources.</>
    },
    {
      title: "Greater than 30% protein",
      content: <>Protein is the most important and one of the more expensive ingredients in dry cat food. The higher the protein the better. There are certain health conditions whereby a lower protein content is better - consult a vet for more information.</>
    },
    {
      title: "Omega 3 & 6 Ratio",
      content: <>Omega 3 & 6 fatty acids are important for the cat's eyes, skin and nails, these fats can be derived from either flaxseed oil or fish oils.</>
    },
    {
      title: "Animal Based Omega 3 & 6 fats",
      content: <>Omega 3 & 6 fats from animal sources are more bioavailable than from vegetable sources. I.e. the cat can absorb more of these essential oils. Oils from fish fats are better than flaxseed, the most superior source of omega 3 & 6 is actually Krill Oil (or Quill oil).</>
    },
    {
      title: "Probiotics and Prebiotics",
      content: <>In order to ensure proper digestion, good gut bacteria is essential (probiotics). These good bacteria need a source of food (prebiotics) and these usually come in the form of indigestible fibers otherwise known as polysaccharides, examples include fructooligosaccharides and mannanoligosaccharides.</>
    },
    {
      title: "Immune Boosters",
      content: <>Immune boosters ensure that your cat stays healthy. The most common immune boosters in dry cat food are brewer's yeast and beta glucan.</>
    },
    {
      title: "Dehydrated / Hydrolysed Protein",
      content: <>Dehydrated protein means actual meat that is simply dehydrated then compressed into a kibble - yes! actual non-processed meat. Hydrolysed proteins are proteins that are broken down into amino acids and peptides - these are the most absorbable type of protein molecule and are particularly useful when dealing with food intolerances or protein intolerances.</>
    },
    {
      title: "Gluten free option",
      content: <>Some cats have a gluten intolerance. A gluten-free option is useful for cats with this issue.</>
    },
    {
      title: "Botanicals",
      content: <>Botanicals are added to dry food to boost the cat's health and vitality in various ways. Examples include: citrus bioflavonoids for extra antioxidant protection, curcumin for anti-inflammatory and joint health and rosemary for keeping bugs away.</>
    },
    {
      title: "No Animal Derivatives or By-Products",
      content: <>Animal derivatives and by-products are parts of the animal carcass that are not actual meat, e.g. skin, blood, fur, etc. anything that can be classified as a protein. These products are generally regarded as less preferable for animals to eat compared to actual meat or organs.</>
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
        <PageHeader title={expanded ? "How does your cat food compare?" : "Food Comparison"} />

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
          
          {!expanded ? (
            /* SUMMARY STATE (IMAGE 1) */
            <div 
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                padding: "2rem",
                marginTop: "1rem"
              }}
            >
              {/* Card Title */}
              <h2 
                style={{
                  fontSize: "1.3rem",
                  color: "#1e5da7",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderBottom: "1px solid #edf2f7",
                  paddingBottom: "1rem",
                  marginBottom: "1.5rem"
                }}
              >
                🐾 How does your cat food compare? 🐾
              </h2>

              <div 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
                  gap: "2rem",
                  alignItems: "start"
                }}
              >
                {/* Image Col */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img 
                    src="/images/rbanner2.jpg.webp" 
                    alt="How does your cat food compare?" 
                    style={{ 
                      width: "100%", 
                      maxWidth: "360px", 
                      borderRadius: "6px", 
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)" 
                    }} 
                  />
                </div>

                {/* Text & CTA Col */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontStyle: "italic", marginRight: "0.5rem" }}>
                      October 25th 2022:
                    </span>
                    <a 
                      href="#" 
                      onClick={(e) => e.preventDefault()}
                      style={{ color: "#3182ce", textDecoration: "none", fontWeight: 500 }}
                    >
                      View/Download Cat Food Comparison Chart 2020
                    </a>
                  </div>

                  <p style={{ color: "#4a5568", margin: 0 }}>
                    We understand that there are small variances among brands of cat food. For this comparison chart, the following specific cat food products were used and the information was taken from the manufacturer's website or product packaging: Royal Canin: Adult
                  </p>

                  <div>
                    <button 
                      onClick={() => setExpanded(true)}
                      style={{
                        background: "#f7941d",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "25px",
                        padding: "0.65rem 2rem",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(247, 148, 29, 0.2)",
                        transition: "background 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#e08316"}
                      onMouseOut={(e) => e.currentTarget.style.background = "#f7941d"}
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EXPANDED STATE (IMAGE 2) */
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              
              {/* Back Button */}
              <div>
                <button 
                  onClick={() => setExpanded(false)}
                  style={{
                    background: "#edf2f7",
                    color: "#4a5568",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.4rem 1.2rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  ← Back to Summary
                </button>
              </div>

              {/* Top Text Details */}
              <div style={{ color: "#4a5568", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <span style={{ fontWeight: "bold", fontStyle: "italic", marginRight: "0.5rem" }}>
                    October 25th 2022:
                  </span>
                  <a 
                    href="#" 
                    onClick={(e) => e.preventDefault()}
                    style={{ color: "#3182ce", textDecoration: "none", fontWeight: 500 }}
                  >
                    View/Download Cat Food Comparison Chart 2020
                  </a>
                </div>

                <p style={{ margin: 0 }}>
                  We understand that there are small variances among brands of cat food. For this comparison chart, the following specific cat food products were used and the information was taken from the manufacturer's website or product packaging:
                </p>

                {/* Products List */}
                <div style={{ margin: "1rem 0" }}>
                  <ul 
                    style={{ 
                      listStyleType: "none", 
                      padding: 0, 
                      margin: 0, 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "0.4rem" 
                    }}
                  >
                    {products.map((prod, pIdx) => (
                      <li key={pIdx} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ color: "#f7a22b", fontSize: "0.9rem" }}>🐾</span>
                        <span style={{ fontWeight: 500, color: "#2d3748" }}>{prod}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Grading Criteria Heading */}
              <div>
                <h2 
                  style={{
                    fontSize: "1.4rem",
                    color: "#1e5da7",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    borderBottom: "2px solid #edf2f7",
                    paddingBottom: "0.5rem",
                    marginBottom: "1.5rem"
                  }}
                >
                  Grading Criteria
                </h2>

                {/* Criteria List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {criteria.map((c, cIdx) => (
                    <div key={cIdx}>
                      <h3 
                        style={{
                          fontSize: "1.1rem",
                          color: "#3182ce",
                          fontWeight: 600,
                          textDecoration: "underline",
                          marginBottom: "0.5rem"
                        }}
                      >
                        {c.title}
                      </h3>
                      <p style={{ color: "#4a5568", margin: 0, fontSize: "1rem" }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show Less Button at Bottom */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                <button 
                  onClick={() => {
                    setExpanded(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    background: "#f7941d",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "25px",
                    padding: "0.65rem 2.5rem",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(247, 148, 29, 0.2)",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#e08316"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#f7941d"}
                >
                  Show Less
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
      <Footer />
    </>
  );
}
