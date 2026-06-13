import {
  STATUS_BADGE_CLASS,
  DEFAULT_STATUS_BADGE_CLASS,
} from "@/components/jobs/statusBadge";

/** i18n label keys (namespace "jobs") per review job status. */
export const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_waiting_to_publish: "statusApprovedWaitingToPublish",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

export type StatusTheme = {
  /** Soft column surface (lighter than badge). */
  column: string;
  /** Solid dot used in chips / pickers so status reads without color names. */
  dot: string;
  /** Stronger badge classes (shared with list/table views). */
  badge: string;
};

export const STATUS_THEME: Record<string, StatusTheme> = {
  received: {
    column:
      "bg-zinc-50 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    badge: STATUS_BADGE_CLASS.received,
  },
  script_sent: {
    column:
      "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    dot: "bg-orange-400 dark:bg-orange-500",
    badge: STATUS_BADGE_CLASS.script_sent,
  },
  in_progress: {
    column:
      "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200 border-sky-200 dark:border-sky-700",
    dot: "bg-sky-400 dark:bg-sky-500",
    badge: STATUS_BADGE_CLASS.in_progress,
  },
  waiting_edit: {
    column:
      "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border-rose-200 dark:border-rose-700",
    dot: "bg-rose-400 dark:bg-rose-500",
    badge: STATUS_BADGE_CLASS.waiting_edit,
  },
  waiting_review: {
    column:
      "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200 border-violet-200 dark:border-violet-700",
    dot: "bg-violet-400 dark:bg-violet-500",
    badge: STATUS_BADGE_CLASS.waiting_review,
  },
  approved_waiting_to_publish: {
    column:
      "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200 border-teal-200 dark:border-teal-700",
    dot: "bg-teal-400 dark:bg-teal-500",
    badge: STATUS_BADGE_CLASS.approved_waiting_to_publish,
  },
  approved_pending: {
    column:
      "bg-teal-100 text-teal-900 dark:bg-teal-900/45 dark:text-teal-100 border-teal-300 dark:border-teal-700",
    dot: "bg-teal-600 dark:bg-teal-400",
    badge: STATUS_BADGE_CLASS.approved_pending,
  },
  paid: {
    column:
      "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200 border-green-200 dark:border-green-700",
    dot: "bg-green-500 dark:bg-green-400",
    badge: STATUS_BADGE_CLASS.paid,
  },
};

const FALLBACK_THEME: StatusTheme = {
  column: DEFAULT_STATUS_BADGE_CLASS,
  dot: "bg-muted-foreground",
  badge: DEFAULT_STATUS_BADGE_CLASS,
};

export function statusTheme(status: string): StatusTheme {
  return STATUS_THEME[status] ?? FALLBACK_THEME;
}
