import { useLoaderData, Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { query } from "../db.server";

export function meta() {
  return [
    { title: "Education & Blog — PetStore Kenya" },
    { name: "description", content: "Read our essential dog and cat care guides and tips from PetStore Kenya." },
  ];
}

export async function loader() {
  const { rows } = await query("SELECT * FROM blog_posts ORDER BY published_at DESC");
  return { posts: rows };
}

export default function Blog() {
  const { posts } = useLoaderData<typeof loader>();

  // Helper to format html text, decode standard entities and replace "Read More" with "..."
  const formatContent = (html: string) => {
    if (!html) return "";
    let cleaned = html
      .replace(/&#8211;/g, "–")
      .replace(/&#8217;/g, "’")
      .replace(/&#8220;/g, "“")
      .replace(/&#8221;/g, "”")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");

    // Remove any trailing "Read More" and replace it with "..."
    cleaned = cleaned.replace(/\s*Read\s+More\s*(<\/p>)?$/i, "...$1").trim();
    cleaned = cleaned.replace(/\s*Read\s+More\s*$/i, "...").trim();
    return cleaned;
  };

  return (
    <>
      <Navbar />
      
      {/* Inject custom styles for responsive blog card layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem var(--page-pad) 5rem;
          font-family: var(--font-sans);
        }
        .blog-list {
          max-width: 850px;
          margin: 2rem auto 0;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
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
          padding: 1.25rem;
          display: flex;
          flex-direction: row;
          gap: 1.5rem;
        }
        .blog-card-image-wrapper {
          width: 240px;
          height: 160px;
          min-width: 240px;
          border-radius: 4px;
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
          gap: 0.75rem;
        }
        .blog-card-text {
          font-size: 0.95rem;
          color: #4a5568;
          line-height: 1.6;
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
          padding: 0.55rem 1.35rem;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-transform: uppercase;
        }
        .blog-card-button:hover {
          background-color: #e08b00;
        }
        .blog-card-title-link {
          text-decoration: none;
        }
        .blog-card-title-link:hover .blog-card-title {
          color: #1a4f8f;
        }
        
        @media (max-width: 768px) {
          .blog-card-body {
            flex-direction: column;
          }
          .blog-card-image-wrapper {
            width: 100%;
            min-width: 100%;
            height: auto;
            aspect-ratio: 16/10;
          }
        }
      `}} />

      <div className="blog-container">
        
        {/* Title Banner */}
        <PageHeader title="Education" />

        {/* Blog Posts List */}
        <div className="blog-list">
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
              No blog posts found. Check back later!
            </div>
          ) : (
            posts.map((post: any) => {
              const displayContent = post.excerpt || post.content;
              
              return (
                <div key={post.id} className="blog-card">
                  {/* Card Header (Title Bar with Accent Bottom Border) */}
                  <div className="blog-card-header">
                    <div className="blog-card-header-inner">
                      <i className="fa fa-paw blog-card-paw"></i>
                      <Link to={`/blog/${post.slug}`} className="blog-card-title-link">
                        <h2 className="blog-card-title">{post.title}</h2>
                      </Link>
                      <i className="fa fa-paw blog-card-paw"></i>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="blog-card-body">
                    {/* Image Thumbnail */}
                    <div className="blog-card-image-wrapper">
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="blog-card-image"
                      />
                    </div>

                    {/* Text Column */}
                    <div className="blog-card-text-column">
                      <p 
                        className="blog-card-text"
                        dangerouslySetInnerHTML={{ 
                          __html: formatContent(displayContent) 
                        }}
                      />

                      {/* Read More button */}
                      <Link
                        to={`/blog/${post.slug}`}
                        className="blog-card-button"
                      >
                        READ MORE
                      </Link>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
      <Footer />
    </>
  );
}
