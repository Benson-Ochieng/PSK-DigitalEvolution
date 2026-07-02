import { query } from "../db.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const idsStr = url.searchParams.get("ids") || "";
  if (!idsStr) {
    return Response.json([]);
  }
  const ids = idsStr.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  if (ids.length === 0) {
    return Response.json([]);
  }
  try {
    const res = await query(
      `SELECT id, name, tags FROM products WHERE id = ANY($1)`,
      [ids]
    );
    return Response.json(res.rows);
  } catch (error) {
    console.error("Failed to query product tags", error);
    return Response.json([], { status: 500 });
  }
}
