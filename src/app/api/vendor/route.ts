import { NextResponse } from "next/server";
import { T3NService } from "@/lib/t3n-client";

export async function GET() {
  const service = T3NService.getInstance();
  const profile = await service.getVendorProfile();
  const buyerDid = service.getBuyerDid();
  const isAuthorized = profile ? service.isAuthorized(buyerDid) : false;
  const ownerToken = service.getOwnerToken();

  return NextResponse.json({
    profile,
    buyerDid,
    isAuthorized,
    ownerToken, // dikirim ke client untuk verifikasi kepemilikan
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
      ownerToken, // token kepemilikan session dari client
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
    const profile = await service.registerVendor(
      {
        companyName,
        taxId,
        ownerName,
        passportNumber,
        bankName,
        bankAccount,
      },
      ownerToken,
    );

    return NextResponse.json({ ...profile, ownerToken: service.getOwnerToken() });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 },
    );
  }
}

// Reset semua state — dipakai oleh tombol Unregister
export async function DELETE() {
  const service = T3NService.getInstance();
  await service.resetAll();
  return NextResponse.json({ success: true });
}
