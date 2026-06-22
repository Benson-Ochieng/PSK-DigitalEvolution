import { useLoaderData } from "react-router";

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const user = await requireAdminUser(request);
  return { user };
}

export default function VpBackendComments() {
  useLoaderData();
  return (
    <div style={{ padding: "40px", textAlign: "center", color: "#f3f4f6" }}>
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>💬</div>
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px", background: "linear-gradient(135deg, #ffffff 40%, #ff7b8b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Comments Moderation
      </h2>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", maxWidth: "480px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
        The comments feedback loop is connected to the storefront pages. Here you will be able to review, approve, mark as spam, or trash customer comments and feedback.
      </p>
      <div style={{ display: "inline-block", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "10px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: "#ff4d62" }}>
        🚀 Coming Soon in Next Update
      </div>
    </div>
  );
}
