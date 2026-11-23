import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Solo servidor. Sesión admin = cookie HttpOnly firmada con HMAC-SHA256.
export const ADMIN_COOKIE = "sg_admin";
const SESSION_SECONDS = 60 * 60 * 12;
const DEMO_PASSWORD = "soguau2026";

export function isDemoPassword() {
  return !process.env.ADMIN_PASSWORD;
}

function expectedPassword() {
  return process.env.ADMIN_PASSWORD || DEMO_PASSWORD;
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || `sg-session:${expectedPassword()}`;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string) {
  // Se comparan hashes para igualar longitudes y evitar timing leaks.
  const h = (v: string) => createHmac("sha256", "sg-pw").update(v).digest();
  return timingSafeEqual(h(input), h(expectedPassword()));
}

export function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const [role, exp] = payload.split(".");
  if (role !== "admin" || !Number(exp) || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(token.slice(i + 1), sign(payload));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

function readCookie(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function isAdminRequest(req: Request) {
  return verifySessionToken(readCookie(req, ADMIN_COOKIE));
}

/** Uso: `const denied = requireAdmin(req); if (denied) return denied;` */
export function requireAdmin(req: Request): NextResponse | null {
  if (isAdminRequest(req)) return null;
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
