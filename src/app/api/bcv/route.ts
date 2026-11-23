import { NextResponse } from "next/server";
import { getBcvRate } from "@/lib/bcv";

export async function GET() {
  const data = await getBcvRate();
  if (!data) return NextResponse.json({ error: "Tasa BCV no disponible" }, { status: 503 });
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
}
