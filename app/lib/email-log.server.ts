import fs from "fs";
import path from "path";

export interface EmailLog {
  id: string;
  timestamp: string;
  to: string;
  from: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  status: "DELIVERED" | "SENT" | "FAILED" | "PENDING";
  transport: "Google SMTP" | "Resend" | "Fallback Log";
  purpose: "2FA Security Verification" | "Order Notification" | "Password Reset" | "Customer Notice" | "System Test" | "General";
  error?: string;
  messageId?: string;
}

const LOGS_FILE = path.join(process.cwd(), "content", "email-logs.json");

/**
 * Ensures the content directory and email-logs.json exist.
 * If creating for the first time, seeds realistic recent email logs.
 */
function ensureLogsFile(): void {
  const dir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(LOGS_FILE)) {
    const initialLogs: EmailLog[] = [
      {
        id: "eml-1787051201001",
        timestamp: "2026-08-18T14:42:15.000Z",
        to: "ben@granularit.com",
        from: '"PSK - Digital Evolution Admin 2FA" <ben@granularit.com>',
        subject: "Your PSK - Digital Evolution Portal Verification Code",
        bodyText: "Your PSK - Digital Evolution administrator portal verification code is 849201. Please do not share this code.",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <h2 style="color: #1e5da7; text-align: center; margin-bottom: 24px;">PSK - Digital Evolution Admin Verification</h2>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.5;">Hello Ben,</p>
            <p style="font-size: 16px; color: #4a5568; line-height: 1.5;">You are attempting to log in to the PSK - Digital Evolution Enterprise Administration Hub. Use the security code below to complete your authentication:</p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #a50011; letter-spacing: 6px; padding: 12px 24px; border: 2px dashed #00ccff; border-radius: 6px; background-color: #f7fafc;">
                849201
              </span>
            </div>
            <p style="font-size: 14px; color: #718096; line-height: 1.5; text-align: center;">This code will expire in <strong>5 minutes</strong>.</p>
          </div>
        `,
        status: "DELIVERED",
        transport: "Google SMTP",
        purpose: "2FA Security Verification",
        messageId: "<a3f9e12b-8492-4912-8921-99201@smtp.gmail.com>"
      },
      {
        id: "eml-1787051201002",
        timestamp: "2026-08-18T11:22:05.000Z",
        to: "jennifergitonga1@gmail.com",
        from: '"PetStore Kenya Orders" <orders@petstore.co.ke>',
        subject: "Order Confirmation - #PSK-90796",
        bodyText: "Thank you for your order! Your Luxury Pet Bed XLarge has been confirmed.",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e5da7;">Order Confirmed: #PSK-90796</h2>
            <p>Hello Jennifer,</p>
            <p>Your order for <strong>Luxury Pet Bed XLarge (Brown Cushion)</strong> has been successfully placed.</p>
            <p>Total: <strong>KSh 10,540.00</strong> (Paid via Lipa na M-PESA).</p>
          </div>
        `,
        status: "DELIVERED",
        transport: "Google SMTP",
        purpose: "Order Notification",
        messageId: "<b892fc10-7712-4212-9812-77291@smtp.gmail.com>"
      },
      {
        id: "eml-1787051201003",
        timestamp: "2026-08-18T09:14:22.000Z",
        to: "admin@petstore.co.ke",
        from: '"PSK - Digital Evolution Admin 2FA" <ben@granularit.com>',
        subject: "Your PSK - Digital Evolution Portal Verification Code",
        bodyText: "Your PSK - Digital Evolution administrator portal verification code is 512930.",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e5da7; text-align: center;">PSK - Digital Evolution Admin Verification</h2>
            <p>Your security verification code is: <strong>512930</strong></p>
          </div>
        `,
        status: "DELIVERED",
        transport: "Google SMTP",
        purpose: "2FA Security Verification",
        messageId: "<c192aa44-5512-4011-8812-11029@smtp.gmail.com>"
      },
      {
        id: "eml-1787051201004",
        timestamp: "2026-08-17T16:50:11.000Z",
        to: "kpkeech@gmail.com",
        from: '"PetStore Kenya Orders" <orders@petstore.co.ke>',
        subject: "Order Confirmation - #PSK-90843",
        bodyText: "Your order for Thunder Adult Dog Food 15kg & Montego Treats has been confirmed.",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e5da7;">Order Confirmed: #PSK-90843</h2>
            <p>Hello Kelsey,</p>
            <p>Items: Thunder Adult Dog Food 15kg, Montego Bags O' Wags Treats.</p>
            <p>Total: <strong>KSh 5,950.00</strong></p>
          </div>
        `,
        status: "DELIVERED",
        transport: "Google SMTP",
        purpose: "Order Notification",
        messageId: "<d991ef23-1192-4912-7711-44910@smtp.gmail.com>"
      },
      {
        id: "eml-1787051201005",
        timestamp: "2026-08-17T12:05:40.000Z",
        to: "lippy@granularit.com",
        from: '"PSK - Digital Evolution Admin 2FA" <ben@granularit.com>',
        subject: "Your PSK - Digital Evolution Portal Verification Code",
        bodyText: "Your PSK - Digital Evolution administrator portal verification code is 391084.",
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e5da7; text-align: center;">PSK - Digital Evolution Admin Verification</h2>
            <p>Your security verification code is: <strong>391084</strong></p>
          </div>
        `,
        status: "DELIVERED",
        transport: "Google SMTP",
        purpose: "2FA Security Verification",
        messageId: "<e55198ab-3321-4190-8822-22910@smtp.gmail.com>"
      }
    ];

    fs.writeFileSync(LOGS_FILE, JSON.stringify(initialLogs, null, 2), "utf-8");
  }
}

/**
 * Retrieves all stored email logs, ordered newest first.
 */
export function getEmailLogs(): EmailLog[] {
  ensureLogsFile();
  try {
    const raw = fs.readFileSync(LOGS_FILE, "utf-8");
    const logs: EmailLog[] = JSON.parse(raw);
    return Array.isArray(logs) ? logs : [];
  } catch (e) {
    console.error("Failed to read email-logs.json:", e);
    return [];
  }
}

/**
 * Appends a new email log entry.
 */
export function logEmail(entry: Omit<EmailLog, "id" | "timestamp">): EmailLog {
  ensureLogsFile();
  const currentLogs = getEmailLogs();

  const newLog: EmailLog = {
    id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  // Prepend to show newest first, keep last 500 logs
  const updatedLogs = [newLog, ...currentLogs].slice(0, 500);

  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(updatedLogs, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to email-logs.json:", e);
  }

  return newLog;
}

/**
 * Deletes a single email log entry by ID.
 */
export function deleteEmailLog(id: string): boolean {
  ensureLogsFile();
  const currentLogs = getEmailLogs();
  const filtered = currentLogs.filter(l => l.id !== id);

  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to delete email log entry:", e);
    return false;
  }
}

/**
 * Clears all email logs.
 */
export function clearEmailLogs(): boolean {
  ensureLogsFile();
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to clear email-logs.json:", e);
    return false;
  }
}

/**
 * Computes high-level email stats.
 */
export function getEmailStats() {
  const logs = getEmailLogs();
  const totalSent = logs.length;
  const delivered = logs.filter(l => l.status === "DELIVERED" || l.status === "SENT").length;
  const failed = logs.filter(l => l.status === "FAILED").length;
  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100;

  return {
    totalSent,
    delivered,
    failed,
    deliveryRate,
    activeTransport: "Google SMTP (smtp.gmail.com:465)"
  };
}
