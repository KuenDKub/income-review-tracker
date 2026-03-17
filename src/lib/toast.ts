/**
 * Reuse helper for toast notifications. Wraps Sonner so call sites use one API.
 * Swap implementation here if needed later.
 */
import { toast as sonnerToast } from "sonner";

const baseToastClasses =
  "border text-sm shadow-md rounded-md px-4 py-3 flex items-start gap-3";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      className: `${baseToastClasses} bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-50 dark:border-emerald-800`,
    });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      className: `${baseToastClasses} bg-red-50 text-red-900 border-red-200 dark:bg-red-900/40 dark:text-red-50 dark:border-red-800`,
    });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      className: `${baseToastClasses} bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-900/40 dark:text-sky-50 dark:border-sky-800`,
    });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      className: `${baseToastClasses} bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-50 dark:border-amber-800`,
    });
  },
};
