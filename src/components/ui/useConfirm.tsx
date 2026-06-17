"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive (red) confirm button. Defaults to true. */
  destructive?: boolean;
};

/**
 * Promise-based confirmation dialog. Call `confirm()` from any handler and
 * await the boolean result; render `confirmDialog` once in the component tree.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ description: t("confirmDeleteX") }))) return;
 *
 * Defaults are tuned for delete actions (red confirm button, "Delete" label),
 * so a bare `confirm()` already reads as a delete confirmation.
 */
export function useConfirm() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions = {}) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      // Resolve any dialog left dangling before opening a new one.
      resolverRef.current?.(false);
      resolverRef.current = resolve;
    });
  }, []);

  const destructive = options.destructive ?? true;

  const confirmDialog: ReactNode = (
    <AlertDialog open={open} onOpenChange={(next) => !next && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title ?? t("delete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {options.description ?? t("confirmDelete")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            {options.cancelLabel ?? t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {options.confirmLabel ?? t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}
