import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToAll, isPushConfigured, type PushPayload } from "@/lib/push/webpush";
import { pickStable } from "@/lib/pickStable";

export const dynamic = "force-dynamic";

// Jobs in these statuses are finished — don't nag about their deadlines.
const DONE_STATUSES = new Set(["paid", "done", "cancelled", "published"]);

// Varied Thai title copy so a day with several reminders of the same kind doesn't
// produce a stack of identical-looking notifications. The phrasing is chosen
// deterministically from the item's id (see pickStable), so a given job/invoice
// keeps the same wording across cron re-runs while different items differ.
const DEADLINE_TODAY_TITLES = [
  "⏰ เดดไลน์รีวิววันนี้",
  "🔥 วันนี้ครบกำหนดรีวิว",
  "📌 รีวิวนี้ต้องส่งวันนี้",
  "⚡ อย่าลืม! รีวิววันนี้",
] as const;
const DEADLINE_TOMORROW_TITLES = [
  "⏳ พรุ่งนี้ถึงเดดไลน์รีวิว",
  "📅 อีกวันครบกำหนดรีวิว",
  "🔔 เตรียมตัว! รีวิวพรุ่งนี้",
] as const;
const PUBLISH_TITLES = [
  "📅 วันนี้ถึงกำหนดโพสต์",
  "📣 ได้เวลาโพสต์รีวิวแล้ว",
  "🚀 วันนี้ปล่อยโพสต์",
] as const;
const INVOICE_OVERDUE_TITLES = [
  "💸 Invoice เลยกำหนดชำระ",
  "⚠️ Invoice ค้างชำระ",
  "🧾 ตามจ่าย Invoice",
] as const;
const INVOICE_DUE_TITLES = [
  "💸 Invoice ครบกำหนดวันนี้",
  "🧾 วันนี้ครบกำหนด Invoice",
] as const;

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
    const isTomorrow = job.review_deadline?.getTime() === tomorrow.getTime();
    const titles = isTomorrow ? DEADLINE_TOMORROW_TITLES : DEADLINE_TODAY_TITLES;
    notifications.push({
      title: pickStable(titles, job.id),
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
      title: pickStable(PUBLISH_TITLES, job.id),
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
      title: pickStable(overdue ? INVOICE_OVERDUE_TITLES : INVOICE_DUE_TITLES, inv.id),
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

  // Heartbeat: record this successful run so /api/health can detect a cron that
  // has gone silent (e.g. Vercel Cron stopped, or CRON_SECRET drift).
  const detail = `items=${notifications.length} sent=${sent}`;
  await prisma.cron_runs.upsert({
    where: { job_name: "reminders" },
    update: { last_run_at: new Date(), last_status: "ok", detail },
    create: { job_name: "reminders", last_status: "ok", detail },
  });

  return NextResponse.json({
    data: { date: todayKey, items: notifications.length, pushesSent: sent },
  });
}
