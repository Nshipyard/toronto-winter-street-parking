import { NextResponse } from "next/server";
import { getData } from "@/lib/winter";

export async function GET() {
  return NextResponse.json(getData().concentration);
}
