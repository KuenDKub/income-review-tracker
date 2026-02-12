"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { FileUpload } from "@/components/ui/file-upload";
import type { z } from "zod";
import type { reviewJobSchema } from "@/lib/schemas/reviewJob";
import { REVIEW_JOB_STATUSES } from "@/lib/schemas/reviewJob";

const STATUS_KEYS: Record<string, string> = {
  received: "statusReceived",
  script_sent: "statusScriptSent",
  in_progress: "statusInProgress",
  waiting_edit: "statusWaitingEdit",
  waiting_review: "statusWaitingReview",
  approved_pending: "statusApprovedPending",
  paid: "statusPaid",
};

type JobFormValues = z.infer<typeof reviewJobSchema>;

type JobFormFieldsProps = {
  form: UseFormReturn<JobFormValues>;
  payerNames?: string[];
  evidenceFiles?: File[];
  onEvidenceFilesChange?: (files: File[]) => void;
  existingEvidenceImages?: Array<{ id: string; url: string }>;
  onRemoveExistingEvidence?: (id: string) => void;
  showEvidence?: boolean;
};

const PLATFORM_OPTIONS = [
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
  { value: "Instagram", label: "Instagram" },
  { value: "Lemon8", label: "Lemon8" },
  { value: "Facebook", label: "Facebook" },
  { value: "Twitter", label: "Twitter/X" },
  { value: "Skinsista", label: "Skinsista" },
];

export function JobFormFields({
  form,
  payerNames = [],
  evidenceFiles = [],
  onEvidenceFilesChange,
  existingEvidenceImages = [],
  onRemoveExistingEvidence,
  showEvidence = true,
}: JobFormFieldsProps) {
  const t = useTranslations("jobs");
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const payerWrapRef = useRef<HTMLDivElement>(null);
  const payerListRef = useRef<HTMLUListElement>(null);

  const payerValue = form.watch("payerName") ?? "";
  const statusValue = form.watch("status");
  const hasWithholdingTax = form.watch("hasWithholdingTax") ?? false;
  const isBrotherJob = form.watch("isBrotherJob") ?? false;
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
  const filteredPayers = payerValue.trim()
    ? payerNames.filter((n) =>
        n.toLowerCase().includes(payerValue.toLowerCase()),
      )
    : payerNames;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (payerWrapRef.current?.contains(event.target as Node)) {
        return;
      }
      setPayerDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="payerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("payer")}</FormLabel>
              <div className="relative" ref={payerWrapRef}>
                <FormControl>
                  <Input
                    placeholder={t("payerPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setPayerDropdownOpen(true);
                    }}
                    onFocus={() => setPayerDropdownOpen(true)}
                  />
                </FormControl>
                {payerDropdownOpen && filteredPayers.length > 0 && (
                  <ul
                    ref={payerListRef}
                    className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md"
                  >
                    {filteredPayers.slice(0, 20).map((name) => (
                      <li
                        key={name}
                        role="option"
                        aria-selected={false}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          field.onChange(name);
                          setPayerDropdownOpen(false);
                        }}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("status")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REVIEW_JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(STATUS_KEYS[s] ?? "statusReceived")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("table.title")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("titlePlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="platforms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("table.platform")}</FormLabel>
              <FormControl>
                <MultiSelect
                  options={PLATFORM_OPTIONS}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder={t("selectPlatforms")}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contentType")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("contentTypePlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="receivedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("receivedDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reviewDeadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("reviewDeadline")}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                  min={minReviewDeadline}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="publishDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("publishDate")}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ""}
                  min={minPublishDate}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isBrotherJob"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal cursor-pointer">
                  {t("isBrotherJob")}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        {!isBrotherJob && (
          <>
            <FormField
              control={form.control}
              name="hasWithholdingTax"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal cursor-pointer">
                      {t("hasWithholdingTax")}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {!hasWithholdingTax ? (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>{t("amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        onChange={(e) => {
                          const v =
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value);
                          field.onChange(v);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                <FormField
                  control={form.control}
                  name="netAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("netAmount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0"
                          {...field}
                          value={
                            field.value === undefined || field.value === null
                              ? ""
                              : field.value
                          }
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value);
                            field.onChange(v);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="withholdingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("withholdingAmount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0"
                          {...field}
                          value={
                            field.value === undefined || field.value === null
                              ? ""
                              : field.value
                          }
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value);
                            field.onChange(v);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showEvidence && onEvidenceFilesChange && statusValue === "paid" && (
        <FormItem>
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("paymentDate")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    min={minPublishDate}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormLabel>{t("evidenceOptional")}</FormLabel>
          <FileUpload
            value={evidenceFiles}
            onChange={onEvidenceFilesChange}
            accept="image/*"
            multiple
            existingImages={existingEvidenceImages}
            onRemoveExisting={onRemoveExistingEvidence}
          />
        </FormItem>
      )}
    </div>
  );
}
