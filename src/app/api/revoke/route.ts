import { NextResponse } from "next/server";
import { T3NService } from "@/lib/t3n-client";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    const service = T3NService.getInstance();
    const buyerDid = service.getBuyerDid();

    if (action === "revoke") {
      await service.revokeAccess(buyerDid);
      return NextResponse.json({ success: true, isAuthorized: false });
    } else if (action === "grant") {
      await service.grantAccess(buyerDid);
      return NextResponse.json({ success: true, isAuthorized: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 500 },
    );
  }
}
