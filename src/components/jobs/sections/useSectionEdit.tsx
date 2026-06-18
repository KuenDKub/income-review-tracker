"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ZodType } from "zod";
import type { z } from "zod";
import type { reviewJobSchema } from "@/lib/schemas/reviewJob";

type JobFormValues = z.infer<typeof reviewJobSchema>;

type ConfirmFn = (opts: {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) => Promise<boolean>;

type UseSectionEditOptions = {
  schema: ZodType;
  /** Full job values; the form snapshots these each time editing opens. */
  defaultValues: JobFormValues;
  confirm: ConfirmFn;
  /** Persist the section. Throw to keep the editor open. */
  onSave: (values: JobFormValues) => Promise<void>;
};

/**
 * Drives one inline section editor: a scoped react-hook-form plus the
 * view/edit toggle and an unsaved-changes guard on cancel. The form is typed
 * against the full job shape so the shared field groups in `JobFields` work
 * unchanged; the section's `schema` validates only its own fields.
 */
export function useSectionEdit({
  schema,
  defaultValues,
  confirm,
  onSave,
}: UseSectionEditOptions) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(schema as never) as never,
    defaultValues,
  });

  const open = useCallback(() => {
    form.reset(defaultValues);
    setEditing(true);
  }, [form, defaultValues]);

  const cancel = useCallback(async () => {
    if (form.formState.isDirty) {
      const ok = await confirm({
        title: t("discardChanges"),
        description: t("discardChangesDesc"),
        confirmLabel: tCommon("discard"),
        cancelLabel: t("keepEditing"),
        destructive: true,
      });
      if (!ok) return;
    }
    setEditing(false);
  }, [form, confirm, t, tCommon]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      setEditing(false);
    } catch {
      // onSave surfaces its own error feedback; keep the editor open so the
      // user can retry without losing their changes.
    }
  });

  return {
    editing,
    open,
    cancel,
    submit,
    form,
    saving: form.formState.isSubmitting,
  };
}
