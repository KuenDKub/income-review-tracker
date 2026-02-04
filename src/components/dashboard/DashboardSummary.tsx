import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { YearlySummaryCard } from "./YearlySummaryCard";
import { RecentJobsList } from "./RecentJobsList";

type DashboardSummaryProps = {
  monthlyGross?: number;
  monthlyWithholding?: number;
  monthlyNet?: number;
  yearlyGross?: number;
  yearlyWithholding?: number;
  yearlyNet?: number;
  recentJobs?: Array<{ id: string; title: string; jobDate: string }>;
};

export function DashboardSummary({
  monthlyGross = 0,
  monthlyWithholding = 0,
  monthlyNet = 0,
  yearlyGross = 0,
  yearlyWithholding = 0,
  yearlyNet = 0,
  recentJobs = [],
}: DashboardSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlySummaryCard
          gross={monthlyGross}
          withholding={monthlyWithholding}
          net={monthlyNet}
        />
        <YearlySummaryCard
          gross={yearlyGross}
          withholding={yearlyWithholding}
          net={yearlyNet}
        />
      </div>
      <RecentJobsList jobs={recentJobs} />
    </div>
  );
}
