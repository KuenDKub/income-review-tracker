import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { PayerItem } from "./PayerList";

type PayerTableRowProps = {
  payer: PayerItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onToggleSelected?: () => void;
};

export function PayerTableRow({
  payer,
  onEdit,
  onDelete,
  selected,
  onToggleSelected,
}: PayerTableRowProps) {
  const canSelect = typeof selected === "boolean" && Boolean(onToggleSelected);
  return (
    <TableRow>
      {canSelect && (
        <TableCell className="w-[40px]">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelected?.()}
            aria-label="Select row"
          />
        </TableCell>
      )}
      <TableCell className="font-medium">{payer.name}</TableCell>
      <TableCell>{payer.taxId ?? "—"}</TableCell>
      {(onEdit || onDelete) && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEdit(payer.id)}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(payer.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
