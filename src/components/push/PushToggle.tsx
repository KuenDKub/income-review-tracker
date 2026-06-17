"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  getPushSupport,
  getExistingSubscription,
  getCurrentPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";

type State =
  | "loading"
  | "unsupported"
  | "ios-needs-install"
  | "denied"
  | "off"
  | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function PushToggle() {
  const t = useTranslations("notifications");
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const support = getPushSupport();
      if (!support.supported) {
        if (!cancelled) setState(support.reason === "ios-needs-install" ? "ios-needs-install" : "unsupported");
        return;
      }
      const permission = await getCurrentPermission();
      if (permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      const sub = await getExistingSubscription();
      if (!cancelled) setState(sub ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    if (!VAPID_PUBLIC_KEY) {
      toast.error(t("notConfigured"));
      return;
    }
    setBusy(true);
    try {
      const ok = await subscribeToPush(VAPID_PUBLIC_KEY);
      if (ok) {
        setState("on");
        toast.success(t("enabled"));
      } else {
        setState((await getCurrentPermission()) === "denied" ? "denied" : "off");
        toast.error(t("permissionDenied"));
      }
    } catch (err) {
      console.error("enable push:", err);
      toast.error(t("enableFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setState("off");
      toast.success(t("disabled"));
    } catch (err) {
      console.error("disable push:", err);
      toast.error(t("disableFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      if (res.ok) {
        toast.success(t("testSent"));
      } else {
        toast.error(t("testFailed"));
      }
    } catch {
      toast.error(t("testFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("checking")}
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        <BellOff className="mr-1.5 inline size-4 align-text-bottom" />
        {t("unsupported")}
      </p>
    );
  }

  if (state === "ios-needs-install") {
    return (
      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">
          <Bell className="mr-1.5 inline size-4 align-text-bottom" />
          {t("iosTitle")}
        </p>
        {t("iosInstall")}
      </div>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        <BellOff className="mr-1.5 inline size-4 align-text-bottom" />
        {t("denied")}
      </p>
    );
  }

  if (state === "off") {
    return (
      <Button onClick={handleEnable} disabled={busy} className="w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        {t("enable")}
      </Button>
    );
  }

  // state === "on"
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <BellRing className="size-4" />
        {t("on")}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={busy} className="flex-1">
          <Send className="size-4" />
          {t("test")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDisable} disabled={busy} className="flex-1">
          <BellOff className="size-4" />
          {t("turnOff")}
        </Button>
      </div>
    </div>
  );
}
