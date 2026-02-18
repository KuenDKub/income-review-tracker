export const STATUS_BADGE_CLASS: Record<string, string> = {
  received:
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 border-zinc-300 dark:border-zinc-600",
  script_sent:
    "bg-orange-200 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200 border-orange-400 dark:border-orange-700",
  in_progress:
    "bg-sky-200 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200 border-sky-400 dark:border-sky-600",
  waiting_edit:
    "bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200 border-rose-400 dark:border-rose-600",
  waiting_review:
    "bg-violet-200 text-violet-900 dark:bg-violet-900/50 dark:text-violet-200 border-violet-400 dark:border-violet-600",
  approved_pending:
    "bg-teal-200 text-teal-900 dark:bg-teal-900/50 dark:text-teal-200 border-teal-400 dark:border-teal-600",
  paid: "bg-green-300 text-green-900 dark:bg-green-800/60 dark:text-green-100 border-green-500 dark:border-green-600",
};

export const DEFAULT_STATUS_BADGE_CLASS =
  "bg-muted text-muted-foreground border-border";
