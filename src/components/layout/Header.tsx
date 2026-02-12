import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type NavLabels = {
  dashboard: string;
  jobs: string;
  income: string;
  tax: string;
};

type HeaderProps = {
  title?: string;
  navLabels?: NavLabels;
};

const defaultNavLabels: NavLabels = {
  dashboard: "Dashboard",
  jobs: "Jobs",
  income: "Income",
  tax: "Tax",
};

export function Header({
  title = "Review Income & Tax Tracker",
  navLabels = defaultNavLabels,
}: HeaderProps) {
  const labels = { ...defaultNavLabels, ...navLabels };

  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/">
          <span className="text-lg font-semibold">{title}</span>
        </Link>
        <nav className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">{labels.dashboard}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs">{labels.jobs}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/income">{labels.income}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tax">{labels.tax}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
