import { db } from "~/lib/db.server";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { code, subtotal, email } = await request.json();
    const couponCode = (code || "").toString().trim().toUpperCase();

    if (!couponCode) {
      return Response.json({ valid: false, message: "Please enter a coupon code." }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({ where: { code: couponCode } });

    if (!coupon) {
      return Response.json({ valid: false, message: "Invalid coupon code." });
    }

    // Check status/active
    if (coupon.active === false || coupon.status === "inactive" || coupon.status === "draft" || coupon.status === "expired") {
      return Response.json({ valid: false, message: "This coupon code is not active." });
    }

    // Check expiry
    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate);
      expiry.setHours(23, 59, 59, 999);
      if (!isNaN(expiry.getTime()) && Date.now() > expiry.getTime()) {
        return Response.json({ valid: false, message: "This coupon code has expired." });
      }
    }

    const currentSubtotal = Number(subtotal) || 0;

    // Check minimum spend
    if (coupon.minimumSpend && currentSubtotal < coupon.minimumSpend) {
      return Response.json({
        valid: false,
        message: `Minimum spend of KES ${coupon.minimumSpend.toLocaleString()} required for coupon '${coupon.code}'.`
      });
    }

    // Check maximum spend
    if (coupon.maximumSpend && currentSubtotal > coupon.maximumSpend) {
      return Response.json({
        valid: false,
        message: `Maximum spend for coupon '${coupon.code}' is KES ${coupon.maximumSpend.toLocaleString()}.`
      });
    }

    // Check allowed emails
    if (coupon.allowedEmails && coupon.allowedEmails.trim()) {
      const allowedList = coupon.allowedEmails.split(",").map(e => e.trim().toLowerCase());
      const userEmail = (email || "").toString().trim().toLowerCase();
      if (!userEmail || !allowedList.includes(userEmail)) {
        return Response.json({
          valid: false,
          message: "This coupon is restricted to specific account emails."
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((currentSubtotal * coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(currentSubtotal, coupon.discountValue);
    }

    const discountText = coupon.discountType === "percentage"
      ? `${coupon.discountValue}% off`
      : `KES ${coupon.discountValue.toLocaleString()} off`;

    return Response.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      allowFreeShipping: coupon.allowFreeShipping || false,
      message: `Coupon '${coupon.code}' applied successfully! (${discountText})`
    });

  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return Response.json({ valid: false, message: "Error validating coupon code." }, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  const subtotal = Number(url.searchParams.get("subtotal") || 0);
  const email = (url.searchParams.get("email") || "").trim();

  if (!code) {
    return Response.json({ valid: false, message: "Please enter a coupon code." });
  }

  const mockRequest = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal, email })
  });

  return action({ request: mockRequest });
}
