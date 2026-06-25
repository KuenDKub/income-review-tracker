"use client";

import { useTranslations } from "next-intl";
import {
  Calendar,
  ClipboardList,
  Copy,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumberTicker } from "@/components/ui/number-ticker";
import { PlatformBadges } from "@/components/jobs/PlatformBadges";
import { BriefAttachments } from "@/components/jobs/BriefAttachments";
import { DetailItem } from "@/components/jobs/DetailItem";
import {
  PayerField,
  ContentTypeField,
  PlatformsField,
  BriefFields,
  NotesField,
  IncomeFields,
  CoreDateFields,
  DateField,
} from "@/components/jobs/JobFields";
import { SectionCard, SectionEditFooter } from "./SectionCard";
import { useSectionEdit } from "./useSectionEdit";
import {
  detailsSectionSchema,
  briefSectionSchema,
  notesSectionSchema,
  incomeSectionSchema,
  datesSectionSchema,
} from "./sectionSchemas";
import { briefLinkEmbed } from "@/lib/briefEmbed";
import {
  formatDateThai,
  isNearReviewDeadline,
  isPublishDatePassed,
} from "@/lib/formatDate";
import { formatTHB } from "@/lib/currency";
import { toast } from "@/lib/toast";
import type { z } from "zod";
import type { reviewJobSchema } from "@/lib/schemas/reviewJob";

type JobFormValues = z.infer<typeof reviewJobSchema>;

export type JobDetail = {
  id: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  contentType: string;
  title: string;
  receivedDate?: string | null;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
  tags: string[];
  notes: string | null;
  brief?: string | null;
  briefLink?: string | null;
  briefLinkNote?: string | null;
  isBrotherJob?: boolean;
  showOnPortfolio?: boolean;
};

export type JobIncome = {
  grossAmount: number;
  withholdingAmount: number;
  netAmount: number;
};

export type BriefDoc = {
  id: string;
  filePath: string;
  kind: string;
  notes: string | null;
};

type ConfirmFn = (opts: {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) => Promise<boolean>;

type SectionCommon = {
  job: JobDetail;
  defaultValues: JobFormValues;
  confirm: ConfirmFn;
  /** Persist a section. Throws on failure to keep the editor open. */
  onSave: (patch: Partial<JobFormValues>) => Promise<void>;
};

/* ---------------------------------- Details --------------------------------- */

export function DetailsCard({
  job,
  defaultValues,
  confirm,
  onSave,
  payerNames,
}: SectionCommon & { payerNames: string[] }) {
  const t = useTranslations("jobs");
  const { editing, open, cancel, submit, form, saving } = useSectionEdit({
    schema: detailsSectionSchema,
    defaultValues,
    confirm,
    onSave: (values) =>
      onSave({
        payerName: values.payerName ?? "",
        contentType: values.contentType,
        platforms: values.platforms ?? [],
      }),
  });

  return (
    <SectionCard title={t("overview")} editing={editing} onEdit={open}>
      {editing ? (
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PayerField payerNames={payerNames} />
              <ContentTypeField />
              <PlatformsField />
            </div>
            <SectionEditFooter onCancel={cancel} saving={saving} />
          </form>
        </Form>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailItem label={t("payer")}>{job.payerName || "—"}</DetailItem>
          <DetailItem label={t("contentType")}>
            {job.contentType || "—"}
          </DetailItem>
          <DetailItem label={t("table.platform")}>
            {job.platforms && job.platforms.length > 0 ? (
              <PlatformBadges platforms={job.platforms} />
            ) : (
              "—"
            )}
          </DetailItem>
        </dl>
      )}
    </SectionCard>
  );
}

/* ----------------------------------- Brief ---------------------------------- */

export function BriefCard({
  job,
  defaultValues,
  confirm,
  onSave,
  briefDocs,
  onAttachmentsChanged,
}: SectionCommon & {
  briefDocs: BriefDoc[];
  onAttachmentsChanged: () => void;
}) {
  const t = useTranslations("jobs");
  const { editing, open, cancel, submit, form, saving } = useSectionEdit({
    schema: briefSectionSchema,
    defaultValues,
    confirm,
    onSave: (values) =>
      onSave({
        briefLink: values.briefLink ?? "",
        briefLinkNote: values.briefLinkNote ?? "",
        brief: values.brief ?? "",
      }),
  });

  const briefEmbedUrl = job.briefLink ? briefLinkEmbed(job.briefLink) : null;
  const hasBriefText = Boolean(job.brief && job.brief.trim());
  const hasBriefLink = Boolean(job.briefLink && job.briefLink.trim());
  const hasBriefContent = hasBriefText || hasBriefLink || briefDocs.length > 0;

  return (
    <SectionCard
      id="brief"
      title={t("brief")}
      icon={<ClipboardList className="h-4 w-4 text-primary" />}
      editing={editing}
      onEdit={open}
      className="scroll-mt-24 border-primary/25"
    >
      {editing ? (
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <BriefFields />
            <SectionEditFooter onCancel={cancel} saving={saving} />
          </form>
        </Form>
      ) : (
        <div className="space-y-4">
          {(hasBriefLink || hasBriefText) && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {hasBriefLink && (
                <Button variant="outline" size="sm" className="min-h-11" asChild>
                  <a
                    href={job.briefLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("openBrief")}
                  </a>
                </Button>
              )}
              {hasBriefText && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(job.brief ?? "");
                      toast.success(t("briefCopied"));
                    } catch {
                      toast.error(t("copyError"));
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                  {t("copyBrief")}
                </Button>
              )}
            </div>
          )}
          {briefEmbedUrl && (
            <div className="relative w-full overflow-hidden rounded-lg border bg-muted/30 pt-[62%] sm:pt-[56.25%]">
              <iframe
                src={briefEmbedUrl}
                title={t("brief")}
                loading="lazy"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}
          {hasBriefLink && !briefEmbedUrl && (
            <a
              href={job.briefLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 break-all rounded-lg border bg-muted/30 px-4 py-3 text-sm font-medium text-primary"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {job.briefLink}
            </a>
          )}
          {job.briefLinkNote && job.briefLinkNote.trim() && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {job.briefLinkNote}
            </p>
          )}
          {hasBriefText && (
            <div className="rounded-lg bg-muted/25 p-3 text-sm leading-6">
              <p className="whitespace-pre-wrap">{job.brief}</p>
            </div>
          )}
          {!hasBriefContent && (
            <p className="rounded-lg bg-muted/25 p-3 text-sm text-muted-foreground">
              {t("briefEmpty")}
            </p>
          )}
        </div>
      )}
      <div className="mt-4">
        <BriefAttachments
          jobId={job.id}
          files={briefDocs}
          onChanged={onAttachmentsChanged}
        />
      </div>
    </SectionCard>
  );
}

