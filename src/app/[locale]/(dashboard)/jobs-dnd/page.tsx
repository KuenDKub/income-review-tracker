import { Suspense } from "react";
import { JobsDndClient } from "@/components/jobs/JobsDndClient";

export default function JobsDndPage() {
  return (
    <Suspense fallback={null}>
      <JobsDndClient />
    </Suspense>
  );
}
