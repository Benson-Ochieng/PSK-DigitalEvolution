import crypto from "crypto";
import nodemailer from "nodemailer";

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
 * Sends an OTP via Email using Ethereal SMTP for testing.
 */
export async function sendEmailOtp(email: string, code: string): Promise<boolean> {
  try {
    const user = process.env.ETHEREAL_EMAIL || "urban6@ethereal.email";
    const pass = process.env.ETHEREAL_PASSWORD || "mywYgw9vSaeNBG4kHY";

    let transporter;
    let accountInfoForLog = "";

    if (user && pass) {
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user, pass }
      });
      accountInfoForLog = `Configured Account: ${user}`;
    } else {
      const g = global as any;
      if (!g.__etherealTransporter) {
        console.log("Generating dynamic Ethereal test account...");
        const account = await nodemailer.createTestAccount();
        g.__etherealTransporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass
          }
        });
        g.__etherealAccount = account;
      }
      transporter = g.__etherealTransporter;
      accountInfoForLog = `Dynamic Account: ${g.__etherealAccount.user} (Password: ${g.__etherealAccount.pass})`;
    }

    const mailOptions = {
      from: '"PetStore Kenya Admin 2FA" <admin@petstore.co.ke>',
      to: email,
      subject: "Your PetStore Kenya Portal Verification Code",
      text: `Your PetStore Kenya administrator portal verification code is ${code}. Please do not share this code.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #1e5da7; text-align: center; margin-bottom: 24px;">PetStore Kenya Admin Verification</h2>
          <p style="font-size: 16px; color: #4a5568; line-height: 1.5;">Hello,</p>
          <p style="font-size: 16px; color: #4a5568; line-height: 1.5;">You are attempting to log in to the PetStore Kenya Enterprise Administration Hub. Use the security code below to complete your authentication:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #a50011; letter-spacing: 6px; padding: 12px 24px; border: 2px dashed #00ccff; border-radius: 6px; background-color: #f7fafc;">
              ${code}
            </span>
          </div>
          
          <p style="font-size: 14px; color: #718096; line-height: 1.5; text-align: center;">This code will expire in <strong>5 minutes</strong>. If you did not request this login attempt, please secure your account credentials immediately.</p>
          <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
          <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">&copy; 2026 PetStore Kenya. All rights reserved.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`
==================================================
📧 EMAIL 2FA OTP DISPATCH (ETHEREAL TEST)
==================================================
To:          ${email}
Code:        ${code}
Expires:     5 minutes
Account:     ${accountInfoForLog}
Message ID:  ${info.messageId}
Preview URL: ${previewUrl || "N/A"}
==================================================
`);

    return true;
  } catch (error) {
    console.error("Failed to send OTP email via Ethereal SMTP:", error);
    // Fallback: log the code so they can still log in if Ethereal API is down
    console.log(`
==================================================
⚠️ EMAIL 2FA OTP DISPATCH (FALLBACK LOG)
==================================================
To:      ${email}
Code:    ${code}
==================================================
`);
    return false;
  }
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
