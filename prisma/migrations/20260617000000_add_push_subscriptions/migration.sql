-- Web Push (PWA) subscriptions: one row per browser/device that opted in to
-- notifications. `endpoint` is the push-service URL (unique upsert key);
-- `p256dh`/`auth` are the client encryption keys required by the Web Push
-- protocol. Additive + idempotent for the prod DB.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);
