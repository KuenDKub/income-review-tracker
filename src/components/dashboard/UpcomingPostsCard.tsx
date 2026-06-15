"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarCheck, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateThai } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

type UpcomingPost = {
  id: string;
  title: string;
  payerName: string | null;
  status: string;
  platforms: string[];
  publishDate: string;
  daysUntil: number;
};

/** Tone by urgency: red overdue, primary today, amber within 3d, muted later. */
function tone(days: number): string {
  if (days < 0) return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200";
  if (days === 0) return "bg-primary/15 text-primary";
  if (days <= 3)
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}

export function UpcomingPostsCard() {
  const t = useTranslations("posts");
  const [data, setData] = useState<UpcomingPost[] | null>(null);

  useEffect(() => {
    fetch("/api/jobs/upcoming-posts")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json: { data: UpcomingPost[] }) => setData(json.data))
      .catch(() => setData([]));
  }, []);

  if (data === null) {
    return <Skeleton className="h-44 rounded-2xl" />;
  }

  function label(days: number): string {
    if (days < 0) return t("overdue", { days: Math.abs(days) });
    if (days === 0) return t("today");
    if (days === 1) return t("tomorrow");
    return t("inDays", { days });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
            <Megaphone className="size-4" />
          </span>
          {t("title")}
        </h2>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <CalendarCheck className="size-4" />
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/jobs/${post.id}`}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatDateThai(post.publishDate)}
                    {post.platforms.length > 0 && ` · ${post.platforms.join(", ")}`}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    tone(post.daysUntil),
                  )}
                >
                  {label(post.daysUntil)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
