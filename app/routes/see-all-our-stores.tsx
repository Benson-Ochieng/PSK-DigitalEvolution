import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export function meta() {
  return [
    { title: "Locations — PetStore Kenya" },
    { name: "description", content: "Visit one of our convenient PetStore Kenya locations across Nairobi and Mombasa for premium dog food, cat food, and accessories." },
  ];
}

const locations = [
  {
    title: "Petstore Kenya - Spring Valley",
    address: "Spring Valley, Shell Petrol Station, Lower Kabete Road",
    phone: "+254 700 088 163",
    whatsapp: "+254 700 088 163",
    email: "springvalley@petstore.co.ke"
  },
  {
    title: "Petstore Kenya - Karen Branch",
    address: "KSPCA, Langata Road, Karen, Nairobi",
    phone: "+254 758 469 583",
    whatsapp: "+254 758 469 583",
    email: "karen@petstore.co.ke"
  },
  {
    title: "Petstore Kenya - Rosslyn Square",
    address: "Rosslyn Square, Luxury Mall, Redhill Road",
    phone: "+254 115 387 712",
    whatsapp: "+254 115 387 712",
    email: "rosslyn@petstore.co.ke"
  },
  {
    title: "Petstore Kenya - Nyali",
    address: "Greenwood Village Mall, Nyali, Mombasa.",
    phone: "+254 759 862 071",
    whatsapp: "+254 759 862 071",
    email: "nyali@petstore.co.ke"
  },
  {
    title: "Petstore Kenya - 9 Park Square",
    address: "9 park Square, Ridgways Springs Road, Off Kiambu Road",
    phone: "+254 706-805-537",
    whatsapp: "+254 706-805-537",
    email: "Kiamburoad@petstore.co.ke"
  }
];

export default function SeeAllOurStores() {
  return (
    <>
      <Navbar />
      
      {/* Styles block for responsive design and clean classes */}
      <style dangerouslySetInnerHTML={{ __html: `
        .stores-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem var(--page-pad) 5rem;
          font-family: var(--font-sans);
          background-color: #ffffff;
        }
        
        .map-wrapper {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          margin-bottom: 3.5rem;
          background-color: #f7fafc;
        }

        .map-iframe {
          width: 100%;
          height: 480px;
          border: 0;
          display: block;
        }

        .stores-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        @media (max-width: 1200px) {
          .stores-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .stores-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .stores-grid {
            grid-template-columns: 1fr;
          }
          .map-iframe {
            height: 350px;
          }
        }

        .store-card {
          background-color: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 1.75rem 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .store-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .store-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e5da7;
          line-height: 1.3;
          margin: 0 0 1.25rem 0;
        }

        .store-info-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .store-info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.95rem;
          line-height: 1.4;
          color: #4a5568;
        }

        .store-icon {
          color: #1e5da7;
          font-size: 1rem;
          width: 1.25rem;
          text-align: center;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .store-link {
          color: #1e5da7;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
          word-break: break-all;
        }

        .store-link:hover {
          color: #f7c276;
          text-decoration: underline;
        }
      ` }} />

      <div className="stores-container">
        {/* Title Banner */}
        <PageHeader title="Locations" />

        {/* Map Section */}
        <div className="map-wrapper">
          <iframe 
            src="https://www.google.com/maps/d/u/1/embed?mid=1eZ63tVyuvNXR3KhPcKD0r4cYNlGedyQ&ehbc=2E312F&noprof=1"
            className="map-iframe"
            allowFullScreen={true}
            loading="lazy"
            title="PetStore Kenya Stores Location Map"
          ></iframe>
        </div>

        {/* Grid of Store Cards */}
        <div className="stores-grid">
          {locations.map((loc, idx) => (
            <div key={idx} className="store-card">
              <h2 className="store-title">{loc.title}</h2>
              
              <ul className="store-info-list">
                <li className="store-info-item">
                  <i className="fa fa-location-arrow store-icon"></i>
                  <span>{loc.address}</span>
                </li>
                
                <li className="store-info-item">
                  <i className="fa fa-phone store-icon"></i>
                  <a href={`tel:${loc.phone.replace(/\s+/g, "")}`} className="store-link">
                    {loc.phone}
                  </a>
                </li>
                
                <li className="store-info-item">
                  <i className="fa fa-whatsapp store-icon"></i>
                  <a 
                    href={`https://wa.me/${loc.whatsapp.replace(/[^0-9]/g, "")}`} 
                    className="store-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {loc.whatsapp}
                  </a>
                </li>
                
                <li className="store-info-item">
                  <i className="fa fa-envelope store-icon"></i>
                  <a href={`mailto:${loc.email}`} className="store-link">
                    {loc.email}
                  </a>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </>
  );
}
