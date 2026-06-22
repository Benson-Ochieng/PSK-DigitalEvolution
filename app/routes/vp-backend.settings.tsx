import { useState, useEffect } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import fs from "fs";
import path from "path";
import { logHistoryEvent } from "~/lib/content.server";

// PHP date formatting translations helper
function formatPhpDate(format: string, date: Date = new Date()): string {
  if (!format) return "";
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const monthName = months[monthIndex];
  const day = String(date.getDate()).padStart(2, "0");
  const dayNum = date.getDate();
  const monthNum = String(monthIndex + 1).padStart(2, "0");

  let hours24 = date.getHours();
  let minutes = String(date.getMinutes()).padStart(2, "0");
  let ampm = hours24 >= 12 ? "pm" : "am";
  let AMPM = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  let result = format;
  result = result.replace(/F/g, monthName);
  result = result.replace(/j/g, String(dayNum));
  result = result.replace(/Y/g, String(year));
  result = result.replace(/y/g, String(year).slice(-2));
  result = result.replace(/m/g, monthNum);
  result = result.replace(/d/g, day);
  
  result = result.replace(/g/g, String(hours12));
  result = result.replace(/H/g, String(hours24).padStart(2, "0"));
  result = result.replace(/i/g, minutes);
  result = result.replace(/a/g, ampm);
  result = result.replace(/A/g, AMPM);

  return result;
}

export async function loader({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const CONTENT_DIR = path.join(process.cwd(), "content");
  const settingsPath = path.join(CONTENT_DIR, "general-settings.json");
  
  let settings = {
    siteTitle: "Vision Plus",
    tagline: "Experience Everything",
    siteIcon: "/assets/images/pages/vision-plus-logo.png",
    wpAddressUrl: "https://visionplus.co.ke",
    siteAddressUrl: "https://visionplus.co.ke",
    adminEmail: "developers@granularit.com",
    anyoneCanRegister: false,
    defaultRole: "subscriber",
    siteLanguage: "en_US",
    timezone: "UTC+3",
    dateFormat: "F j, Y",
    dateFormatCustom: "",
    timeFormat: "g:i a",
    timeFormatCustom: "",
    weekStartsOn: "Monday"
  };

  if (fs.existsSync(settingsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      settings = { ...settings, ...parsed };
    } catch (e) {
      console.error("Failed to parse settings:", e);
    }
  }

  return { settings, currentUser };
}

export async function action({ request }: { request: Request }) {
  const { requireAdminUser } = await import("~/lib/sessions.server");
  const currentUser = await requireAdminUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "save_general_settings") {
    const siteTitle = formData.get("siteTitle")?.toString() || "";
    const tagline = formData.get("tagline")?.toString() || "";
    const siteIcon = formData.get("siteIcon")?.toString() || "";
    const wpAddressUrl = formData.get("wpAddressUrl")?.toString() || "";
    const siteAddressUrl = formData.get("siteAddressUrl")?.toString() || "";
    const adminEmail = formData.get("adminEmail")?.toString() || "";
    const anyoneCanRegister = formData.get("anyoneCanRegister") === "true";
    const defaultRole = formData.get("defaultRole")?.toString() || "subscriber";
    const siteLanguage = formData.get("siteLanguage")?.toString() || "en_US";
    const timezone = formData.get("timezone")?.toString() || "UTC+3";
    const dateFormat = formData.get("dateFormat")?.toString() || "F j, Y";
    const dateFormatCustom = formData.get("dateFormatCustom")?.toString() || "";
    const timeFormat = formData.get("timeFormat")?.toString() || "g:i a";
    const timeFormatCustom = formData.get("timeFormatCustom")?.toString() || "";
    const weekStartsOn = formData.get("weekStartsOn")?.toString() || "Monday";

    const updated = {
      siteTitle,
      tagline,
      siteIcon,
      wpAddressUrl,
      siteAddressUrl,
      adminEmail,
      anyoneCanRegister,
      defaultRole,
      siteLanguage,
      timezone,
      dateFormat,
      dateFormatCustom,
      timeFormat,
      timeFormatCustom,
      weekStartsOn
    };

    const CONTENT_DIR = path.join(process.cwd(), "content");
    
    // Save settings configuration
    fs.writeFileSync(
      path.join(CONTENT_DIR, "general-settings.json"),
      JSON.stringify(updated, null, 2),
      "utf-8"
    );

    // Sync site metadata index
    const siteMetaPath = path.join(CONTENT_DIR, "site-meta.json");
    let siteMeta = {
      name: "Vision Plus",
      description: "Experience Everything",
      url: "https://visionplus.co.ke",
      logo: "https://visionplus.co.ke/wp-content/uploads/2023/05/vision_black_logo.png",
      logoLocal: "/assets/images/pages/vision-plus-logo.png"
    };

    if (fs.existsSync(siteMetaPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(siteMetaPath, "utf-8"));
        siteMeta = { ...siteMeta, ...parsed };
      } catch (e) {}
    }

    siteMeta.name = siteTitle;
    siteMeta.description = tagline;
    siteMeta.url = siteAddressUrl;
    
    fs.writeFileSync(
      siteMetaPath,
      JSON.stringify(siteMeta, null, 2),
      "utf-8"
    );

    // Log this event to the simple history log
    logHistoryEvent(currentUser.name, "Settings Updated", "Updated site configuration settings in the General control panel", "⚙️");

    return { success: true };
  }

  return null;
}

