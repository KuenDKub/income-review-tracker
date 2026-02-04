/**
 * Daily check script: health endpoint, optional DB (via health API).
 * On any failure, send alert email. Run via cron: node scripts/daily-check.js
 * Env: APP_URL (e.g. https://your-domain), ALERT_EMAIL_TO, SMTP_* for email.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const https = require("https");
const http = require("http");

try {
  require("dotenv").config();
} catch {
  // dotenv optional
}

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

async function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(APP_URL);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;
    const path = `${url.pathname.replace(/\/$/, "")}/api/health`;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: CRON_SECRET ? `${path}?secret=${encodeURIComponent(CRON_SECRET)}` : path,
      method: "GET",
    };
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (ch) => (data += ch));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            if (json.status === "ok") resolve(undefined);
            else reject(new Error(json.message || "Health returned non-ok"));
          } catch {
            resolve(undefined);
          }
        } else {
          reject(new Error(`Health returned ${res.statusCode}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Health check timeout"));
    });
    req.end();
  });
}

async function sendAlertEmail(reason) {
  const to = process.env.ALERT_EMAIL_TO;
  const host = process.env.SMTP_HOST;
  if (!to || !host) {
    console.warn("Email not configured: ALERT_EMAIL_TO or SMTP_HOST missing");
    return;
  }
  try {
    const nodemailer = require("nodemailer");
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER || "noreply@localhost",
      to,
      subject: "Review Income & Tax Tracker — Daily check failed",
      text: `Daily check failed: ${reason}\n\nTime: ${new Date().toISOString()}`,
    });
  } catch (err) {
    console.error("Failed to send alert email:", err);
  }
}

async function run() {
  const failures = [];
  try {
    await checkHealth();
  } catch (err) {
    failures.push(`Health: ${err.message}`);
  }
  if (failures.length > 0) {
    const reason = failures.join("; ");
    console.error("Daily check failed:", reason);
    await sendAlertEmail(reason);
    process.exit(1);
  }
  console.log("Daily check OK");
}

run();
