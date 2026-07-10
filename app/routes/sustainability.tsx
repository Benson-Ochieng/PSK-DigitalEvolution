import { Link, useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getPage } from "../lib/content.server";

export function loader() {
  const page = getPage("sustainability");
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Sustainability & Green Logistics - PetStore Kenya";
  const description = data?.page?.seo?.description || "Learn about our e-bike delivery philosophy, green credentials of local sourcing, and our journey to ISO certification.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function Sustainability() {
  const { page } = useLoaderData() as any;

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        
        {/* Breadcrumb */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--ink-light)", marginBottom: "2rem", letterSpacing: "0.06em" }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>HOME</Link>
          {" / "}
          <span style={{ color: "var(--ink)" }}>SUSTAINABILITY</span>
        </div>

        {/* Dynamic content rendering */}
        <div dangerouslySetInnerHTML={{ __html: page?.content || "" }} />

      </div>
    </>
  );
}
