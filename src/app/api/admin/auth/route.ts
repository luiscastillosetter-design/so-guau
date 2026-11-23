import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, createSessionToken, isAdminRequest, isDemoPassword, sessionCookieOptions } from "@/lib/admin-auth";

export async function GET(req: Request) {
  return NextResponse.json({ authenticated: isAdminRequest(req), demoPassword: isDemoPassword() });
}

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  if (!password || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
