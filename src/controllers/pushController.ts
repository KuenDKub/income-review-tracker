/**
 * Web Push subscription persistence.
 *
 * One row per browser/device (`endpoint` is the unique upsert key). The browser
 * hands us a `PushSubscription` whose `keys` carry the client encryption keys
 * required by the Web Push protocol.
 *
 * Prisma typed API only — no raw SQL (per project convention).
 */

import { prisma } from "@/lib/db/prisma";

export type SubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

/** Insert or refresh a subscription (idempotent on `endpoint`). */
export async function saveSubscription(input: SubscriptionInput): Promise<void> {
  await prisma.push_subscriptions.upsert({
    where: { endpoint: input.endpoint },
    create: {
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
    },
    update: {
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
      updated_at: new Date(),
    },
  });
}

/** Remove a subscription when the user opts out / unsubscribes. */
export async function deleteSubscription(endpoint: string): Promise<void> {
  await prisma.push_subscriptions.deleteMany({ where: { endpoint } });
}