export default function VpBackendSettings() {
  const { settings } = useLoaderData() as any;
  const actionData = useActionData() as { success?: boolean; error?: string } | undefined;
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  // State hooks
  const [showNotice, setShowNotice] = useState(true);
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteIcon, setSiteIcon] = useState(settings.siteIcon);
  const [anyoneCanRegister, setAnyoneCanRegister] = useState(settings.anyoneCanRegister);
  
  // Date selection states
  const [dateFormatType, setDateFormatType] = useState(() => {
    const stdFormats = ["F j, Y", "Y-m-d", "m/d/Y", "d/m/Y", "d.m.Y"];
    return stdFormats.includes(settings.dateFormat) ? settings.dateFormat : "custom";
  });
  const [customDateFormat, setCustomDateFormat] = useState(() => {
    const stdFormats = ["F j, Y", "Y-m-d", "m/d/Y", "d/m/Y", "d.m.Y"];
    return stdFormats.includes(settings.dateFormat) ? "" : settings.dateFormat;
  });

  // Time selection states
  const [timeFormatType, setTimeFormatType] = useState(() => {
    const stdFormats = ["g:i a", "g:i A", "H:i"];
    return stdFormats.includes(settings.timeFormat) ? settings.timeFormat : "custom";
  });
  const [customTimeFormat, setCustomTimeFormat] = useState(() => {
    const stdFormats = ["g:i a", "g:i A", "H:i"];
    return stdFormats.includes(settings.timeFormat) ? "" : settings.timeFormat;
  });

  // Current system clock states for real-time formatting previews
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDateFormatString = dateFormatType === "custom" ? customDateFormat : dateFormatType;
  const currentTimeFormatString = timeFormatType === "custom" ? customTimeFormat : timeFormatType;

  // Format sample inputs
  const formatSampleDate = (formatStr: string) => {
    try {
      return formatPhpDate(formatStr, now);
    } catch {
      return "Invalid date format";
    }
  };

  const formatSampleTime = (formatStr: string) => {
    try {
      return formatPhpDate(formatStr, now);
    } catch {
      return "Invalid time format";
    }
  };

  return (
    <div className="settings-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        .settings-container {
          max-width: 960px;
          color: #f3f4f6;
          font-family: 'Poppins', sans-serif;
          padding-bottom: 50px;
        }

        .settings-title-row {
          margin-bottom: 24px;
        }

        .settings-title-row h2 {
          font-size: 22px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .notice-banner {
          background: rgba(255, 255, 255, 0.02);
          border-left: 4px solid #ff4d62;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          padding: 14px 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .notice-banner a {
          color: #00ccff;
          text-decoration: none;
        }

        .notice-banner a:hover {
          text-decoration: underline;
        }

        .notice-dismiss {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .notice-dismiss:hover {
          color: #ff4d62;
        }

        .settings-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .settings-table {
          width: 100%;
          border-collapse: collapse;
        }

        .settings-table tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .settings-table tr:last-child {
          border-bottom: none;
        }

        .settings-label-cell {
          width: 240px;
          padding: 24px 20px 24px 0;
          vertical-align: top;
          font-weight: 600;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          text-transform: capitalize;
        }

        .settings-input-cell {
          padding: 24px 0;
          vertical-align: top;
        }

        .settings-input-cell input[type="text"],
        .settings-input-cell input[type="email"],
        .settings-input-cell select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          color: #fff;
          padding: 10px 14px;
          font-size: 14px;
          width: 100%;
          max-width: 480px;
          outline: none;
          transition: all 0.3s ease;
        }

        .settings-input-cell input:focus,
        .settings-input-cell select:focus {
          border-color: #00ccff;
          box-shadow: 0 0 8px rgba(0, 204, 255, 0.15);
        }

        .settings-input-cell select {
          cursor: pointer;
        }

        .settings-input-cell .input-description {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 8px;
          line-height: 1.6;
          max-width: 480px;
        }

        /* Site Icon Browser Mockup */
        .browser-mockup {
          background: #12121a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          max-width: 320px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .browser-bar {
          background: #09090e;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .browser-dots {
          display: flex;
          gap: 6px;
        }

        .browser-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
        }

        .browser-tab {
          background: #12121a;
          padding: 6px 14px;
          border-radius: 6px 6px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: none;
          margin-bottom: -9px;
          margin-top: 2px;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .browser-tab-icon {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .browser-content {
          height: 30px;
          background: #12121a;
        }

        .site-icon-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }

        .btn-mini-settings {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-mini-settings:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-mini-settings.danger {
          border-color: rgba(255, 77, 98, 0.3);
          color: #ff4d62;
        }

        .btn-mini-settings.danger:hover {
          background: rgba(255, 77, 98, 0.1);
        }

        /* Checkbox */
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 13.5px;
          color: rgba(255,255,255,0.85);
          width: fit-content;
        }

        .checkbox-container input[type="checkbox"] {
          accent-color: #ff4d62;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        /* Radio list */
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 480px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          width: fit-content;
        }

        .radio-label input[type="radio"] {
          accent-color: #ff4d62;
          width: 16px;
          height: 16px;
          margin-right: 12px;
          cursor: pointer;
        }

        .format-code {
          font-family: monospace;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 8px;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .custom-format-input {
          background: rgba(0, 0, 0, 0.35) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 4px !important;
          color: #fff !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-family: monospace !important;
          outline: none !important;
          margin-left: 8px !important;
          width: 90px !important;
          display: inline-block !important;
        }

        .custom-format-input:focus {
          border-color: #00ccff !important;
        }

        .format-preview {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
          margin-left: 28px;
          font-weight: 500;
        }

        .btn-blue {
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 12px 24px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
        }

        .btn-blue:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.45);
        }

        .btn-blue:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-toast {
          background: rgba(46, 213, 115, 0.1);
          border: 1px solid rgba(46, 213, 115, 0.3);
          color: #2ed573;
          border-radius: 6px;
          padding: 12px 18px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }
      ` }} />

      <div className="settings-title-row">
        <h2>General Settings</h2>
      </div>

      {showNotice && (
        <div className="notice-banner">
          <span>
            This theme recommends the following plugins: <strong>Salient Demo Importer</strong> and <strong>Salient Portfolio</strong>.{" "}
            <a href="#install">Begin installing plugins</a> | <a href="#dismiss" onClick={(e) => { e.preventDefault(); setShowNotice(false); }}>Dismiss this notice</a>
          </span>
          <button className="notice-dismiss" onClick={() => setShowNotice(false)}>×</button>
        </div>
      )}

      {actionData?.success && (
        <div className="success-toast">
          <span>✓</span> Settings saved successfully. Changes synced to metadata registry.
        </div>
      )}

      <Form method="post">
        <input type="hidden" name="intent" value="save_general_settings" />
        
        <div className="settings-card">
          <table className="settings-table">
            <tbody>
              {/* Site Title */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="siteTitle">Site Title</label>
                </td>
                <td className="settings-input-cell">
                  <input
                    type="text"
                    id="siteTitle"
                    name="siteTitle"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    required
                  />
                </td>
              </tr>

              {/* Tagline */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="tagline">Tagline</label>
                </td>
                <td className="settings-input-cell">
                  <input
                    type="text"
                    id="tagline"
                    name="tagline"
                    defaultValue={settings.tagline}
                  />
                  <div className="input-description">
                    In a few words, explain what this site is about. Example: "Just another WordPress site."
                  </div>
                </td>
              </tr>

              {/* Site Icon */}
              <tr>
                <td className="settings-label-cell">
                  <label>Site Icon</label>
                </td>
                <td className="settings-input-cell">
                  <div className="browser-mockup">
                    <div className="browser-bar">
                      <div className="browser-dots">
                        <div className="browser-dot" />
                        <div className="browser-dot" />
                        <div className="browser-dot" />
                      </div>
                      <div className="browser-tab">
                        {siteIcon && (
                          <img
                            className="browser-tab-icon"
                            src={siteIcon}
                            alt="Tab Icon"
                          />
                        )}
                        <span>{siteTitle || "Vision Plus"}</span>
                      </div>
                    </div>
                    <div className="browser-content" />
                  </div>
                  <input type="hidden" name="siteIcon" value={siteIcon} />
                  <div className="site-icon-actions">
                    <button
                      type="button"
                      className="btn-mini-settings"
                      onClick={() => {
                        const url = prompt("Enter custom site icon image URL:", siteIcon);
                        if (url !== null) setSiteIcon(url);
                      }}
                    >
                      Change Site Icon
                    </button>
                    {siteIcon && (
                      <button
                        type="button"
                        className="btn-mini-settings danger"
                        onClick={() => setSiteIcon("")}
                      >
                        Remove Site Icon
                      </button>
                    )}
                  </div>
                  <div className="input-description">
                    The Site Icon is what you see in browser tabs, bookmark bars, and within the WordPress mobile apps. It should be square and at least 512 by 512 pixels.
                  </div>
                </td>
              </tr>

              {/* WordPress Address URL */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="wpAddressUrl">WordPress Address (URL)</label>
                </td>
                <td className="settings-input-cell">
                  <input
                    type="text"
                    id="wpAddressUrl"
                    name="wpAddressUrl"
                    defaultValue={settings.wpAddressUrl}
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                    readOnly
                  />
                </td>
              </tr>

              {/* Site Address URL */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="siteAddressUrl">Site Address (URL)</label>
                </td>
                <td className="settings-input-cell">
                  <input
                    type="text"
                    id="siteAddressUrl"
                    name="siteAddressUrl"
                    defaultValue={settings.siteAddressUrl}
                  />
                </td>
              </tr>

              {/* Administration Email Address */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="adminEmail">Administration Email Address</label>
                </td>
                <td className="settings-input-cell">
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    defaultValue={settings.adminEmail}
                    required
                  />
                  <div className="input-description">
                    This address is used for admin purposes. If you change this, an email will be sent to your new address to confirm it. The new address will not become active until confirmed.
                  </div>
                </td>
              </tr>

              {/* Membership */}
              <tr>
                <td className="settings-label-cell">
                  <label>Membership</label>
                </td>
                <td className="settings-input-cell">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={anyoneCanRegister}
                      onChange={(e) => setAnyoneCanRegister(e.target.checked)}
                    />
                    <span>Anyone can register</span>
                  </label>
                  <input type="hidden" name="anyoneCanRegister" value={anyoneCanRegister ? "true" : "false"} />
                </td>
              </tr>

              {/* New User Default Role */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="defaultRole">New User Default Role</label>
                </td>
                <td className="settings-input-cell">
                  <select
                    id="defaultRole"
                    name="defaultRole"
                    defaultValue={settings.defaultRole}
                  >
                    <option value="subscriber">Subscriber</option>
                    <option value="customer">Customer</option>
                    <option value="shop_manager">Shop Manager</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </td>
              </tr>

              {/* Site Language */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="siteLanguage">Site Language</label>
                </td>
                <td className="settings-input-cell">
                  <select
                    id="siteLanguage"
                    name="siteLanguage"
                    defaultValue={settings.siteLanguage}
                  >
                    <option value="en_US">English (United States)</option>
                    <option value="en_GB">English (United Kingdom)</option>
                    <option value="sw_KE">Kiswahili (Kenya)</option>
                  </select>
                </td>
              </tr>

              {/* Timezone */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="timezone">Timezone</label>
                </td>
                <td className="settings-input-cell">
                  <select
                    id="timezone"
                    name="timezone"
                    defaultValue={settings.timezone}
                  >
                    <option value="UTC+3">UTC+3 (Nairobi, East Africa)</option>
                    <option value="UTC+2">UTC+2 (Cairo, Central Africa)</option>
                    <option value="UTC+1">UTC+1 (Lagos, West Africa)</option>
                    <option value="UTC+0">UTC+0 (London, GMT)</option>
                  </select>
                  <div className="input-description">
                    Choose either a city in the same timezone as you or a UTC (Coordinated Universal Time) time offset.
                    <br />
                    Universal time is <span style={{ fontFamily: "monospace", color: "#fff" }}>{formatPhpDate("Y-m-d H:i:s", now)}</span>.
                    <br />
                    Local time is <span style={{ fontFamily: "monospace", color: "#00ccff" }}>{formatPhpDate("Y-m-d H:i:s", now)}</span>.
                  </div>
                </td>
              </tr>

              {/* Date Format */}
              <tr>
                <td className="settings-label-cell">
                  <label>Date Format</label>
                </td>
                <td className="settings-input-cell">
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="F j, Y"
                        checked={dateFormatType === "F j, Y"}
                        onChange={() => setDateFormatType("F j, Y")}
                      />
                      <span className="radio-label-text">{formatSampleDate("F j, Y")}</span>
                      <span className="format-code">F j, Y</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="Y-m-d"
                        checked={dateFormatType === "Y-m-d"}
                        onChange={() => setDateFormatType("Y-m-d")}
                      />
                      <span className="radio-label-text">{formatSampleDate("Y-m-d")}</span>
                      <span className="format-code">Y-m-d</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="m/d/Y"
                        checked={dateFormatType === "m/d/Y"}
                        onChange={() => setDateFormatType("m/d/Y")}
                      />
                      <span className="radio-label-text">{formatSampleDate("m/d/Y")}</span>
                      <span className="format-code">m/d/Y</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="d/m/Y"
                        checked={dateFormatType === "d/m/Y"}
                        onChange={() => setDateFormatType("d/m/Y")}
                      />
                      <span className="radio-label-text">{formatSampleDate("d/m/Y")}</span>
                      <span className="format-code">d/m/Y</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="d.m.Y"
                        checked={dateFormatType === "d.m.Y"}
                        onChange={() => setDateFormatType("d.m.Y")}
                      />
                      <span className="radio-label-text">{formatSampleDate("d.m.Y")}</span>
                      <span className="format-code">d.m.Y</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="custom"
                        checked={dateFormatType === "custom"}
                        onChange={() => setDateFormatType("custom")}
                      />
                      <span className="radio-label-text">Custom:</span>
                      <input
                        className="custom-format-input"
                        type="text"
                        name="dateFormatCustom"
                        value={customDateFormat}
                        onChange={(e) => {
                          setCustomDateFormat(e.target.value);
                          setDateFormatType("custom");
                        }}
                        placeholder="e.g. F j, Y"
                      />
                    </label>

                    <div className="format-preview">
                      Preview: <span style={{ color: "#fff" }}>{formatSampleDate(currentDateFormatString || "F j, Y")}</span>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Time Format */}
              <tr>
                <td className="settings-label-cell">
                  <label>Time Format</label>
                </td>
                <td className="settings-input-cell">
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="g:i a"
                        checked={timeFormatType === "g:i a"}
                        onChange={() => setTimeFormatType("g:i a")}
                      />
                      <span className="radio-label-text">{formatSampleTime("g:i a")}</span>
                      <span className="format-code">g:i a</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="g:i A"
                        checked={timeFormatType === "g:i A"}
                        onChange={() => setTimeFormatType("g:i A")}
                      />
                      <span className="radio-label-text">{formatSampleTime("g:i A")}</span>
                      <span className="format-code">g:i A</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="H:i"
                        checked={timeFormatType === "H:i"}
                        onChange={() => setTimeFormatType("H:i")}
                      />
                      <span className="radio-label-text">{formatSampleTime("H:i")}</span>
                      <span className="format-code">H:i</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="custom"
                        checked={timeFormatType === "custom"}
                        onChange={() => setTimeFormatType("custom")}
                      />
                      <span className="radio-label-text">Custom:</span>
                      <input
                        className="custom-format-input"
                        type="text"
                        name="timeFormatCustom"
                        value={customTimeFormat}
                        onChange={(e) => {
                          setCustomTimeFormat(e.target.value);
                          setTimeFormatType("custom");
                        }}
                        placeholder="e.g. g:i a"
                      />
                    </label>

                    <div className="format-preview">
                      Preview: <span style={{ color: "#fff" }}>{formatSampleTime(currentTimeFormatString || "g:i a")}</span>
                      <br />
                      <a href="https://www.php.net/manual/en/datetime.format.php" target="_blank" rel="noopener noreferrer" style={{ color: "#00ccff", textDecoration: "none", fontSize: "11px" }}>
                        Documentation on date and time formatting
                      </a>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Week Starts On */}
              <tr>
                <td className="settings-label-cell">
                  <label htmlFor="weekStartsOn">Week Starts On</label>
                </td>
                <td className="settings-input-cell">
                  <select
                    id="weekStartsOn"
                    name="weekStartsOn"
                    defaultValue={settings.weekStartsOn}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </td>
              </tr>

            </tbody>
          </table>

          <div className="settings-submit-row">
            <button
              type="submit"
              className="btn-blue"
              disabled={isSaving}
            >
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
}
