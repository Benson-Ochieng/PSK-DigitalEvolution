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
          fontFamily: "var(--font-sans)",
          backgroundColor: "#f7fafc"
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
            gap: "2rem"
          }}
        >
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
              No blog posts found. Check back later!
            </div>
          ) : (
            posts.map((post: any) => {
              const isExpanded = !!expandedPosts[post.id];
              const isDog = post.title.toLowerCase().includes("dog") || post.slug.includes("dog");
              
              return (
                <div 
                  key={post.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)"
                  }}
                >
                  {/* Card Header (Title Bar) */}
                  <div 
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      padding: "0.75rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <span style={{ color: "#3182ce", fontSize: "1.1rem" }}>
                      {isDog ? "🐕" : "🐈"}
                    </span>
                    <h2 
                      style={{ 
                        fontSize: "1.1rem", 
                        fontWeight: 700, 
                        color: "#2b6cb0",
                        margin: 0,
                        lineHeight: "1.4"
                      }}
                    >
                      {post.title}
                    </h2>
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
                        gap: "1.25rem",
                        flexWrap: "wrap"
                      }}
                    >
                      {/* Image Thumbnail */}
                      <div 
                        style={{
                          width: "120px",
                          height: "120px",
                          minWidth: "120px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid #edf2f7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f7fafc"
                        }}
                      >
                        <img 
                          src={post.image_url || (isDog ? "/images/puppy-150x150.webp" : "/images/kitten-150x150.webp")} 
                          alt={post.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.currentTarget.src = isDog ? "/images/puppy-150x150.webp" : "/images/kitten-150x150.webp";
                          }}
                        />
                      </div>

                      {/* Text Column */}
                      <div style={{ flex: 1, minWidth: "250px" }}>
                        {/* Publish date */}
                        {post.published_at && (
                          <div style={{ fontSize: "0.8rem", color: "#718096", marginBottom: "0.5rem", fontWeight: 600 }}>
                            {new Date(post.published_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </div>
                        )}

                        <p 
                          style={{ 
                            fontSize: "0.95rem", 
                            color: "#4a5568", 
                            lineHeight: "1.6",
                            margin: 0
                          }}
                        >
                          {isExpanded ? post.content : post.excerpt || post.content.substring(0, 160) + "..."}
                        </p>
                      </div>
                    </div>

                    {/* Read More button */}
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f7fafc", paddingTop: "0.75rem" }}>
                      <button
                        onClick={() => toggleExpand(post.id)}
                        style={{
                          backgroundColor: "#FFB000",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "0.5rem 1.25rem",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e09b00"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#FFB000"}
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
