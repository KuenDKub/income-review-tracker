"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

type JobFormValues = z.infer<typeof reviewJobSchema>;

export type PayerOption = { id: string; name: string };

type JobFormFieldsProps = {
  form: UseFormReturn<JobFormValues>;
  payers?: PayerOption[];
  evidenceFiles?: File[];
  onEvidenceFilesChange?: (files: File[]) => void;
  existingEvidenceImages?: Array<{ id: string; url: string }>;
  onRemoveExistingEvidence?: (id: string) => void;
};

const PLATFORM_OPTIONS = [
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
  { value: "Instagram", label: "Instagram" },
  { value: "Facebook", label: "Facebook" },
  { value: "Twitter", label: "Twitter/X" },
  { value: "Other", label: "Other" },
];

export function JobFormFields({
  form,
  payers = [],
  evidenceFiles = [],
  onEvidenceFilesChange,
  existingEvidenceImages = [],
  onRemoveExistingEvidence,
}: JobFormFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="payerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {payers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Job title" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="platforms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Platforms</FormLabel>
              <FormControl>
                <MultiSelect
                  options={PLATFORM_OPTIONS}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select platforms"
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
              <FormLabel>Content type</FormLabel>
              <FormControl>
                <Input placeholder="e.g. video, post" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jobDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {onEvidenceFilesChange && (
        <FormItem>
          <FormLabel>Evidence Images (Optional)</FormLabel>
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
