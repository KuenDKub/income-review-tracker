import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveSubscription, deleteSubscription } from "@/controllers/pushController";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    const { endpoint, keys } = parsed.data;
    await saveSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error("POST /api/push/subscribe:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    await deleteSubscription(parsed.data.endpoint);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error("DELETE /api/push/subscribe:", err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
