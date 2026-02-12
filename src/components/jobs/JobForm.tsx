"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { JobFormFields } from "./JobFormFields";
import type { z } from "zod";
import type { reviewJobSchema } from "@/lib/schemas/reviewJob";

type JobFormValues = z.infer<typeof reviewJobSchema>;

type JobFormProps = {
  schema: typeof reviewJobSchema;
  defaultValues?: Partial<JobFormValues>;
  onSubmit: (data: JobFormValues) => void;
  submitLabel?: string;
  payerNames?: string[];
  evidenceFiles?: File[];
  onEvidenceFilesChange?: (files: File[]) => void;
  existingEvidenceImages?: Array<{ id: string; url: string }>;
  onRemoveExistingEvidence?: (id: string) => void;
  showEvidence?: boolean;
};

export function JobForm({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  payerNames = [],
  evidenceFiles = [],
  onEvidenceFilesChange,
  existingEvidenceImages = [],
  onRemoveExistingEvidence,
  showEvidence = true,
}: JobFormProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: defaultValues as JobFormValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <JobFormFields
          form={form}
          payerNames={payerNames}
          evidenceFiles={evidenceFiles}
          onEvidenceFilesChange={onEvidenceFilesChange}
          existingEvidenceImages={existingEvidenceImages}
          onRemoveExistingEvidence={onRemoveExistingEvidence}
          showEvidence={showEvidence}
        />
        <Button type="submit" className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
