/**
 * Demo admin authentication: credentials from env, HMAC-signed httpOnly session cookie.
 * Phase 4 replaces this with Supabase Auth (email + password, staff roles, RLS).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bez_admin";
const SESSION_HOURS = 12;

export const demoCredentials = {
  email: process.env.ADMIN_EMAIL ?? "admin@bez.demo",
  password: process.env.ADMIN_PASSWORD ?? "demo1234",
};
const secret = () => process.env.ADMIN_SESSION_SECRET ?? "bez-demo-session-secret-change-me";

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkCredentials(email: string, password: string) {
  // Compare both fields fully to avoid leaking which one was wrong.
  const e = safeEqual(email.trim().toLowerCase(), demoCredentials.email.toLowerCase());
  const p = safeEqual(password, demoCredentials.password);
  return e && p;
}

export function createSessionToken(email: string) {
  const payload = b64(JSON.stringify({ email, exp: Date.now() + SESSION_HOURS * 3600_000 }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; exp: number };
    return data.exp > Date.now() ? { email: data.email } : null;
  } catch { return null; }
}

export async function getAdminSession() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};
