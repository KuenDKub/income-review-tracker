"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";
import {
  REVIEW_JOB_STATUSES,
  type ReviewJobStatus,
} from "@/lib/schemas/reviewJob";
import { PaidConfirmSheet } from "@/components/board/PaidConfirmSheet";

/** Minimal shape needed to move a job between statuses. */
export type MovableJob = {
  id: string;
  status: string;
  paymentDate?: string | null;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
};

type StatusPatch = { status: string; paymentDate?: string };

type UseJobStatusMoveOptions = {
  /** Optimistically apply a status change to local state. */
  onApply?: (jobId: string, patch: StatusPatch) => void;
  /** Revert an optimistic change after a failed save. */
  onRevert?: (
    jobId: string,
    prev: { status: string; paymentDate: string | null },
  ) => void;
  /** Called after a confirmed successful save (e.g. to reload). */
  onSaved?: (jobId: string, patch: StatusPatch) => void;
};

/**
 * Shared status-move logic for the board, the list, and the job detail page.
 * Moving to "paid" opens the {@link PaidConfirmSheet} (payment date + evidence)
 * so the paid flow is identical everywhere; all other moves PATCH `{status}`
 * only and never touch the rest of the row.
 *
 *   const { moveJob, paidSheet } = useJobStatusMove({ onSaved: load });
 *   ...
 *   {paidSheet}
 */
export function useJobStatusMove({
  onApply,
  onRevert,
  onSaved,
}: UseJobStatusMoveOptions = {}) {
  const t = useTranslations("jobs");
  const [busy, setBusy] = useState(false);

  // Paid confirmation flow
  const [paidOpen, setPaidOpen] = useState(false);
  const [paidSaving, setPaidSaving] = useState(false);
  const [pendingJob, setPendingJob] = useState<MovableJob | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const prevStatusRef = useRef<string | null>(null);
  const prevPaymentRef = useRef<string | null>(null);

  const minPaymentDate = useMemo(() => {
    const j = pendingJob;
    if (!j) return undefined;
    return (
      (j.publishDate ?? j.reviewDeadline ?? j.receivedDate ?? "")
        .toString()
        .trim() || undefined
    );
  }, [pendingJob]);

  const resetPaid = useCallback(() => {
    setPaidSaving(false);
    setPendingJob(null);
    setPaymentDate("");
    setFiles([]);
    prevStatusRef.current = null;
    prevPaymentRef.current = null;
  }, []);

  const startPaidFlow = useCallback((job: MovableJob) => {
    prevStatusRef.current = job.status;
    prevPaymentRef.current = job.paymentDate ?? null;
    setPendingJob(job);
    const min = (job.publishDate ?? job.reviewDeadline ?? job.receivedDate ?? "")
      .toString()
      .trim();
    const todayIso = new Date().toISOString().slice(0, 10);
    setPaymentDate(
      job.paymentDate?.trim() || (min && todayIso < min ? min : todayIso) || todayIso,
    );
    setFiles([]);
    setPaidOpen(true);
  }, []);

  const moveJob = useCallback(
    async (job: MovableJob, newStatus: string) => {
      if (!REVIEW_JOB_STATUSES.includes(newStatus as ReviewJobStatus)) return;
      if (job.status === newStatus) return;

      if (newStatus === "paid") {
        startPaidFlow(job);
        return;
      }

      setBusy(true);
      onApply?.(job.id, { status: newStatus });
      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("updateError"));
        toast.success(t("updateSuccess"));
        onSaved?.(job.id, { status: newStatus });
      } catch (e) {
        toast.error(t("updateError"), String(e));
        onRevert?.(job.id, {
          status: job.status,
          paymentDate: job.paymentDate ?? null,
        });
      } finally {
        setBusy(false);
      }
    },
    [onApply, onRevert, onSaved, startPaidFlow, t],
  );

  const handlePaidCancel = useCallback(() => {
    if (paidSaving) return;
    setPaidOpen(false);
    resetPaid();
  }, [paidSaving, resetPaid]);

  const handlePaidSave = useCallback(async () => {
    const job = pendingJob;
    if (!job) return;
    const pd = paymentDate.trim();
    if (!pd) {
      toast.error(t("updateError"), t("paidDialogPaymentDateRequired"));
      return;
    }
    setPaidSaving(true);
    const prevStatus = prevStatusRef.current ?? job.status ?? "received";
    const prevPayment = prevPaymentRef.current ?? job.paymentDate ?? null;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paymentDate: pd }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("updateError"));

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error(t("uploadError"));
        const uploadJson = await uploadRes.json();
        const docRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewJobId: job.id,
            kind: "evidence",
            filePath: uploadJson.filePath,
          }),
        });
        if (!docRes.ok) throw new Error(t("uploadError"));
      }

      onApply?.(job.id, { status: "paid", paymentDate: pd });
      onSaved?.(job.id, { status: "paid", paymentDate: pd });
      toast.success(t("updateSuccess"));
      setPaidOpen(false);
      resetPaid();
    } catch (e) {
      toast.error(t("updateError"), String(e));
      try {
        await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: prevStatus,
            paymentDate: prevPayment,
          }),
        });
      } catch {
        // best-effort revert
      }
      onRevert?.(job.id, { status: prevStatus, paymentDate: prevPayment });
      setPaidOpen(false);
      resetPaid();
    } finally {
      setPaidSaving(false);
    }
  }, [files, paymentDate, pendingJob, resetPaid, onApply, onSaved, onRevert, t]);

  const paidSheet = (
    <PaidConfirmSheet
      open={paidOpen}
      saving={paidSaving}
      paymentDate={paymentDate}
      minPaymentDate={minPaymentDate}
      files={files}
      onPaymentDateChange={setPaymentDate}
      onFilesChange={setFiles}
      onCancel={handlePaidCancel}
      onSave={handlePaidSave}
    />
  );

  return { moveJob, paidSheet, busy };
}
