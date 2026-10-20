import { NextResponse } from "next/server";
import { getAllStreets, getData } from "@/lib/winter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  if (!q) return NextResponse.json({ streets: [], wards: [] });
  const d = getData();
  return NextResponse.json({
    streets: getAllStreets().filter((x) => x.street.toLowerCase().includes(q)).slice(0, 10),
    wards: d.wards.filter((x) => x.name.toLowerCase().includes(q) || x.ward === q.padStart(2, "0")).slice(0, 5),
  });
}
