import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Cat Food Comparison - PetStore Kenya" },
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
    "Bewi Cat: Adult Poultry"
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
      
      <style dangerouslySetInnerHTML={{ __html: `
        .food-comparison-page {
          background-color: #f7fafc;
          min-height: 100vh;
          padding: 3rem var(--page-pad) 5rem;
          font-family: var(--font-sans);
        }
        .food-comparison-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .blog-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .blog-card-header {
          position: relative;
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
        }
        .blog-card-header::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 1.25rem;
          right: 1.25rem;
          height: 1px;
          background-color: #e2e8f0;
        }
        .blog-card-header::before {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 1.25rem;
          width: 80px;
          height: 3px;
          background-color: #1e5da7;
          z-index: 1;
        }
        .blog-card-header-inner {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        }
        .blog-card-title {
          font-size: 1.35rem;
          font-weight: bold;
          color: #1e5da7;
          margin: 0;
          line-height: 1.4;
        }
        .blog-card-paw {
          color: #1e5da7;
          font-size: 1.2rem;
        }
        .blog-card-body {
          padding: 1.5rem 2rem 2rem;
          display: flex;
          flex-direction: row;
          gap: 2rem;
        }
        .blog-card-image-wrapper {
          width: 300px;
          height: 200px;
          min-width: 300px;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f7fafc;
        }
        .blog-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .blog-card-text-column {
          flex: 1;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 1rem;
        }
        .blog-card-text {
          font-size: 0.95rem;
          color: #4a5568;
          line-height: 1.7;
          margin: 0;
        }
        .blog-card-button {
          display: inline-block;
          text-decoration: none;
          text-align: center;
          background-color: #ff9f00;
          color: #ffffff !important;
          border: none;
          border-radius: 30px !important;
          padding: 0.55rem 1.65rem;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-transform: uppercase;
        }
        .blog-card-button:hover {
          background-color: #e08b00;
        }
        
        .food-comparison-detail-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          padding: 2.5rem 3rem 3.5rem;
        }
        
        .blog-detail-header-wrapper {
          overflow: hidden;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        .blog-detail-header-wrapper > div {
          margin-bottom: 0 !important;
        }
        
        .back-button {
          background: #edf2f7;
          color: #4a5568;
          border: none;
          border-radius: 20px;
          padding: 0.4rem 1.2rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: background-color 0.2s;
        }
        .back-button:hover {
          background: #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .blog-card-body {
            flex-direction: column;
            padding: 1.25rem;
            gap: 1.25rem;
          }
          .blog-card-image-wrapper {
            width: 100%;
            min-width: 100%;
            height: auto;
            aspect-ratio: 16/10;
          }
          .food-comparison-detail-card {
            padding: 1.5rem 1rem 2rem;
          }
          .blog-detail-header-wrapper {
            margin-bottom: 1.5rem;
          }
          .blog-detail-header-wrapper > div {
            padding: 0.6rem 0.75rem !important;
            gap: 0.6rem !important;
          }
          .blog-detail-header-wrapper h1 {
            font-size: 1.25rem !important;
            line-height: 1.4 !important;
          }
          .blog-detail-header-wrapper i.fa-paw {
            font-size: 13px !important;
          }
        }
      `}} />

      <div className="food-comparison-page">
        <div className="food-comparison-container">
          
          {/* Title Banner (only shown at page level when not expanded) */}
          {!expanded && <PageHeader title="Food Comparison" />}

          {!expanded ? (
            /* SUMMARY STATE (IMAGE 1) */
            <div className="blog-card" style={{ marginTop: "1rem" }}>
              
              {/* Card Header */}
              <div className="blog-card-header">
                <div className="blog-card-header-inner">
                  <i className="fa fa-paw blog-card-paw"></i>
                  <h2 className="blog-card-title">How does your cat food compare?</h2>
                  <i className="fa fa-paw blog-card-paw"></i>
                </div>
              </div>

              {/* Card Body */}
              <div className="blog-card-body">
                {/* Image Col */}
                <div className="blog-card-image-wrapper">
                  <img 
                    src="/images/rbanner2.jpg.webp" 
                    alt="How does your cat food compare?" 
                    className="blog-card-image"
                  />
                </div>

                {/* Text & CTA Col */}
                <div className="blog-card-text-column">
                  <div>
                    <span style={{ fontWeight: "bold", fontStyle: "italic", marginRight: "0.5rem", fontSize: "0.95rem" }}>
                      October 25th 2022:
                    </span>
                    <a 
                      href="/downloads/Cat-Food-Comparison-Chart-August-2020.pdf" 
                      download="Cat-Food-Comparison-Chart-August-2020.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1e5da7", textDecoration: "underline", fontWeight: 500, fontSize: "0.95rem" }}
                    >
                      View/Download Cat Food Comparison Chart 2020
                    </a>
                  </div>

                  <p className="blog-card-text">
                    We understand that there are small variances among brands of cat food. For this comparison chart, the following specific cat food products were used and the information was taken from the manufacturer's website or product packaging: Royal Canin: Adult
                  </p>

                  <div>
                    <button 
                      onClick={() => setExpanded(true)}
                      className="blog-card-button"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* EXPANDED STATE (IMAGE 2) */
            <div style={{ display: "flex", flexDirection: "column" }}>
              
              {/* Back Button */}
              <div style={{ marginBottom: "1.5rem" }}>
                <button 
                  onClick={() => {
                    setExpanded(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="back-button"
                >
                  ← Back to Summary
                </button>
              </div>

              <div className="food-comparison-detail-card">
                
                {/* Header Banner - placed inside card body to match blog detail layout */}
                <div className="blog-detail-header-wrapper">
                  <PageHeader title="How does your cat food compare?" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                  {/* Top Text Details */}
                <div style={{ color: "#4a5568", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontStyle: "italic", marginRight: "0.5rem", fontSize: "0.95rem" }}>
                      October 25th 2022:
                    </span>
                    <a 
                      href="/downloads/Cat-Food-Comparison-Chart-August-2020.pdf" 
                      download="Cat-Food-Comparison-Chart-August-2020.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1e5da7", textDecoration: "underline", fontWeight: 500, fontSize: "0.95rem" }}
                    >
                      View/Download Cat Food Comparison Chart 2020
                    </a>
                  </div>

                  <p style={{ margin: 0, fontSize: "1rem", lineHeight: "1.7" }}>
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
                        gap: "0.5rem" 
                      }}
                    >
                      {products.map((prod, pIdx) => (
                        <li key={pIdx} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ color: "#ff9f00", fontSize: "0.9rem" }}>🐾</span>
                          <span style={{ fontWeight: 500, color: "#2d3748", fontSize: "0.95rem" }}>{prod}</span>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                    {criteria.map((c, cIdx) => (
                      <div key={cIdx}>
                        <h3 
                          style={{
                            fontSize: "1.1rem",
                            color: "#1e5da7",
                            fontWeight: 600,
                            textDecoration: "underline",
                            marginBottom: "0.5rem"
                          }}
                        >
                          {c.title}
                        </h3>
                        <p style={{ color: "#4a5568", margin: 0, fontSize: "0.95rem", lineHeight: "1.7" }}>
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
                      background: "#ff9f00",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "25px",
                      padding: "0.65rem 2.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      boxShadow: "0 4px 6px rgba(255, 159, 0, 0.2)",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#e08b00"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#ff9f00"}
                  >
                    Show Less
                  </button>
                </div>

              </div>
            </div>
          </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
