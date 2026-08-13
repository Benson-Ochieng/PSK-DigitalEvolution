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

function numberFrom(values: any[], fallback = 0) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function boolFrom(values: any[]) {
  for (const value of values) {
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
  }

  return null;
}

function loyaltyCandidates(data: any) {
  return [
    data?.points,
    data?.data?.points,
    data?.loyalty?.points,
    data?.data?.loyalty,
    data?.loyalty,
    data?.customer,
    data?.user,
    data?.data,
    data
  ]
    .filter(Boolean)
    .map((item) => (typeof item === "number" ? { balance: item, total: item } : item));
}

function parseLoyaltyPoints(data: any) {
  const candidates = loyaltyCandidates(data);
  const values = (keys: string[]) => candidates.flatMap((item) => keys.map((key) => item?.[key]));

  const balance = numberFrom(
    values(["balance", "available_points", "availablePoints", "current_balance", "points_balance", "points"]),
    0
  );
  const total = numberFrom(
    values(["total", "total_points", "totalPoints", "earned", "earned_points", "points_earned"]),
    balance
  );
  const used = numberFrom(values(["used", "used_points", "usedPoints", "redeemed", "redeemed_points", "points_used"]), 0);
  const conversionRate = numberFrom(values(["conversion_rate", "conversionRate", "redemption_rate", "redemptionRate"]), 1.2);
  const explicitRegistered = boolFrom(
    values(["registered", "is_registered", "isRegistered", "lp_registered", "enrolled", "is_enrolled", "isEnrolled"])
  );

  return {
    configured: true,
    registered: explicitRegistered ?? (balance > 0 || total > 0 || Boolean(data?.success)),
    balance,
    total,
    used,
    conversionRate
  };
}

function isMissingLoyaltyAccount(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("not found") || message.includes("not registered") || message.includes("invalid");
}

function lookupAttempts(payload: ReturnType<typeof identityPayload>) {
  const attempts = [
    payload,
    payload.phone ? { phone: payload.phone, fullname: payload.fullname } : null,
    payload.email ? { email: payload.email, fullname: payload.fullname } : null
  ].filter(Boolean) as Record<string, any>[];

  return attempts.filter((attempt, index) => {
    const key = JSON.stringify(attempt);
    return attempts.findIndex((candidate) => JSON.stringify(candidate) === key) === index;
  });
}

export async function getLoyaltyPoints(identity: LoyaltyIdentity) {
  if (!isLoyaltyConfigured()) {
    return { configured: false, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };
  }

  const payload = identityPayload(identity);
  if (!payload.email && !payload.phone) {
    return { configured: true, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };
  }

  let fallback = { configured: true, registered: false, balance: 0, total: 0, used: 0, conversionRate: 1.2 };

  for (const attempt of lookupAttempts(payload)) {
    try {
      const data = await loyaltyRequest("/api/loyalty/points", attempt);
      const parsed = parseLoyaltyPoints(data);

      if (parsed.registered && parsed.balance > 0) {
        return parsed;
      }

      if (parsed.registered || !fallback.registered) {
        fallback = parsed;
      }
    } catch (error: any) {
      if (isMissingLoyaltyAccount(error)) {
        continue;
      }
      throw error;
    }
  }

  return fallback;
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

  const creditPayload = {
    ...payload,
    eligible_total: Number(input.eligibleTotal || 0),
    description: input.description || `Purchase on PSK Digital Evolution order #${input.orderId}`,
    reference_id: `EARN-PSKDE-${input.orderId}`,
    source: process.env.LOYALTY_SOURCE || "psk-digital-evolution"
  };

  try {
    return await loyaltyRequest("/api/loyalty/points/credit", creditPayload);
  } catch (err: any) {
    if (isMissingLoyaltyAccount(err)) {
      try {
        console.log(`[Loyalty] Customer ${payload.email || payload.phone} not registered yet. Auto-registering for order #${input.orderId}...`);
        await registerLoyaltyCustomer(payload);
        return await loyaltyRequest("/api/loyalty/points/credit", creditPayload);
      } catch (regErr: any) {
        console.error("[Loyalty] Auto-registration or credit retry failed:", regErr);
        throw regErr;
      }
    }
    throw err;
  }
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

export async function resetLoyaltyCustomer(identity: LoyaltyIdentity) {
  if (!isLoyaltyConfigured()) return null;
  const payload = identityPayload(identity);
  if (!payload.email && !payload.phone) return null;

  try {
    return await loyaltyRequest("/api/loyalty/reset", payload);
  } catch (e) {
    try {
      const pointsInfo = await getLoyaltyPoints(identity);
      if (pointsInfo.balance > 0) {
        await loyaltyRequest("/api/loyalty/points/debit", {
          ...payload,
          points_used: pointsInfo.balance,
          description: "Loyalty points reset due to account deletion",
          reference_id: `RESET-DELETED-${Date.now()}`,
          source: process.env.LOYALTY_SOURCE || "psk-digital-evolution"
        });
      }
    } catch (err) {
      console.error("Failed to reset loyalty points for deleted user:", err);
    }
    return null;
  }
}
