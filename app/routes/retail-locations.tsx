import { useLoaderData, redirect } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";

export function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "");

  if (pathname === "/retail-locations") {
    return redirect("/retail-locations-nairobi-nanyuki-naivasha-nakuru-mombasa/");
  }

  const page = getPage("retail-locations-nairobi-nanyuki-naivasha-nakuru-mombasa") || getPage("retail-locations");
  return { page };
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Retail Locations – Nairobi, Nanyuki, Naivasha, Nakuru, Mombasa — PetStore Kenya";
  const description = data?.page?.seo?.description || "Available at Leading Retailers Nationwide. Find Your Pet's Favourite Food – Anywhere in Kenya.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function RetailLocations() {
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
        <PageHeader title={page?.title || "Retail Locations – Nairobi, Nanyuki, Naivasha, Nakuru, Mombasa"} />

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
