import { useLoaderData } from "react-router";
import { useState } from "react";
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
  
  // Track which post IDs are expanded
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
      <Navbar />
      <div 
        className="page-container" 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "3rem var(--page-pad) 5rem",
          fontFamily: "var(--font-sans)"
        }}
      >
        
        {/* Title Banner */}
        <PageHeader title="Education" />

        {/* Blog Posts List */}
        <div 
          style={{ 
            maxWidth: "850px", 
            margin: "2rem auto 0", 
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem"
          }}
        >
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
              No blog posts found. Check back later!
            </div>
          ) : (
            posts.map((post: any) => {
              const isExpanded = !!expandedPosts[post.id];
              
              return (
                <div 
                  key={post.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}
                >
                  {/* Card Header (Title Bar with Accent Bottom Border) */}
                  <div 
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      padding: "0.75rem 1.25rem 0",
                      display: "flex"
                    }}
                  >
                    <div
                      style={{
                        borderBottom: "2.5px solid #1e5da7",
                        marginBottom: "-1.75px",
                        paddingBottom: "0.6rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem"
                      }}
                    >
                      <i className="fa fa-paw" style={{ color: "#1e5da7", fontSize: "0.95rem" }}></i>
                      <h2 
                        style={{ 
                          fontSize: "1.05rem", 
                          fontWeight: 700, 
                          color: "#1e5da7",
                          margin: 0,
                          lineHeight: "1.4"
                        }}
                      >
                        {post.title}
                      </h2>
                      <i className="fa fa-paw" style={{ color: "#1e5da7", fontSize: "0.95rem" }}></i>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div 
                    style={{ 
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem"
                    }}
                  >
                    {/* Content Section: horizontal on large screens, vertical on mobile */}
                    <div 
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "1.5rem",
                        flexWrap: "wrap"
                      }}
                    >
                      {/* Image Thumbnail - Increased Size */}
                      <div 
                        style={{
                          width: "280px",
                          height: "190px",
                          minWidth: "280px",
                          borderRadius: "4px",
                          overflow: "hidden",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f7fafc",
                          padding: "2px"
                        }}
                      >
                        <img 
                          src={post.image_url} 
                          alt={post.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      </div>

                      {/* Text Column */}
                      <div style={{ flex: 1, minWidth: "280px" }}>
                        <p 
                          style={{ 
                            fontSize: "0.95rem", 
                            color: "#4a5568", 
                            lineHeight: "1.6",
                            margin: 0
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: isExpanded ? post.content : (post.excerpt || post.content) 
                          }}
                        />
                      </div>
                    </div>

                    {/* Read More button */}
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f7fafc", paddingTop: "0.75rem" }}>
                      <button
                        onClick={() => toggleExpand(post.id)}
                        style={{
                          backgroundColor: "#ff9f00",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "0.5rem 1.25rem",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e08b00"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ff9f00"}
                      >
                        {isExpanded ? "SHOW LESS" : "READ MORE"}
                      </button>
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
