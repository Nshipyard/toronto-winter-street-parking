import { NextResponse } from "next/server";
import { getAllStreets, getData } from "@/lib/winter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const limit = Math.min(300, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
  const all = getAllStreets();
  const rows = q ? all.filter((x) => x.street.toLowerCase().includes(q)) : all;
  return NextResponse.json({ count: rows.length, streets: rows.slice(0, limit) });
}
