import { NextResponse } from "next/server";
import { T3NService } from "@/lib/t3n-client";

export async function GET() {
  const service = T3NService.getInstance();
  const profile = await service.getVendorProfile();
  const buyerDid = service.getBuyerDid();
  const isAuthorized = profile ? service.isAuthorized(buyerDid) : false;

  return NextResponse.json({
    profile,
    buyerDid,
    isAuthorized,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      taxId,
      ownerName,
      passportNumber,
      bankName,
      bankAccount,
    } = body;

    if (
      !companyName ||
      !taxId ||
      !ownerName ||
      !passportNumber ||
      !bankName ||
      !bankAccount
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const service = T3NService.getInstance();
    const profile = await service.registerVendor({
      companyName,
      taxId,
      ownerName,
      passportNumber,
      bankName,
      bankAccount,
    });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 },
    );
  }
}
