import { NextResponse } from "next/server";
import { sendPushToAll, isPushConfigured } from "@/lib/push/webpush";

export const dynamic = "force-dynamic";

/** Fire a test notification to all subscribed devices (used by the UI toggle). */
export async function POST() {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: "Push is not configured on the server" },
        { status: 503 }
      );
    }
    const result = await sendPushToAll({
      title: "ทดสอบการแจ้งเตือน ✅",
      body: "ระบบแจ้งเตือนทำงานแล้ว คุณจะได้รับเตือนเดดไลน์งานและการจ่ายเงิน",
      url: "/",
      tag: "test",
    });
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("POST /api/push/test:", err);
    return NextResponse.json({ error: "Failed to send test push" }, { status: 500 });
  }
}
