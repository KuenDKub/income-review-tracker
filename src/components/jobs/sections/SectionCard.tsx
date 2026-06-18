"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Presentational wrapper for an inline-editable detail section: a card header
 * with a title and an edit affordance (hidden while editing), plus a body that
 * the caller swaps between view and edit content.
 */
export function SectionCard({
  title,
  icon,
  editing,
  onEdit,
  children,
  className,
  id,
}: {
  title: ReactNode;
  icon?: ReactNode;
  editing: boolean;
  onEdit?: () => void;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const tCommon = useTranslations("common");
  return (
    <Card id={id} className={cn("gap-4 py-4 shadow-sm md:py-5", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 md:px-5">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {!editing && onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-mr-2 h-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
            {tCommon("edit")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 md:px-5">{children}</CardContent>
    </Card>
  );
}

/** Save / Cancel row shown at the bottom of a section while editing. */
export function SectionEditFooter({
  onCancel,
  saving,
}: {
  onCancel: () => void;
  saving: boolean;
}) {
  const tCommon = useTranslations("common");
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={onCancel}
        disabled={saving}
      >
        {tCommon("cancel")}
      </Button>
      <Button type="submit" className="min-h-11" loading={saving}>
        {tCommon("save")}
      </Button>
    </div>
  );
}
