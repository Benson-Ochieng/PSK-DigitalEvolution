import { useLoaderData, Form, Link, redirect } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getPage } from "../lib/content.server";
import { query } from "../db.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const success = url.searchParams.get("success") === "true";

  const cookieHeader = request.headers.get("Cookie") || "";
  const emailCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_email="));
  const customerEmail = emailCookie ? decodeURIComponent(emailCookie.split("=")[1]) : "";

  const page = getPage("account-deletion");
  return { page, customerEmail, success };
}

export async function action({ request }: { request: Request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const emailCookie = cookieHeader.split("; ").find(row => row.startsWith("customer_email="));
  const customerEmail = emailCookie ? decodeURIComponent(emailCookie.split("=")[1]) : "";

  if (customerEmail) {
    // Delete addresses
    await query("DELETE FROM customer_addresses WHERE customer_email = $1", [customerEmail]);
    // Delete customer
    await query("DELETE FROM customers WHERE email = $1", [customerEmail]);
  }

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "customer_name=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
  );
  headers.append(
    "Set-Cookie",
    "customer_email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
  );
  return redirect("/account-deletion?success=true", { headers });
}

export function meta({ data }: { data: any }) {
  const title = data?.page?.seo?.title || "Account Deletion - PetStore Kenya";
  const description = data?.page?.seo?.description || "Request deletion of your PetStore Kenya account and associated personal data.";
  return [
    { title },
    { name: "description", content: description },
  ];
}

export default function AccountDeletion() {
  const { page, customerEmail, success } = useLoaderData() as any;

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
        <PageHeader title={page?.title || "Account Deletion"} />

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
        >
          {success && (
            <div style={{ backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb", padding: "1rem", borderRadius: "4px", marginBottom: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
              🐾 Your account and saved details have been successfully deleted.
            </div>
          )}

          <div dangerouslySetInnerHTML={{ __html: page?.content || "" }} />

          <div style={{ marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
            {customerEmail ? (
              <Form 
                method="post" 
                onSubmit={(e) => { 
                  if (!confirm("Are you sure you want to permanently delete your account and all saved details? This action cannot be undone.")) {
                    e.preventDefault(); 
                  }
                }}
              >
                <div style={{ marginBottom: "1rem", color: "#666", fontSize: "0.95rem" }}>
                  Logged in as: <strong>{customerEmail}</strong>
                </div>
                <button 
                  type="submit" 
                  style={{ 
                    backgroundColor: "#ff4d4d", 
                    color: "#ffffff", 
                    padding: "0.75rem 2rem", 
                    border: "none", 
                    borderRadius: "4px", 
                    fontSize: "1rem", 
                    fontWeight: "bold", 
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "background-color 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e60000")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ff4d4d")}
                >
                  Delete Account
                </button>
              </Form>
            ) : (
              <div style={{ padding: "1.25rem", backgroundColor: "#f9f9f9", border: "1px solid #ddd", borderRadius: "4px", color: "#555" }}>
                🔑 Please <Link to="/my-account" style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "underline" }}>Log In</Link> to delete your account yourself.
              </div>
            )}
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
