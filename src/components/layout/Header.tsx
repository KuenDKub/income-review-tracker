import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title?: string;
};

export function Header({ title = "Review Income & Tax Tracker" }: HeaderProps) {
  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/">
          <span className="text-lg font-semibold">{title}</span>
        </Link>
        <nav className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs">Jobs</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/payers">Payers</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/income">Income</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tax">Tax</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
