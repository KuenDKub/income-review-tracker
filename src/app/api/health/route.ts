import { NextResponse } from "next/server";
import { checkHealth } from "@/controllers/healthController";

export async function GET() {
  const result = await checkHealth();
  const status = result.status === "ok" ? 200 : 500;
  return NextResponse.json(result, { status });
}
