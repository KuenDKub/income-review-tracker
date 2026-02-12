"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { IncomeItem } from "./IncomeTable";

type IncomeRowProps = {
  item: IncomeItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onToggleSelected?: () => void;
};

export function IncomeRow({
  item,
  onEdit,
  onDelete,
  selected,
  onToggleSelected,
}: IncomeRowProps) {
  const tCommon = useTranslations("common");
  const currency = item.currency ?? "THB";
  const canSelect = typeof selected === "boolean" && Boolean(onToggleSelected);
  return (
    <TableRow>
      {canSelect && (
        <TableCell className="w-[40px]">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelected?.()}
            aria-label={tCommon("selectRow")}
          />
        </TableCell>
      )}
      <TableCell>{item.paymentDate}</TableCell>
      <TableCell className="text-right">
        {item.grossAmount.toLocaleString("th-TH")} {currency}
      </TableCell>
      <TableCell className="text-right">
        {item.withholdingAmount.toLocaleString("th-TH")} {currency}
      </TableCell>
      <TableCell className="text-right">
        {item.netAmount.toLocaleString("th-TH")} {currency}
      </TableCell>
      {(onEdit || onDelete) && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            {onEdit && (
              <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(item.id)} aria-label={tCommon("edit")}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label={tCommon("delete")}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
