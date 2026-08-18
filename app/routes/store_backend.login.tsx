import { useState, useEffect } from "react";
import { Form, redirect, useActionData, useNavigation, useFetcher } from "react-router";
import { db } from "~/lib/db.server";
import { createUserSession, getAdminUser, checkAdminBranch } from "~/lib/sessions.server";

// Helper to mask sensitive communication endpoints for security
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}******${phone.slice(-2)}`;
}

export async function loader({ request }: { request: Request }) {
  checkAdminBranch();

  const user = await getAdminUser(request);
  if (user) {
    return redirect("/store_backend");
  }
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString() || "login";

  if (intent === "login") {
    const loginInput = formData.get("login")?.toString().trim();

    if (!loginInput) {
      return { error: "Please enter your email or phone number" };
    }

    // Find user by email, phone, or username
    const users = await db.user.findMany();

    // Find matched user
    const matchedUsers = users.filter(u => {
      const emailMatch = u.email.toLowerCase() === loginInput.toLowerCase();
      const usernameMatch = u.username.toLowerCase() === loginInput.toLowerCase();
      const phoneMatch = u.phone &&
        u.phone.replace(/[\s-+]/g, "") === loginInput.replace(/[\s-+]/g, "");
      return emailMatch || usernameMatch || phoneMatch;
    });

    let user: any = matchedUsers.find(u =>
      u.email.toLowerCase() === loginInput.toLowerCase() ||
      u.username.toLowerCase() === loginInput.toLowerCase()
    ) || matchedUsers[0] || null;

    // If still not found, check if input is an admin email or default admin
    if (!user) {
      user = await db.user.findUnique({ where: { email: loginInput } }) ||
             await db.user.findUnique({ where: { username: loginInput } }) ||
             await db.user.findUnique({ where: { id: loginInput } });
    }

    if (!user) {
      return { error: "Access denied. Administrator account not found." };
    }

    // Auto-grant administrator role if matching admin email
    const emailLower = (user.email || "").toLowerCase();
    const smtpEmail = (process.env.SMTP_USER || "").toLowerCase();
    if (
      user.id === "u-admin" ||
      user.id === "u-admin-ben" ||
      emailLower === "admin@petstore.co.ke" ||
      emailLower === "ben@granularit.com" ||
      (smtpEmail && emailLower === smtpEmail)
    ) {
      user.role = "administrator";
    }

    if (user.role !== "administrator" && user.role !== "shop_manager") {
      return { error: "Access denied. Admin or Manager role required." };
    }

    if (user.status === "suspended") {
      return { error: "This account has been suspended" };
    }

    // Determine delivery targets based on input type
    const isEmailInput = loginInput.includes("@");
    const isPhoneInput = /^[+0-9\s-]+$/.test(loginInput);

    let sendToEmail = false;
    let sendToPhone = false;
    let emailTarget = user.email;
    let phoneTarget = user.phone || "";

    if (isEmailInput) {
      sendToEmail = true;
      emailTarget = loginInput;
    } else if (isPhoneInput) {
      sendToPhone = true;
      phoneTarget = loginInput;
    } else {
      sendToEmail = true;
      if (user.phone) {
        sendToPhone = true;
      }
    }

    // Generate & send OTP
    const { generate6DigitOtp, hashOtp, sendEmailOtp, sendSmsOtp } = await import("~/lib/notification.server");
    const code = generate6DigitOtp();
    const codeHash = hashOtp(code);

    // Save OtpSession (5-minute expiry)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    let targetLabel = "";
    if (sendToEmail && sendToPhone) {
      targetLabel = `${emailTarget} & ${phoneTarget}`;
    } else if (sendToEmail) {
      targetLabel = emailTarget;
    } else {
      targetLabel = phoneTarget;
    }

    const otpSession = await db.otpSession.create({
      userId: user.id,
      target: targetLabel,
      codeHash,
      expiresAt,
      attempts: 0,
      invalidated: false
    });

    // Dispatch OTP
    if (sendToEmail) {
      await sendEmailOtp(emailTarget, code);
    }
    if (sendToPhone && phoneTarget) {
      await sendSmsOtp(phoneTarget, code);
    }

    return {
      success: true,
      otpSent: true,
      sessionId: otpSession.id,
      targetEmail: sendToEmail ? maskEmail(emailTarget) : null,
      targetPhone: sendToPhone && phoneTarget ? maskPhone(phoneTarget) : null,
      originalInput: loginInput
    };
  }

  if (intent === "verify") {
    const sessionId = formData.get("sessionId")?.toString();
    const code = formData.get("code")?.toString().trim();

    if (!sessionId || !code) {
      return { error: "Invalid verification request details." };
    }

    const otpSession = await db.otpSession.findUnique({ where: { id: sessionId } });
    if (!otpSession || otpSession.invalidated) {
      return { error: "Invalid or expired OTP session. Please request a new code." };
    }

    const now = new Date();
    const expiresAt = new Date(otpSession.expiresAt);
    if (now > expiresAt) {
      await db.otpSession.update({ where: { id: sessionId }, data: { invalidated: true } });
      return { error: "OTP code has expired (5-minute limit). Please request a new code." };
    }

    if (otpSession.attempts >= 5) {
      await db.otpSession.update({ where: { id: sessionId }, data: { invalidated: true } });
      return { error: "Too many failed attempts. This code is now locked. Please request a new OTP." };
    }

    const { hashOtp } = await import("~/lib/notification.server");
    const incomingHash = hashOtp(code);

    if (otpSession.codeHash !== incomingHash) {
      const newAttempts = otpSession.attempts + 1;
      await db.otpSession.update({ where: { id: sessionId }, data: { attempts: newAttempts } });

      if (newAttempts >= 5) {
        await db.otpSession.update({ where: { id: sessionId }, data: { invalidated: true } });
        return { error: "Too many failed attempts. This code has been locked. Please request a new code." };
      }
      return { error: `Invalid OTP code. ${5 - newAttempts} attempts remaining.` };
    }

    // Success! Invalidate OTP session so it cannot be reused
    await db.otpSession.update({ where: { id: sessionId }, data: { invalidated: true } });

    const user = await db.user.findUnique({ where: { id: otpSession.userId } });
    if (!user || user.status === "suspended") {
      return { error: "User account status error." };
    }

    const { logHistoryEvent } = await import("~/lib/content.server");
    logHistoryEvent(user.name, "User Logged In (OTP)", `Successfully signed in via passwordless OTP verification`, "🔑");

    return createUserSession(user.id, "/store_backend");
  }

  if (intent === "resend") {
    const sessionId = formData.get("sessionId")?.toString();
    if (!sessionId) {
      return { error: "Missing session info." };
    }

    const oldSession = await db.otpSession.findUnique({ where: { id: sessionId } });
    if (!oldSession) {
      return { error: "OTP session not found." };
    }

    // Invalidate old session
    await db.otpSession.update({ where: { id: sessionId }, data: { invalidated: true } });

    const user = await db.user.findUnique({ where: { id: oldSession.userId } });
    if (!user || user.status === "suspended") {
      return { error: "Authorized user not found." };
    }

    // Cooldown check (ensure 30s has passed since old session created)
    const timeSinceCreated = Date.now() - new Date(oldSession.createdAt).getTime();
    if (timeSinceCreated < 30 * 1000) {
      return { error: "Please wait at least 30 seconds before requesting another code." };
    }

    // Re-resolve target based on what user initially typed or registered target
    const loginInput = oldSession.target;
    const isEmailInput = loginInput.includes("@");
    const isPhoneInput = /^[+0-9\s-]+$/.test(loginInput);

    let sendToEmail = false;
    let sendToPhone = false;
    let emailTarget = user.email;
    let phoneTarget = user.phone || "";

    if (isEmailInput) {
      sendToEmail = true;
      emailTarget = loginInput.split(" & ")[0] || user.email;
    } else if (isPhoneInput) {
      sendToPhone = true;
      phoneTarget = loginInput.split(" & ").pop() || user.phone || "";
    } else {
      sendToEmail = true;
      if (user.phone) {
        sendToPhone = true;
      }
    }

    // Generate & send new OTP
    const { generate6DigitOtp, hashOtp, sendEmailOtp, sendSmsOtp } = await import("~/lib/notification.server");
    const code = generate6DigitOtp();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const newSession = await db.otpSession.create({
      userId: user.id,
      target: oldSession.target,
      codeHash,
      expiresAt,
      attempts: 0,
      invalidated: false
    });

    if (sendToEmail) {
      await sendEmailOtp(emailTarget, code);
    }
    if (sendToPhone && phoneTarget) {
      await sendSmsOtp(phoneTarget, code);
    }

    return {
      success: true,
      otpSent: true,
      sessionId: newSession.id,
      targetEmail: sendToEmail ? maskEmail(emailTarget) : null,
      targetPhone: sendToPhone && phoneTarget ? maskPhone(phoneTarget) : null
    };
  }

  return { error: "Unsupported operation" };
}

export default function VpBackendLogin() {
  const actionData = useActionData() as { error?: string; otpSent?: boolean; sessionId?: string; targetEmail?: string | null; targetPhone?: string | null } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [storedSessionId, setStoredSessionId] = useState<string | null>(null);

  const fetcher = useFetcher();

  // Watch for successful OTP generation from normal submission or resend fetcher
  useEffect(() => {
    if (actionData && 'otpSent' in actionData && actionData.otpSent) {
      setStoredSessionId(actionData.sessionId || null);
    }
  }, [actionData]);

  useEffect(() => {
    const fd = fetcher.data as any;
    if (fd && 'otpSent' in fd && fd.otpSent) {
      setStoredSessionId(fd.sessionId || null);
    }
  }, [fetcher.data]);

  // Timers for expiration and resend cooldowns
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (!storedSessionId) return;

    setTimeLeft(300);
    setResendCooldown(30);

    const mainTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(mainTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const cooldownTimer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(mainTimer);
      clearInterval(cooldownTimer);
    };
  }, [storedSessionId]);

  const handleResend = () => {
    if (resendCooldown > 0 || !storedSessionId) return;
    fetcher.submit(
      { intent: "resend", sessionId: storedSessionId },
      { method: "post" }
    );
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const activeError = actionData?.error || (fetcher.data as any)?.error;

  return (
    <div className="login-page">
      <style dangerouslySetInnerHTML={{
        __html: `
        .login-page {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 50%, #151522 0%, #0a0a0f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          color: #ffffff;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glowing background shapes */
        .login-page::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: rgba(30, 93, 167, 0.12); /* Red glow */
          border-radius: 50%;
          filter: blur(100px);
          top: 15%;
          left: 20%;
          pointer-events: none;
        }

        .login-page::after {
          content: '';
          position: absolute;
          width: 350px;
          height: 350px;
          background: rgba(0, 204, 255, 0.12); /* Cyan glow */
          border-radius: 50%;
          filter: blur(120px);
          bottom: 15%;
          right: 20%;
          pointer-events: none;
        }

        .login-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          width: 100%;
          max-width: 440px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          z-index: 10;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .login-container:hover {
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 
                      0 0 30px rgba(0, 204, 255, 0.05);
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
        }

        .logo-badge {
          display: inline-block;
          font-size: 10px;
          background: #1E5DA7;
          color: #fff;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 1px;
        }

        .subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
          margin-top: -20px;
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 24px;
          position: relative;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #ffffff !important;
          opacity: 0.95;
          margin-bottom: 8px;
        }

        .form-input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 8px;
          padding: 12px 16px;
          color: #ffffff !important;
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }

        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover, 
        .form-input:-webkit-autofill:focus, 
        .form-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #151522 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .form-input:focus {
          border-color: #00ccff !important;
          box-shadow: 0 0 15px rgba(0, 204, 255, 0.2) !important;
          background: rgba(0, 0, 0, 0.4) !important;
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #1E5DA7 0%, #a50011 100%);
          border: none;
          border-radius: 8px;
          padding: 14px;
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(30, 93, 167, 0.3);
          margin-top: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff1a37 0%, #bd0015 100%);
          box-shadow: 0 6px 20px rgba(30, 93, 167, 0.5), 0 0 10px rgba(0, 204, 255, 0.2);
          transform: translateY(-2px);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .error-banner {
          background: rgba(30, 93, 167, 0.15);
          border: 1px solid rgba(30, 93, 167, 0.4);
          color: #ff4d62;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 24px;
          text-align: center;
          box-shadow: 0 0 15px rgba(30, 93, 167, 0.1);
        }

        .back-link {
          display: block;
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: #00ccff;
        }
      ` }} />

      <div className="login-container">
        <div className="logo-wrap">
          <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" style={{ height: "42px", width: "auto" }} />
          <span className="logo-badge">PORTAL</span>
        </div>
        <p className="subtitle">Enterprise Administration Hub</p>

        {activeError && (
          <div className="error-banner">
            {activeError}
          </div>
        )}

        {storedSessionId ? (
          <Form method="post">
            <input type="hidden" name="intent" value="verify" />
            <input type="hidden" name="sessionId" value={storedSessionId} />

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
                We sent a 6-digit OTP code to:
              </p>
              {(actionData?.targetEmail || (fetcher.data as any)?.targetEmail) && (
                <p style={{ fontWeight: "bold", color: "#00ccff", fontSize: "15px", marginTop: "4px" }}>
                  {actionData?.targetEmail || (fetcher.data as any)?.targetEmail}
                </p>
              )}
              {(actionData?.targetPhone || (fetcher.data as any)?.targetPhone) && (
                <p style={{ fontWeight: "bold", color: "#00ccff", fontSize: "15px", marginTop: "2px" }}>
                  {actionData?.targetPhone || (fetcher.data as any)?.targetPhone}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="code">Verification Code (OTP)</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input code-input"
                  type="text"
                  id="code"
                  name="code"
                  maxLength={6}
                  placeholder="••••••"
                  required
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                  style={{
                    textAlign: "center",
                    fontSize: "24px",
                    letterSpacing: "6px",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    background: "rgba(0, 0, 0, 0.4) !important",
                    border: "1px solid rgba(0, 204, 255, 0.3) !important"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", fontSize: "13px" }}>
              <span style={{ color: timeLeft < 60 ? "#ff4d62" : "rgba(255, 255, 255, 0.5)" }}>
                Expires in: <strong>{timeLeft > 0 ? `${minutes}:${seconds}` : "Expired"}</strong>
              </span>
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleResend}
                style={{
                  background: "none",
                  border: "none",
                  color: resendCooldown > 0 ? "rgba(255, 255, 255, 0.3)" : "#00ccff",
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "underline"
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            <button className="btn-submit" type="submit" disabled={isSubmitting || timeLeft === 0}>
              {isSubmitting ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button type="button" onClick={() => setStoredSessionId(null)} className="back-link" style={{ background: "none", border: "none", cursor: "pointer", width: "100%" }}>
              ← Return to credentials page
            </button>
          </Form>
        ) : (
          <Form method="post">
            <input type="hidden" name="intent" value="login" />
            <div className="form-group">
              <label className="form-label" htmlFor="login">Email or Phone Number</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  type="text"
                  id="login"
                  name="login"
                  placeholder="admin@petstore.co.ke or +254712345678"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <button className="btn-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Request Login OTP"}
            </button>
          </Form>
        )}

        <a href="/" className="back-link">
          ← Return to Storefront
        </a>
      </div>
    </div>
  );
}
