import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit OTP code.
 */
export function generate6DigitOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

/**
 * Computes a SHA256 hash of the OTP code for secure storage.
 */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Sends an OTP via Email (simulated via prominent console logging).
 */
export async function sendEmailOtp(email: string, code: string): Promise<boolean> {
  console.log(`
==================================================
📧 EMAIL 2FA OTP DISPATCH
==================================================
To:      ${email}
Code:    ${code}
Expires: 5 minutes
Message: Your PetStore Kenya administrator portal verification code is ${code}. Please do not share this code.
==================================================
`);
  return true;
}

/**
 * Sends an OTP via SMS (simulated via prominent console logging).
 */
export async function sendSmsOtp(phone: string, code: string): Promise<boolean> {
  console.log(`
==================================================
💬 SMS 2FA OTP DISPATCH
==================================================
To:      ${phone}
Code:    ${code}
Expires: 5 minutes
Message: PSK Admin OTP: ${code}. Valid for 5 mins.
==================================================
`);
  return true;
}
