/**
 * Reuse helper for toast notifications. Wraps Sonner so call sites use one API.
 * Swap implementation here if needed later.
 */
import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description });
  },
};
