import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToAll, isPushConfigured, type PushPayload } from "@/lib/push/webpush";

export const dynamic = "force-dynamic";

// Jobs in these statuses are finished — don't nag about their deadlines.
const DONE_STATUSES = new Set(["paid", "done", "cancelled", "published"]);

/** "YYYY-MM-DD" for a date offset from now, in Asia/Bangkok (Thailand-focused app). */
function bangkokDateKey(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Build a UTC Date at midnight for a "YYYY-MM-DD" key (matches @db.Date storage). */
function dateOnly(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * Daily reminder fan-out. Triggered by Vercel Cron (see vercel.json), which
 * sends `Authorization: Bearer <CRON_SECRET>`. Computes today's actionable
 * items and pushes them to every subscribed device.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  const todayKey = bangkokDateKey(0);
  const tomorrowKey = bangkokDateKey(1);
  const today = dateOnly(todayKey);
  const tomorrow = dateOnly(tomorrowKey);

  const notifications: PushPayload[] = [];

  // 1) Review deadlines due today or tomorrow (skip finished jobs).
  const deadlineJobs = await prisma.review_jobs.findMany({
    where: { review_deadline: { in: [today, tomorrow] } },
    select: { id: true, title: true, status: true, review_deadline: true },
  });
  for (const job of deadlineJobs) {
    if (DONE_STATUSES.has(job.status)) continue;
    const due = job.review_deadline?.getTime() === tomorrow.getTime() ? "พรุ่งนี้" : "วันนี้";
    notifications.push({
      title: `⏰ เดดไลน์รีวิว${due}`,
      body: job.title,
      url: `/jobs/${job.id}`,
      tag: `deadline-${job.id}`,
    });
  }

  // 2) Posts scheduled to publish today.
  const publishJobs = await prisma.review_jobs.findMany({
    where: { publish_date: today },
    select: { id: true, title: true, status: true },
  });
  for (const job of publishJobs) {
    if (DONE_STATUSES.has(job.status)) continue;
    notifications.push({
      title: "📅 วันนี้ถึงกำหนดโพสต์",
      body: job.title,
      url: `/jobs/${job.id}`,
      tag: `publish-${job.id}`,
    });
  }

  // 3) Unpaid invoices due today or overdue.
  const dueInvoices = await prisma.invoices.findMany({
    where: { status: "unpaid", due_date: { lte: today } },
    select: { id: true, invoice_number: true, payer_name: true, due_date: true },
  });
  for (const inv of dueInvoices) {
    const overdue = inv.due_date && inv.due_date.getTime() < today.getTime();
    notifications.push({
      title: overdue ? "💸 Invoice เลยกำหนดชำระ" : "💸 Invoice ครบกำหนดวันนี้",
      body: `${inv.invoice_number}${inv.payer_name ? ` · ${inv.payer_name}` : ""}`,
      url: "/payments",
      tag: `invoice-${inv.id}`,
    });
  }

  let sent = 0;
  for (const payload of notifications) {
    const result = await sendPushToAll(payload);
    sent += result.sent;
  }

  return NextResponse.json({
    data: { date: todayKey, items: notifications.length, pushesSent: sent },
  });
}
