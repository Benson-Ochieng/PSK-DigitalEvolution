import { getLoyaltyPoints, registerLoyaltyCustomer } from "../lib/loyalty.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const phone = url.searchParams.get("phone") || "";

  try {
    const loyalty = await getLoyaltyPoints({ email, phone });
    return Response.json({ success: true, loyalty });
  } catch (error: any) {
    console.error("[Loyalty API] Failed to fetch points", error);
    return Response.json({ success: false, error: error.message || "Could not fetch loyalty points." }, { status: 502 });
  }
}

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    if (body.intent !== "register") {
      return Response.json({ error: "Unsupported loyalty action." }, { status: 400 });
    }

    await registerLoyaltyCustomer({ email: body.email, phone: body.phone, fullname: body.fullname });
    const loyalty = await getLoyaltyPoints({ email: body.email, phone: body.phone, fullname: body.fullname });
    return Response.json({ success: true, loyalty });
  } catch (error: any) {
    console.error("[Loyalty API] Action failed", error);
    return Response.json({ success: false, error: error.message || "Loyalty request failed." }, { status: 502 });
  }
}
