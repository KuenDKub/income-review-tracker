"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
  submitLabel,
  jobs = [],
}: IncomeFormProps) {
  const t = useTranslations("income");
  const tCommon = useTranslations("common");
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
              <FormLabel>{t("job")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectJob")} />
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
              <FormLabel>{t("grossAmount")}</FormLabel>
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
              <FormLabel>{t("withholdingRate")}</FormLabel>
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
              <FormLabel>{t("paymentDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">{submitLabel ?? tCommon("save")}</Button>
      </form>
    </Form>
  );
}
