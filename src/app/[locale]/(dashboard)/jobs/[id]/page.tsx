import { JobDetailClient } from "@/components/jobs/JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <JobDetailClient id={id} />
    </div>
  );
}
