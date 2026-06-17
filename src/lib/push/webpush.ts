import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

/**
 * Server-side Web Push helper (provider-free, VAPID).
 *
 * Configures the `web-push` client lazily from env so a missing/typo'd key
 * surfaces at send time with a clear message rather than crashing module load.
 * Apple's push service rejects any VAPID subject that isn't a `mailto:` address
 * or a full `https://` URL with a 403 — so we validate that shape up front.
 */

export type PushPayload = {
  title: string;
  body: string;
  /** Path to open when the notification is tapped (e.g. "/th/jobs/<id>"). */
  url?: string;
  /** Collapse key: a new push with the same tag replaces the previous one. */
  tag?: string;
};

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;
  if (!/^mailto:/.test(subject) && !/^https:\/\//.test(subject)) {
    console.error(
      "VAPID_SUBJECT must be a mailto: address or https:// URL (Apple returns 403 otherwise)"
    );
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/** Whether push is fully configured on the server (keys present + valid). */
export function isPushConfigured(): boolean {
  return ensureConfigured();
}

/**
 * Send a notification to every stored subscription. Returns how many were
 * delivered. Subscriptions the push service reports as gone (404/410) are
 * pruned so the table self-heals.
 */
export async function sendPushToAll(payload: PushPayload): Promise<{
  sent: number;
  removed: number;
  total: number;
}> {
  if (!ensureConfigured()) {
    throw new Error("Web Push is not configured (missing VAPID env vars)");
  }

  const subscriptions = await prisma.push_subscriptions.findMany();
  const body = JSON.stringify(payload);

  let sent = 0;
  const deadEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
        } else {
          console.error("web-push send failed:", statusCode, err);
        }
      }
    })
  );

  if (deadEndpoints.length > 0) {
    await prisma.push_subscriptions.deleteMany({
      where: { endpoint: { in: deadEndpoints } },
    });
  }

  return { sent, removed: deadEndpoints.length, total: subscriptions.length };
}
