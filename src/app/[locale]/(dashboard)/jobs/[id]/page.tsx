import { JobDetailClient } from "@/components/jobs/JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto w-full max-w-5xl">
      <JobDetailClient id={id} />
    </div>
  );
}
