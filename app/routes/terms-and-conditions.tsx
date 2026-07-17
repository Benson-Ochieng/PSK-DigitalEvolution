import { useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("terms-and-conditions");
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Terms and Conditions - PetStore Kenya";
  const description = data?.page?.seo?.description || "Review the official Terms and Conditions of PetStore Kenya (petstore.co.ke) website.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function TermsAndConditions() {
  const { page } = useLoaderData() as any;

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
        <PageHeader title={page?.title || "Terms & Conditions"} />

        {/* Content Section */}
        <style dangerouslySetInnerHTML={{ __html: `
          .terms-content a {
            color: #1E5DA7;
            text-decoration: underline;
            font-weight: 500;
            transition: color 0.15s ease-in-out;
          }
          .terms-content a:hover {
            color: #154275;
            text-decoration: underline;
          }
        `}} />
        <div 
          className="terms-content"
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333",
            lineHeight: "1.8",
            fontSize: "1.05rem"
          }}
          dangerouslySetInnerHTML={{ 
            __html: page?.content || "" 
          }}
        />

      </div>
      <Footer />
    </>
  );
}
