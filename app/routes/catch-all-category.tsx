import { useLoaderData } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";
import ShopPage, { loader as shopLoader, meta as shopMeta } from "./shop";

export async function loader(args: any) {
  const slug = args.params.slug || "";
  const page = getPage(slug);
  if (page) {
    return { type: "page", page };
  }
  const shopData = await shopLoader(args);
  return { ...shopData, type: "shop" };
}

export function meta(args: any) {
  const data = args.data;
  if (data?.type === "page") {
    const title = data?.page?.seo?.title || `${data?.page?.title} - PetStore Kenya`;
    const description = data?.page?.seo?.description || `Read our page about ${data?.page?.title}.`;
    return [
      { title },
      { name: "description", content: description },
    ];
  }
  return shopMeta(args);
}

export default function CatchAllCategory() {
  const data = useLoaderData() as any;

  if (data?.type === "page") {
    const page = data.page;
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
          <PageHeader title={page?.title} />

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

  return <ShopPage />;
}
