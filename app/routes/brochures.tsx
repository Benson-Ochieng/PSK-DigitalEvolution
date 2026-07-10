import { useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("brochures");
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Brochures - PetStore Kenya";
  const description = data?.page?.seo?.description || "Download our product brochures and leaflets at PetStore Kenya.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function Brochures() {
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
        <PageHeader title={page?.title || "Brochures"} />

        {/* Content Section */}
        <div 
          style={{ 
            maxWidth: "960px", 
            margin: "0 auto", 
            padding: "1rem",
            color: "#333333"
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
