import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, cleanSecret, createSessionToken, isAdminRequest, isDemoPassword, sessionCookieOptions } from "@/lib/admin-auth";
import { hasServiceRole } from "@/lib/supabase/admin";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(req: Request) {
  return NextResponse.json(
    {
      authenticated: isAdminRequest(req),
      demoPassword: isDemoPassword(),
      envPasswordConfigured: !isDemoPassword(),
      envPasswordLength: cleanSecret(process.env.ADMIN_PASSWORD).length,
      supabaseConnected: hasServiceRole(),
    },
    { headers: NO_STORE },
  );
}

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? cleanSecret(body.password.slice(0, 200)) : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400, headers: NO_STORE });
  }
  if (!password || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(
      { error: "Contraseña incorrecta", reason: isDemoPassword() && !checkPassword(password) ? "modo_demo_sin_env" : "clave_incorrecta" },
      { status: 401, headers: NO_STORE },
    );
  }
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
