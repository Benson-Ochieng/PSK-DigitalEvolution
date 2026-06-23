import { useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router";
import { db } from "~/lib/db.server";
import { createUserSession, getAdminUser, checkAdminBranch } from "~/lib/sessions.server";

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
  const login = formData.get("login")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!login || !password) {
    return { error: "Please enter both credentials" };
  }

  // Find user by username or email
  const user = await db.user.findUnique({
    where: {
      email: login.includes("@") ? login : undefined,
      username: !login.includes("@") ? login : undefined,
    },
  });

  if (!user || user.passwordHash !== password) {
    return { error: "Invalid username/email or password" };
  }

  if (user.role !== "administrator" && user.role !== "shop_manager") {
    return { error: "Access denied. Admin or Manager role required." };
  }

  if (user.status === "suspended") {
    return { error: "This account has been suspended" };
  }

  const { logHistoryEvent } = await import("~/lib/content.server");
  logHistoryEvent(user.name, "User Logged In", `Successfully signed into the administration panel`, "🔑");

  return createUserSession(user.id, "/store_backend");
}

export default function VpBackendLogin() {
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-page">
      <style dangerouslySetInnerHTML={{ __html: `
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
          background: rgba(71, 47, 143, 0.12); /* Red glow */
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
          background: #472f8f;
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
          background: linear-gradient(135deg, #472f8f 0%, #a50011 100%);
          border: none;
          border-radius: 8px;
          padding: 14px;
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(71, 47, 143, 0.3);
          margin-top: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff1a37 0%, #bd0015 100%);
          box-shadow: 0 6px 20px rgba(71, 47, 143, 0.5), 0 0 10px rgba(0, 204, 255, 0.2);
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
          background: rgba(71, 47, 143, 0.15);
          border: 1px solid rgba(71, 47, 143, 0.4);
          color: #ff4d62;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 24px;
          text-align: center;
          box-shadow: 0 0 15px rgba(71, 47, 143, 0.1);
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

        .form-input.password-input {
          padding-right: 48px;
        }

        .password-toggle-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s ease;
        }

        .password-toggle-btn:hover {
          color: #ffffff;
        }
      ` }} />

      <div className="login-container">
        <div className="logo-wrap">
          <img src="/images/psk_logo.png" alt="PetStore Kenya Logo" style={{ height: "42px", width: "auto" }} />
          <span className="logo-badge">PORTAL</span>
        </div>
        <p className="subtitle">Enterprise Administration Hub</p>

        {actionData?.error && (
          <div className="error-banner">
            {actionData.error}
          </div>
        )}

        <Form method="post">
          <div className="form-group">
            <label className="form-label" htmlFor="login">Username or Email</label>
            <div className="form-input-wrapper">
              <input
                className="form-input"
                type="text"
                id="login"
                name="login"
                placeholder="admin@petstore.co.ke"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <input
                className="form-input password-input"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="btn-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Sign In to Console"}
          </button>
        </Form>

        <a href="/" className="back-link">
          ← Return to Storefront
        </a>
      </div>
    </div>
  );
}
