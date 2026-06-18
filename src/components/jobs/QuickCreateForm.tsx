"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  PayerField,
  StatusField,
  TitleField,
  PlatformsField,
  ContentTypeField,
  DateField,
} from "./JobFields";
import {
  reviewJobQuickCreateSchema,
  type ReviewJobQuickCreateInput,
} from "@/lib/schemas/reviewJob";

/** Today's date as an ISO `yyyy-mm-dd` string for the received-date default. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type QuickCreateFormProps = {
  payerNames?: string[];
  onSubmit: (data: ReviewJobQuickCreateInput) => void | Promise<void>;
  submitLabel: string;
};

/**
 * Lightweight "log a new job" form. Captures only the essentials; the brief,
 * income and remaining dates are filled in inline on the job detail page right
 * after creation.
 */
export function QuickCreateForm({
  payerNames = [],
  onSubmit,
  submitLabel,
}: QuickCreateFormProps) {
  const t = useTranslations("jobs");
  const form = useForm<ReviewJobQuickCreateInput>({
    resolver: zodResolver(reviewJobQuickCreateSchema) as never,
    defaultValues: {
      title: "",
      payerName: "",
      platforms: [],
      contentType: "",
      status: "received",
      receivedDate: todayIso(),
    },
  });
  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("quickCreateHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TitleField />
          <PayerField payerNames={payerNames} />
          <PlatformsField />
          <ContentTypeField />
          <StatusField />
          <DateField
            name="receivedDate"
            label={t("receivedDate")}
            clearable={false}
          />
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