/* ---------------------------------- Income ---------------------------------- */

export function IncomeCard({
  job,
  defaultValues,
  confirm,
  onSave,
  income,
}: SectionCommon & { income: JobIncome | null }) {
  const t = useTranslations("jobs");
  const tDashboard = useTranslations("dashboard");
  const { editing, open, cancel, submit, form, saving } = useSectionEdit({
    schema: incomeSectionSchema,
    defaultValues,
    confirm,
    onSave: (values) =>
      onSave({
        isBrotherJob: values.isBrotherJob,
        hasWithholdingTax: values.hasWithholdingTax,
        showOnPortfolio: values.showOnPortfolio,
        amount: values.amount,
        withholdingRate: values.withholdingRate,
        // Keep the income row's date in sync and avoid the route defaulting
        // its payment date to today when income fields change.
        receivedDate: defaultValues.receivedDate || undefined,
        reviewDeadline: defaultValues.reviewDeadline || null,
        publishDate: defaultValues.publishDate || null,
        paymentDate: defaultValues.paymentDate || null,
      }),
  });

  const rate =
    income && income.withholdingAmount > 0 && income.grossAmount > 0
      ? `${Math.round((income.withholdingAmount / income.grossAmount) * 100 * 100) / 100}%`
      : "—";

  return (
    <SectionCard title={t("income")} editing={editing} onEdit={open}>
      {editing ? (
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <IncomeFields />
            <SectionEditFooter onCancel={cancel} saving={saving} />
          </form>
        </Form>
      ) : job.isBrotherJob ? (
        <Badge
          variant="outline"
          className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800"
        >
          {t("brotherBadge")}
        </Badge>
      ) : income ? (
        <>
          <dl className="grid gap-3 sm:hidden">
            <DetailItem label={t("grossAmount")}>
              <span className="tabular-nums">
                {formatTHB(income.grossAmount)} THB
              </span>
            </DetailItem>
            <DetailItem label={t("withholdingRate")}>
              <span className="tabular-nums">{rate}</span>
            </DetailItem>
            <DetailItem label={tDashboard("withholding")}>
              <span className="tabular-nums">
                {income.withholdingAmount > 0
                  ? `${formatTHB(income.withholdingAmount)} THB`
                  : "—"}
              </span>
            </DetailItem>
            <DetailItem label={tDashboard("net")}>
              <span className="tabular-nums">
                <NumberTicker value={income.netAmount} decimalPlaces={2} /> THB
              </span>
            </DetailItem>
          </dl>
          <div className="hidden overflow-hidden rounded-lg border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("grossAmount")}</TableHead>
                  <TableHead className="text-right">
                    {t("withholdingRate")}
                  </TableHead>
                  <TableHead className="text-right">
                    {tDashboard("withholding")}
                  </TableHead>
                  <TableHead className="text-right">{tDashboard("net")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-right tabular-nums">
                    {formatTHB(income.grossAmount)} THB
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{rate}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {income.withholdingAmount > 0
                      ? `${formatTHB(income.withholdingAmount)} THB`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    <NumberTicker value={income.netAmount} decimalPlaces={2} /> THB
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-muted/25 p-3 text-sm text-muted-foreground">
          {t("incomeEmpty")}
        </p>
      )}
    </SectionCard>
  );
}

/* ----------------------------------- Dates ---------------------------------- */

export function DatesCard({ job, defaultValues, confirm, onSave }: SectionCommon) {
  const t = useTranslations("jobs");
  const { editing, open, cancel, submit, form, saving } = useSectionEdit({
    schema: datesSectionSchema,
    defaultValues,
    confirm,
    onSave: (values) =>
      onSave({
        receivedDate: values.receivedDate,
        reviewDeadline: values.reviewDeadline || null,
        publishDate: values.publishDate || null,
        paymentDate: values.paymentDate || null,
        // Resend income context so the income row stays consistent with the
        // updated dates (see route's buildIncomeFromJobPayload).
        isBrotherJob: defaultValues.isBrotherJob,
        hasWithholdingTax: defaultValues.hasWithholdingTax,
        amount: defaultValues.amount,
        withholdingRate: defaultValues.withholdingRate,
      }),
  });

  const cal = <Calendar className="h-3.5 w-3.5" />;
  const dates: Array<{ label: string; value?: string | null; cls?: string }> = [
    { label: t("receivedDate"), value: job.receivedDate },
    {
      label: t("reviewDeadline"),
      value: job.reviewDeadline,
      cls:
        job.reviewDeadline && isNearReviewDeadline(job.reviewDeadline)
          ? "rounded px-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          : undefined,
    },
    {
      label: t("publishDate"),
      value: job.publishDate,
      cls:
        job.publishDate && isPublishDatePassed(job.publishDate)
          ? "rounded px-1 font-medium bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
          : undefined,
    },
    { label: t("paymentDate"), value: job.paymentDate },
  ];
  const hasAnyDate = dates.some((d) => d.value != null && d.value !== "");

  return (
    <SectionCard title={t("dates")} editing={editing} onEdit={open}>
      {editing ? (
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <CoreDateFields />
              <DateField name="paymentDate" label={t("paymentDate")} />
            </div>
            <SectionEditFooter onCancel={cancel} saving={saving} />
          </form>
        </Form>
      ) : hasAnyDate ? (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dates
            .filter((d) => d.value != null && d.value !== "")
            .map((d) => (
              <DetailItem key={d.label} label={d.label} icon={cal}>
                <span className={d.cls}>{formatDateThai(d.value!)}</span>
              </DetailItem>
            ))}
        </dl>
      ) : (
        <p className="rounded-lg bg-muted/25 p-3 text-sm text-muted-foreground">
          {t("datesEmpty")}
        </p>
      )}
    </SectionCard>
  );
}

/* ----------------------------------- Notes ---------------------------------- */

export function NotesCard({ job, defaultValues, confirm, onSave }: SectionCommon) {
  const t = useTranslations("jobs");
  const { editing, open, cancel, submit, form, saving } = useSectionEdit({
    schema: notesSectionSchema,
    defaultValues,
    confirm,
    onSave: (values) => onSave({ notes: values.notes ?? "" }),
  });

  return (
    <SectionCard title={t("notes")} editing={editing} onEdit={open}>
      {editing ? (
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <NotesField />
            <SectionEditFooter onCancel={cancel} saving={saving} />
          </form>
        </Form>
      ) : job.notes && job.notes.trim() ? (
        <p className="rounded-lg bg-muted/25 p-3 text-sm leading-6 whitespace-pre-wrap">
          {job.notes}
        </p>
      ) : (
        <p className="rounded-lg bg-muted/25 p-3 text-sm text-muted-foreground">
          {t("notesEmpty")}
        </p>
      )}
    </SectionCard>
  );
}
