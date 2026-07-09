import { useLoaderData, Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { query } from "../db.server";

export function meta({ data }: { data: any }) {
  if (!data || !data.post) {
    return [{ title: "Blog Post Not Found - PetStore Kenya" }];
  }
  return [
    { title: `${data.post.title} - PetStore Kenya` },
    { name: "description", content: data.post.excerpt || `Read our care guide on ${data.post.title}` },
  ];
}

export async function loader({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { rows } = await query("SELECT * FROM blog_posts WHERE slug = $1", [slug]);
  if (rows.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }
  return { post: rows[0] };
}

export default function BlogDetail() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-detail-page {
          background-color: #f7fafc;
          min-height: 100vh;
          padding: 3rem var(--page-pad) 5rem;
          font-family: var(--font-sans);
        }
        .blog-detail-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .back-to-blog {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e5da7;
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          transition: color 0.2s;
        }
        .back-to-blog:hover {
          color: #ff9f00;
        }
        .blog-detail-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .blog-detail-header-wrapper {
          overflow: hidden;
          border-radius: 8px;
        }
        .blog-detail-body {
          padding: 2.5rem 3rem 3.5rem;
        }
        .blog-detail-content {
          font-size: 1.05rem;
          line-height: 1.85;
          color: #4a5568;
        }
        .blog-detail-content p {
          margin-bottom: 1.5rem;
        }
        .blog-detail-content strong {
          color: #1a202c;
          font-weight: 700;
        }
        .blog-detail-content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 0 0 1.5rem 0;
          border-radius: 6px;
        }
        /* Style elementor buttons inside post content */
        .blog-detail-content .elementor-button {
          display: inline-block;
          background-color: #1e5da7;
          color: #ffffff !important;
          padding: 0.65rem 1.65rem;
          border-radius: 4px;
          font-weight: bold;
          text-decoration: none;
          margin-top: 1.25rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .blog-detail-content .elementor-button:hover {
          background-color: #1a4f8f;
        }
        /* Make sure Elementor wrapper classes do not break layout */
        .elementor, .elementor-section, .elementor-container, .elementor-column, .elementor-widget-wrap {
          width: 100%;
        }

        /* Mobile specific enhancements to widen the header card and optimize spacing */
        @media (max-width: 768px) {
          .blog-detail-page {
            padding: 1.5rem var(--page-pad) 3.5rem;
          }
          .blog-detail-body {
            padding: 1.5rem 1rem 2rem;
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

      <div className="blog-detail-page">
        <div className="blog-detail-container">
          
          {/* Back Link */}
          <Link to="/blog" className="back-to-blog">
            <i className="fa fa-arrow-left"></i> Back to Education
          </Link>

          {/* Card wrapper */}
          <div className="blog-detail-card">
            
            {/* Body */}
            <div className="blog-detail-body">
              
              {/* Header Banner - placed inside body so it leaves space on the sides and top */}
              <div className="blog-detail-header-wrapper">
                <PageHeader title={post.title} />
              </div>

              <div 
                className="blog-detail-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
