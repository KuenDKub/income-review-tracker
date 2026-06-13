/**
 * Single-user session auth for this internal tool.
 *
 * Credentials and signing secret come from env vars (never hardcoded):
 *   APP_AUTH_EMAIL, APP_AUTH_PASSWORD, AUTH_SECRET
 *
 * A successful login sets an httpOnly cookie holding an HMAC signature of the
 * configured email. The signature can't be forged without AUTH_SECRET, so the
 * middleware can validate it on the Edge runtime without a session store.
 * "Login once, use for a long time" = a long cookie maxAge (see COOKIE_MAX_AGE).
 *
 * Uses Web Crypto so the same code runs in both Edge middleware and Node routes.
 */

export const SESSION_COOKIE = "irt_session";
// 1 year. Rotate AUTH_SECRET to invalidate all existing sessions.
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type AuthConfig = { email: string; password: string; secret: string };

function getAuthConfig(): AuthConfig {
  return {
    email: process.env.APP_AUTH_EMAIL ?? "",
    password: process.env.APP_AUTH_PASSWORD ?? "",
    secret: process.env.AUTH_SECRET ?? "",
  };
}

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toBase64Url(sig);
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify a login attempt against the configured credentials. */
export function verifyCredentials(email: string, password: string): boolean {
  const cfg = getAuthConfig();
  if (!cfg.email || !cfg.password) return false;
  return (
    safeEqual(email.trim().toLowerCase(), cfg.email.trim().toLowerCase()) &&
    safeEqual(password, cfg.password)
  );
}

/** Build the cookie value to store after a successful login. */
export async function createSessionValue(): Promise<string> {
  const cfg = getAuthConfig();
  return hmac(cfg.email.trim().toLowerCase(), cfg.secret);
}

/** Validate a cookie value coming from the browser. */
export async function isValidSession(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const cfg = getAuthConfig();
  if (!cfg.email || !cfg.secret) return false;
  const expected = await hmac(cfg.email.trim().toLowerCase(), cfg.secret);
  return safeEqual(token, expected);
}
