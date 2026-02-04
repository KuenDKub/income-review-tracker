import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PayerTableRow } from "./PayerTableRow";
import { Checkbox } from "@/components/ui/checkbox";

export type PayerItem = {
  id: string;
  name: string;
  taxId?: string | null;
};

type PayerListProps = {
  payers: PayerItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string) => void;
  onToggleAllSelected?: () => void;
};

export function PayerList({
  payers,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelected,
  onToggleAllSelected,
}: PayerListProps) {
  if (payers.length === 0) {
    return <p className="text-sm text-muted-foreground">No payers found</p>;
  }
  const showActions = Boolean(onEdit || onDelete);
  const canSelect = Boolean(selectedIds && onToggleSelected && onToggleAllSelected);
  const allSelected = canSelect && payers.every((p) => selectedIds!.has(p.id));
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
          <TableHead>Name</TableHead>
          <TableHead>Tax ID</TableHead>
          {showActions && <TableHead className="text-right w-[120px]">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payers.map((payer) => (
          <PayerTableRow
            key={payer.id}
            payer={payer}
            onEdit={onEdit}
            onDelete={onDelete}
            selected={canSelect ? selectedIds!.has(payer.id) : undefined}
            onToggleSelected={canSelect ? () => onToggleSelected!(payer.id) : undefined}
          />
        ))}
      </TableBody>
    </Table>
  );
}
