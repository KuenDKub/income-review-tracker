/**
 * Reuse helper for toast notifications. Wraps Sonner so call sites use one API.
 * Swap implementation here if needed later.
 */
import { toast as sonnerToast } from "sonner";

/**
 * Color comes from the Toaster's `richColors` (see sonner.tsx), which tints the
 * background, border, and icon per type so the status reads at a glance — green
 * for success, red for error, amber for warning, blue for info. Keep call sites
 * on the right method so the color matches the meaning.
 */
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description }),
};
