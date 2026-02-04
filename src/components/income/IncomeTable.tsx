import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncomeRow } from "./IncomeRow";
import { Checkbox } from "@/components/ui/checkbox";

export type IncomeItem = {
  id: string;
  grossAmount: number;
  withholdingAmount: number;
  netAmount: number;
  paymentDate: string;
  currency?: string;
};

type IncomeTableProps = {
  items: IncomeItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string) => void;
  onToggleAllSelected?: () => void;
};

export function IncomeTable({
  items,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelected,
  onToggleAllSelected,
}: IncomeTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No income entries</p>;
  }
  const showActions = Boolean(onEdit || onDelete);
  const canSelect = Boolean(selectedIds && onToggleSelected && onToggleAllSelected);
  const allSelected = canSelect && items.every((i) => selectedIds!.has(i.id));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {canSelect && (
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onToggleAllSelected?.()}
                aria-label="Select all"
              />
            </TableHead>
          )}
          <TableHead>Payment date</TableHead>
          <TableHead className="text-right">Gross</TableHead>
          <TableHead className="text-right">Withholding</TableHead>
          <TableHead className="text-right">Net</TableHead>
          {showActions && <TableHead className="text-right w-[120px]">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <IncomeRow
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            selected={canSelect ? selectedIds!.has(item.id) : undefined}
            onToggleSelected={canSelect ? () => onToggleSelected!(item.id) : undefined}
          />
        ))}
      </TableBody>
    </Table>
  );
}
