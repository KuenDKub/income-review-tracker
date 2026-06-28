"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
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
  const [showMoreDates, setShowMoreDates] = useState(false);
  const form = useForm<ReviewJobQuickCreateInput>({
    resolver: zodResolver(reviewJobQuickCreateSchema) as never,
    defaultValues: {
      title: "",
      payerName: "",
      platforms: [],
      contentType: "",
      status: "received",
      receivedDate: todayIso(),
      reviewDeadline: "",
      publishDate: "",
    },
  });
  const { isSubmitting } = form.formState;

  // Chained min-date rules mirror CoreDateFields on the detail page.
  const receivedDate = form.watch("receivedDate");
  const reviewDeadline = form.watch("reviewDeadline");
  const minReviewDeadline =
    receivedDate && String(receivedDate).trim()
      ? String(receivedDate).trim()
      : undefined;
  const minPublishDate =
    (reviewDeadline && String(reviewDeadline).trim()) ||
    (receivedDate && String(receivedDate).trim()) ||
    undefined;

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

        <div className="rounded-xl border">
          <button
            type="button"
            aria-expanded={showMoreDates}
            onClick={() => setShowMoreDates((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium touch-manipulation"
          >
            {t("addMoreDates")}
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                showMoreDates && "rotate-180",
              )}
            />
          </button>
          {showMoreDates && (
            <div className="grid gap-4 border-t px-4 pb-4 pt-4 sm:grid-cols-2">
              <DateField
                name="reviewDeadline"
                label={t("reviewDeadline")}
                min={minReviewDeadline}
              />
              <DateField
                name="publishDate"
                label={t("publishDate")}
                min={minPublishDate}
              />
            </div>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
