import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Solo servidor. Sesión admin = cookie HttpOnly firmada con HMAC-SHA256.
export const ADMIN_COOKIE = "sg_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const DEMO_PASSWORD = "soguau2026";

/** Quita espacios y comillas envolventes accidentales (típico al pegar en Vercel). */
export function cleanSecret(v: string | undefined | null) {
  return (v ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function isDemoPassword() {
  return !cleanSecret(process.env.ADMIN_PASSWORD);
}

function expectedPassword() {
  return cleanSecret(process.env.ADMIN_PASSWORD) || DEMO_PASSWORD;
}

// Clave de firma determinística: igual en todas las instancias serverless.
function secret() {
  return cleanSecret(process.env.ADMIN_SESSION_SECRET) || cleanSecret(process.env.ADMIN_PASSWORD) || "soguau-fallback-signing-key";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string) {
  // SHA-256 de ambas claves: siempre 32 bytes, timingSafeEqual nunca lanza por longitud.
  const h = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(h(cleanSecret(input)), h(expectedPassword()));
}

/** Token = base64url("admin.<expMs>") + "." + base64url(HMAC). Expiración en milisegundos. */
export function createSessionToken() {
  const exp = Date.now() + SESSION_SECONDS * 1000;
  const payload = Buffer.from(`admin.${exp}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export type AuthReason = "sin_cookie" | "firma_invalida" | "token_expirado";

export function inspectSessionToken(token: string | undefined | null): { ok: true } | { ok: false; reason: AuthReason } {
  if (!token) return { ok: false, reason: "sin_cookie" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "firma_invalida" };
  const [payload, sig] = parts;
  if (!safeEqual(sig, sign(payload))) return { ok: false, reason: "firma_invalida" };
  const [role, exp] = Buffer.from(payload, "base64url").toString("utf8").split(".");
  if (role !== "admin" || !Number(exp)) return { ok: false, reason: "firma_invalida" };
  if (Number(exp) < Date.now()) return { ok: false, reason: "token_expirado" };
  return { ok: true };
}

export function verifySessionToken(token: string | undefined | null) {
  return inspectSessionToken(token).ok;
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

export function inspectAdminRequest(req: Request) {
  return inspectSessionToken(readCookie(req, ADMIN_COOKIE));
}

export function isAdminRequest(req: Request) {
  return inspectAdminRequest(req).ok;
}

/** Uso: `const denied = requireAdmin(req); if (denied) return denied;` */
export function requireAdmin(req: Request): NextResponse | null {
  const r = inspectAdminRequest(req);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "No autorizado", reason: r.reason },
    { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
