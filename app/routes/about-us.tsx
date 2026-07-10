import { useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("about-us");
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "About Us - PetStore Kenya";
  const description = data?.page?.seo?.description || "Learn about PetStore Kenya, our mission, values, and how we make pet food shopping convenient and affordable across Kenya.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function AboutUs() {
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
        <PageHeader title={page?.title || "About Us"} />

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
          dangerouslySetInnerHTML={{ 
            __html: page?.content || "" 
          }}
        />

      </div>
      <Footer />
    </>
  );
}
