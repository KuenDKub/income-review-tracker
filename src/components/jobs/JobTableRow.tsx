import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { JobItem } from "./JobList";
import { Eye, Pencil, Trash2 } from "lucide-react";

type JobTableRowProps = {
  job: JobItem;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onToggleSelected?: () => void;
};

export function JobTableRow({
  job,
  onEdit,
  onDelete,
  selected,
  onToggleSelected,
}: JobTableRowProps) {
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
      <TableCell>
        <Link
          href={`/jobs/${job.id}`}
          className="font-medium text-primary hover:underline"
        >
          {job.title}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {job.platforms && job.platforms.length > 0 ? (
            job.platforms.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs">
                {p}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
      <TableCell>{job.contentType}</TableCell>
      <TableCell>{job.payerName ?? "—"}</TableCell>
      <TableCell>{job.jobDate}</TableCell>
      {(onEdit || onDelete) && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="icon" asChild aria-label="View">
              <Link href={`/jobs/${job.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEdit(job.id)}
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
                onClick={() => onDelete(job.id)}
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
