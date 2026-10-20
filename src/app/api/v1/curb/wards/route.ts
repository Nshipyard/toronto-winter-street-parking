import { NextResponse } from "next/server";
import { getData } from "@/lib/winter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ward = searchParams.get("ward");
  const wards = getData().wards;
  if (ward) {
    const w = wards.find((x) => x.ward === ward.padStart(2, "0") || x.ward === ward);
    if (!w) return NextResponse.json({ error: `Unknown ward ${ward}` }, { status: 404 });
    return NextResponse.json(w);
  }
  return NextResponse.json({ count: wards.length, wards });
}
