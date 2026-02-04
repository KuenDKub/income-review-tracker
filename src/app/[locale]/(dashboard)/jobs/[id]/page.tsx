import { JobDetailClient } from "@/components/jobs/JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="min-h-screen p-8">
      <JobDetailClient id={id} />
    </main>
  );
}
