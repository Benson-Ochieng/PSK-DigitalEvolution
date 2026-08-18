import crypto from "crypto";
import nodemailer from "nodemailer";
// import { Resend } from "resend";

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

import { logEmail } from "~/lib/email-log.server";

/**
 * Sends an OTP via Email using Google SMTP (Active Transport).
 */
export async function sendEmailOtp(email: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || "ben@granularit.com";
  const pass = process.env.SMTP_PASS || "fklwxavfqbxtysrv";
  const from = process.env.SMTP_FROM || '"PSK - Digital Evolution Admin 2FA" <ben@granularit.com>';
  const subject = "Your PSK - Digital Evolution Portal Verification Code";
  const text = `Your PSK - Digital Evolution administrator portal verification code is ${code}. Please do not share this code.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #1e5da7; text-align: center; margin-bottom: 24px;">PSK - Digital Evolution Admin Verification</h2>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.5;">Hello,</p>
      <p style="font-size: 16px; color: #4a5568; line-height: 1.5;">You are attempting to log in to the PSK - Digital Evolution Enterprise Administration Hub. Use the security code below to complete your authentication:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #a50011; letter-spacing: 6px; padding: 12px 24px; border: 2px dashed #00ccff; border-radius: 6px; background-color: #f7fafc;">
          ${code}
        </span>
      </div>
      
      <p style="font-size: 14px; color: #718096; line-height: 1.5; text-align: center;">This code will expire in <strong>5 minutes</strong>. If you did not request this login attempt, please secure your account credentials immediately.</p>
      <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
      <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">&copy; 2026 PSK - Digital Evolution. All rights reserved.</p>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from,
      to: email,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`
==================================================
📧 EMAIL 2FA OTP DISPATCH (GOOGLE SMTP)
==================================================
To:          ${email}
From:        ${from}
Code:        ${code}
Expires:     5 minutes
Account:     ${user}
Message ID:  ${info.messageId}
==================================================
`);

    // Log the successful dispatch
    logEmail({
      to: email,
      from,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "DELIVERED",
      transport: "Google SMTP",
      purpose: "2FA Security Verification",
      messageId: info.messageId
    });

    return true;
  } catch (error: any) {
    console.error("Failed to send OTP email via Google SMTP:", error);
    
    // Log the failed dispatch
    logEmail({
      to: email,
      from,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "FAILED",
      transport: "Google SMTP",
      purpose: "2FA Security Verification",
      error: error?.message || String(error)
    });

    // Fallback: log the code so login is never blocked
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
 * Sends a live test email through the active mail transport and logs the result.
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string; messageId?: string }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || "ben@granularit.com";
  const pass = process.env.SMTP_PASS || "fklwxavfqbxtysrv";
  const from = process.env.SMTP_FROM || '"PSK - Digital Evolution System" <ben@granularit.com>';
  const subject = `[Test Email] PSK Digital Evolution Email System Check (${new Date().toLocaleTimeString()})`;
  const text = `This is a test email sent from the PSK - Digital Evolution Admin Console to verify that your mail transport configuration is functioning correctly.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e5da7; margin: 0;">PSK - Digital Evolution Mail System</h2>
        <span style="display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 8px;">
          ✓ Mail Delivery Test Successful
        </span>
      </div>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        This test message confirms that your <strong>Google SMTP Transport</strong> (<code>${host}:${port}</code>) is properly configured and actively delivering messages from the PetStore Kenya Enterprise portal.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 13px; color: #475569;">
        <p style="margin: 4px 0;"><strong>Sender:</strong> ${from}</p>
        <p style="margin: 4px 0;"><strong>Recipient:</strong> ${toEmail}</p>
        <p style="margin: 4px 0;"><strong>Dispatched At:</strong> ${new Date().toUTCString()}</p>
        <p style="margin: 4px 0;"><strong>Transport:</strong> Google SMTP (Authenticated TLS/SSL)</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        &copy; 2026 PSK - Digital Evolution Admin Console. All rights reserved.
      </p>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text,
      html
    });

    logEmail({
      to: toEmail,
      from,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "DELIVERED",
      transport: "Google SMTP",
      purpose: "System Test",
      messageId: info.messageId
    });

    return {
      success: true,
      message: `Test email successfully delivered to ${toEmail} (Message ID: ${info.messageId})`,
      messageId: info.messageId
    };
  } catch (error: any) {
    console.error("Failed to send test email:", error);
    
    logEmail({
      to: toEmail,
      from,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "FAILED",
      transport: "Google SMTP",
      purpose: "System Test",
      error: error?.message || String(error)
    });

    return {
      success: false,
      message: `Failed to deliver test email: ${error?.message || String(error)}`
    };
  }
}

/**
 * Sends a custom email notification and logs the event.
 */
export async function sendCustomEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  purpose?: "2FA Security Verification" | "Order Notification" | "Password Reset" | "Customer Notice" | "System Test" | "General";
}): Promise<boolean> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || "ben@granularit.com";
  const pass = process.env.SMTP_PASS || "fklwxavfqbxtysrv";
  const from = process.env.SMTP_FROM || '"PSK - Digital Evolution" <ben@granularit.com>';

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.subject,
      html: options.html
    });

    logEmail({
      to: options.to,
      from,
      subject: options.subject,
      bodyText: options.text || options.subject,
      bodyHtml: options.html,
      status: "DELIVERED",
      transport: "Google SMTP",
      purpose: options.purpose || "General",
      messageId: info.messageId
    });

    return true;
  } catch (error: any) {
    logEmail({
      to: options.to,
      from,
      subject: options.subject,
      bodyText: options.text || options.subject,
      bodyHtml: options.html,
      status: "FAILED",
      transport: "Google SMTP",
      purpose: options.purpose || "General",
      error: error?.message || String(error)
    });
    return false;
  }
}

/*
===================================================================
  RESEND IMPLEMENTATION (Commented Out for Future Use)
  To switch back to Resend once your domain DNS is verified:
  1. Uncomment the Resend implementation below & comment out Google SMTP above.
  2. Set RESEND_API_KEY & RESEND_FROM_EMAIL in .env.
===================================================================

export async function sendEmailOtpViaResend(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "PSK - Digital Evolution Admin <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY is not configured. Falling back to console OTP logging.");
    console.log(`
==================================================
⚠️ EMAIL 2FA OTP DISPATCH (LOCAL FALLBACK LOG)
==================================================
To:      ${email}
Code:    ${code}
==================================================
`);
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Your PSK - Digital Evolution Portal Verification Code",
      text: `Your PSK - Digital Evolution administrator portal verification code is ${code}. Please do not share this code.`,
      html: `...`
    });

    if (error) {
      console.error(`❌ Resend Delivery Error: ${error.message}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error sending OTP email via Resend:", error);
    return false;
  }
}
*/

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
