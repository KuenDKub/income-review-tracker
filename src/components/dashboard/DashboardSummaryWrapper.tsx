"use client";

import { useEffect, useState } from "react";
import { DashboardSummary } from "./DashboardSummary";

type SummaryData = {
  monthly: { gross: number; withholding: number; net: number };
  yearly: { gross: number; withholding: number; net: number };
  recentJobs: Array<{ id: string; title: string; jobDate: string }>;
};

const emptyData: SummaryData = {
  monthly: { gross: 0, withholding: 0, net: 0 },
  yearly: { gross: 0, withholding: 0, net: 0 },
  recentJobs: [],
};

export function DashboardSummaryWrapper() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    fetch(`/api/dashboard/summary?year=${year}&month=${month}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: SummaryData }) => setData(json.data))
      .catch(() => setError(true));
  }, []);

  const summary = data ?? emptyData;
  if (error && !data) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load summary. Ensure the database is configured.
      </p>
    );
  }

  return (
    <DashboardSummary
      monthlyGross={summary.monthly.gross}
      monthlyWithholding={summary.monthly.withholding}
      monthlyNet={summary.monthly.net}
      yearlyGross={summary.yearly.gross}
      yearlyWithholding={summary.yearly.withholding}
      yearlyNet={summary.yearly.net}
      recentJobs={summary.recentJobs}
    />
  );
}
