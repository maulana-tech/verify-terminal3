import type { NextRequest } from "next/server";
import { T3NService } from "@/lib/t3n-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorDid = searchParams.get("vendorDid");
  const buyerDid = searchParams.get("buyerDid");

  if (!vendorDid || !buyerDid) {
    return new Response(
      JSON.stringify({ error: "Missing vendorDid or buyerDid" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const service = T3NService.getInstance();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await service.handshake();
        await service.executeOnboarding(vendorDid, buyerDid, (step) => {
          sendEvent({ type: "step", step });
        });

        const credentials = await service.getCredentials();
        const cred = credentials.find((c) => c.subjectDid === vendorDid);

        sendEvent({ type: "complete", credential: cred });
      } catch (err: unknown) {
        sendEvent({
          type: "error",
          message: err instanceof Error ? err.message : "Onboarding failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
