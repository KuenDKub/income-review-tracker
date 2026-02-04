"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";
import type { incomeSchema } from "@/lib/schemas/income";

type IncomeFormValues = z.infer<typeof incomeSchema>;

export type JobOption = { id: string; title: string };

type IncomeFormProps = {
  schema: typeof incomeSchema;
  defaultValues?: Partial<IncomeFormValues>;
  onSubmit: (data: IncomeFormValues) => void;
  submitLabel?: string;
  jobs?: JobOption[];
};

export function IncomeForm({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  jobs = [],
}: IncomeFormProps) {
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: defaultValues as IncomeFormValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="reviewJobId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review job</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grossAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gross amount (THB)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="withholdingRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withholding rate (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">{submitLabel}</Button>
      </form>
    </Form>
  );
}
