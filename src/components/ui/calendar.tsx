"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  startOfDay,
} from "date-fns";
import { format } from "date-fns";
import { th as thLocale } from "date-fns/locale";

import { cn } from "@/lib/utils";

export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  kind?: "review" | "publish" | "payment" | "other";
};

export type CalendarDayNote = {
  id: string;
  date: string;
  text: string;
};

type CalendarProps = {
  date: Date;
  onNavigate?(nextDate: Date): void;
  events: CalendarEvent[];
  onSelectDate?(date: Date): void;
  dayNotes?: CalendarDayNote[];
  className?: string;
};

const NOTE_CHIP_MAX_LENGTH_MOBILE = 12;
const NOTE_CHIP_MAX_LENGTH_DESKTOP = 18;
const EVENT_TITLE_MAX_LENGTH_MOBILE = 10;
const EVENT_TITLE_MAX_LENGTH_DESKTOP = 22;
const MAX_CHIPS_MOBILE = 2;
const MAX_CHIPS_DESKTOP = 3;

const weekdayLabelsLong = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdayLabelsShort = ["M", "T", "W", "T", "F", "S", "S"];

function useIsMdOrLarger(): boolean {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setOk(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return ok;
}

const SWIPE_THRESHOLD_PX = 50;

function truncateNote(text: string, maxLen: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen) + "…";
}

function truncateEventTitle(title: string, maxLen: number): string {
  const oneLine = title.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen) + "…";
}

export function Calendar({
  date,
  onNavigate,
  events,
  onSelectDate,
  dayNotes = [],
  className,
}: CalendarProps) {
  const isMdOrLarger = useIsMdOrLarger();
  const maxChips = isMdOrLarger ? MAX_CHIPS_DESKTOP : MAX_CHIPS_MOBILE;
  const noteMaxLen = isMdOrLarger ? NOTE_CHIP_MAX_LENGTH_DESKTOP : NOTE_CHIP_MAX_LENGTH_MOBILE;
  const eventTitleMaxLen = isMdOrLarger ? EVENT_TITLE_MAX_LENGTH_DESKTOP : EVENT_TITLE_MAX_LENGTH_MOBILE;

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: Date[][] = [];
  let current = gridStart;
  while (current <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(current);
      current = addDays(current, 1);
    }
    rows.push(week);
  }

  const monthYearLabel = React.useMemo(() => {
    const gregorianYear = Number(format(date, "yyyy"));
    const buddhistYear = Number.isFinite(gregorianYear)
      ? gregorianYear + 543
      : gregorianYear;
    const monthName = format(date, "MMMM", { locale: thLocale });
    return `${monthName} ${buddhistYear}`;
  }, [date]);

  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !onNavigate) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const deltaX = t.clientX - start.x;
    const deltaY = t.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX > 0) {
      onNavigate(addDays(startOfMonth(date), -1));
    } else {
      onNavigate(addDays(endOfMonth(date), 1));
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-2 sm:p-3",
        className,
      )}
    >
      <div
        className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="inline-flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {monthYearLabel}
          </span>
        </div>
        <div className="inline-flex rounded-md border bg-muted/60 p-0.5 sm:p-1 text-xs">
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg sm:text-base hover:bg-background rounded touch-manipulation"
            onClick={() =>
              onNavigate?.(addDays(startOfMonth(date), -1))
            }
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg sm:text-base hover:bg-background rounded touch-manipulation"
            onClick={() =>
              onNavigate?.(addDays(endOfMonth(date), 1))
            }
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-0.5 sm:mx-0">
        <div className="grid grid-cols-7 gap-px rounded-md border bg-border text-xs min-w-[504px]">
          {weekdayLabelsLong.map((label, i) => (
            <div
              key={label}
              className="bg-muted/60 px-0.5 sm:px-2 py-1 text-center font-medium text-muted-foreground min-w-0"
            >
              <span className="sm:hidden">{weekdayLabelsShort[i]}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
          {rows.map((week) =>
          week.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayKey = format(startOfDay(day), "yyyy-MM-dd");
            const dayEvents = events.filter((event) =>
              isSameDay(event.start, day),
            );
            const notesForDay = dayNotes.filter((n) => n.date === dayKey);
            const totalItems = dayEvents.length + notesForDay.length;
            const eventChipsToShow = dayEvents.slice(0, maxChips);
            const noteChipsToShow = notesForDay.slice(
              0,
              Math.max(0, maxChips - eventChipsToShow.length),
            );
            const overflow =
              totalItems > maxChips ? totalItems - maxChips : 0;

            const hasReview = dayEvents.some((e) => e.kind === "review");
            const hasPublish = dayEvents.some((e) => e.kind === "publish");
            const hasPayment = dayEvents.some((e) => e.kind === "payment");
            const hasNote = notesForDay.length > 0;
            const indicatorSummary =
              totalItems > 0
                ? [
                    ...dayEvents.map((e) => e.title),
                    ...notesForDay.map((n) => n.text),
                  ].join(" — ")
                : "";

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => onSelectDate?.(day)}
                aria-label={
                  totalItems > 0
                    ? `${format(day, "d MMMM yyyy")}, ${totalItems} items`
                    : format(day, "d MMMM yyyy")
                }
                title={indicatorSummary || undefined}
                className={cn(
                  "flex min-h-[56px] md:min-h-[60px] lg:h-24 flex-col items-stretch justify-between bg-background px-1.5 py-1 sm:px-2 sm:py-1 text-left align-top text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation overflow-hidden",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground/70",
                  isToday && "border border-primary",
                )}
              >
                <span className="self-end text-[11px] sm:text-xs font-medium min-w-5 text-right shrink-0">
                  {day.getDate()}
                </span>
                {totalItems > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 min-h-0 overflow-hidden items-center">
                    {!isMdOrLarger ? (
                      totalItems > 3 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                          {totalItems}
                        </span>
                      ) : (
                        <>
                          {hasReview && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-sky-500"
                              aria-hidden
                            />
                          )}
                          {hasPublish && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-violet-500"
                              aria-hidden
                            />
                          )}
                          {hasPayment && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                              aria-hidden
                            />
                          )}
                          {hasNote && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                              aria-hidden
                            />
                          )}
                        </>
                      )
                    ) : (
                      <>
                        {eventChipsToShow.map((event, idx) => (
                          <span
                            key={`e-${idx}`}
                            title={event.title}
                            className={cn(
                              "inline-flex max-w-full min-w-0 rounded-full px-2 py-0.5 text-[10px] font-medium overflow-hidden text-ellipsis whitespace-nowrap",
                              event.kind === "review" &&
                                "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-100",
                              event.kind === "publish" &&
                                "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-100",
                              event.kind === "payment" &&
                                "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100",
                              !event.kind &&
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {truncateEventTitle(event.title, eventTitleMaxLen)}
                          </span>
                        ))}
                        {noteChipsToShow.map((note) => (
                          <span
                            key={note.id}
                            title={note.text}
                            className="inline-flex max-w-full min-w-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-100 overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {truncateNote(note.text, noteMaxLen)}
                          </span>
                        ))}
                        {overflow > 0 && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            +{overflow}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          }),
        )}
        </div>
      </div>
    </div>
  );
}


