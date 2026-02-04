import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Job = { id: string; title: string; jobDate: string };

type RecentJobsListProps = {
  jobs: Job[];
};

export function RecentJobsList({ jobs }: RecentJobsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent jobs</CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent jobs</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {job.title}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">{job.jobDate}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
