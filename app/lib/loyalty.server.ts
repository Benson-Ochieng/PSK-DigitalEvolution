type LoyaltyIdentity = {
  email?: string | null;
  phone?: string | null;
  fullname?: string | null;
};

type LoyaltyOrderInput = LoyaltyIdentity & {
  orderId: number | string;
  eligibleTotal?: number;
  pointsUsed?: number;
  description?: string;
};

function getLoyaltyBaseUrl() {
  return (process.env.LOYALTY_API_URL || "https://loyalty.petstore.co.ke").replace(/\/$/, "");
}

function getLoyaltyApiKey() {
  return process.env.LOYALTY_API_KEY || process.env.PSK_LOYALTY_API_KEY || "";
}

export function isLoyaltyConfigured() {
  return Boolean(getLoyaltyApiKey());
}

export function normalizeKenyanPhone(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return digits;
}

async function loyaltyRequest(path: string, payload: Record<string, any>) {
  const apiKey = getLoyaltyApiKey();
  if (!apiKey) {
    throw new Error("Loyalty API key is not configured.");
  }

  const response = await fetch(`${getLoyaltyBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok || data?.error) {
    const message = data?.error || data?.message || `Loyalty request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function identityPayload(identity: LoyaltyIdentity) {
  const email = identity.email?.trim().toLowerCase() || undefined;
  const phone = normalizeKenyanPhone(identity.phone) || undefined;
  return { email, phone, fullname: identity.fullname?.trim() || undefined };
}

export async function getLoyaltyPoints(identity: LoyaltyIdentity) {
  if (!isLoyaltyConfigured()) {
    return { configured: false, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };
  }

  const payload = identityPayload(identity);
  if (!payload.email && !payload.phone) {
    return { configured: true, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };
  }

  try {
    const data = await loyaltyRequest("/api/loyalty/points", payload);
    const points = data?.points || {};
    const balance = Number(points.balance || points.total || 0);
    return {
      configured: true,
      registered: true,
      balance,
      total: Number(points.total || balance),
      used: Number(points.used || 0),
      conversionRate: Number(points.conversion_rate || 1.2)
    };
  } catch (error: any) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("not found") || message.includes("not registered") || message.includes("invalid")) {
      return { configured: true, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };
    }
    throw error;
  }
}

export async function registerLoyaltyCustomer(identity: LoyaltyIdentity) {
  const payload = identityPayload(identity);
  if (!payload.email && !payload.phone) {
    throw new Error("Email or phone number is required to join the loyalty program.");
  }
  return loyaltyRequest("/api/loyalty/register", payload);
}

export async function creditLoyaltyForOrder(input: LoyaltyOrderInput) {
  if (!isLoyaltyConfigured()) return null;
  const payload = identityPayload(input);
  if (!payload.email && !payload.phone) return null;

  return loyaltyRequest("/api/loyalty/points/credit", {
    ...payload,
    eligible_total: Number(input.eligibleTotal || 0),
    description: input.description || `Purchase on PSK Digital Evolution order #${input.orderId}`,
    reference_id: `EARN-PSKDE-${input.orderId}`,
    source: process.env.LOYALTY_SOURCE || "psk-digital-evolution"
  });
}

export async function debitLoyaltyForOrder(input: LoyaltyOrderInput) {
  if (!isLoyaltyConfigured()) return null;
  const payload = identityPayload(input);
  const pointsUsed = Math.max(0, Math.floor(Number(input.pointsUsed || 0)));
  if ((!payload.email && !payload.phone) || pointsUsed <= 0) return null;

  return loyaltyRequest("/api/loyalty/points/debit", {
    ...payload,
    points_used: pointsUsed,
    description: input.description || `PSK Cash redeemed on PSK Digital Evolution order #${input.orderId}`,
    reference_id: `REDEEM-PSKDE-${input.orderId}`,
    source: process.env.LOYALTY_SOURCE || "psk-digital-evolution"
  });
}
