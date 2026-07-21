import { useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("privacy-policy");
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Privacy Policy - PetStore Kenya";
  const description = data?.page?.seo?.description || "Review the official Privacy Policy of PetStore Kenya (petstore.co.ke) website.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function PrivacyPolicy() {
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
        <PageHeader title={page?.title || "Privacy Policy"} />

        {/* Content Section */}
        <style dangerouslySetInnerHTML={{ __html: `
          .privacy-content {
            color: #333333;
            line-height: 1.8;
            font-size: 1.05rem;
          }
          .privacy-content h2 {
            font-size: 1.6rem;
            font-weight: 700;
            color: #1a202c;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            padding-bottom: 0.6rem;
            border-bottom: 2px solid #edf2f7;
          }
          .privacy-content h2:first-child {
            margin-top: 0.5rem;
          }
          .privacy-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1E5DA7;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            padding-top: 0.5rem;
          }
          .privacy-content p {
            margin-top: 0;
            margin-bottom: 1.25rem;
            color: #4a5568;
            line-height: 1.8;
          }
          .privacy-content ul, .privacy-content ol {
            margin-top: 0.5rem;
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
          }
          .privacy-content li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
            color: #4a5568;
          }
          .privacy-content a {
            color: #1E5DA7;
            text-decoration: underline;
            font-weight: 500;
            transition: color 0.15s ease-in-out;
          }
          .privacy-content a:hover {
            color: #154275;
            text-decoration: underline;
          }
        `}} />
        <div 
          className="privacy-content"
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem"
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
