import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobTableRow } from "./JobTableRow";
import { Checkbox } from "@/components/ui/checkbox";

export type JobItem = {
  id: string;
  title: string;
  platforms: string[];
  contentType: string;
  jobDate: string;
  payerName?: string;
};

type JobListProps = {
  jobs: JobItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string) => void;
  onToggleAllSelected?: () => void;
};

export function JobList({
  jobs,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelected,
  onToggleAllSelected,
}: JobListProps) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No jobs found</p>;
  }
  const showActions = Boolean(onEdit || onDelete);
  const canSelect = Boolean(selectedIds && onToggleSelected && onToggleAllSelected);
  const allSelected = canSelect && jobs.every((j) => selectedIds!.has(j.id));
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
          <TableHead>Title</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>Content type</TableHead>
          <TableHead>Payer</TableHead>
          <TableHead>Job date</TableHead>
          {showActions && <TableHead className="text-right w-[140px]">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <JobTableRow
            key={job.id}
            job={job}
            onEdit={onEdit}
            onDelete={onDelete}
            selected={canSelect ? selectedIds!.has(job.id) : undefined}
            onToggleSelected={canSelect ? () => onToggleSelected!(job.id) : undefined}
          />
        ))}
      </TableBody>
    </Table>
  );
}
