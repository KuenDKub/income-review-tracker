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
import type { z } from "zod";
import type { payerSchema } from "@/lib/schemas/payer";

type PayerFormValues = z.infer<typeof payerSchema>;

type PayerFormProps = {
  schema: typeof payerSchema;
  defaultValues?: Partial<PayerFormValues>;
  onSubmit: (data: PayerFormValues) => void;
  submitLabel?: string;
};

export function PayerForm({
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
}: PayerFormProps) {
  const form = useForm<PayerFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: defaultValues as PayerFormValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Payer / brand name" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Thai tax ID" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">{submitLabel}</Button>
      </form>
    </Form>
  );
}
