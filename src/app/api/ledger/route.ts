import { NextResponse } from "next/server";
import { T3NService } from "@/lib/t3n-client";

export async function GET() {
  const service = T3NService.getInstance();
  const ledger = await service.getLedger();
  const credentials = await service.getCredentials();

  return NextResponse.json({
    ledger,
    credentials,
  });
}
