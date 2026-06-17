"use client";

import * as React from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  isToday,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";
import { CalendarSubscribe } from "@/components/calendar/CalendarSubscribe";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "../ui/textarea";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatDateThai } from "@/lib/formatDate";
import { useConfirm } from "@/components/ui/useConfirm";
import { toast } from "@/lib/toast";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Pencil,
  StickyNote,
  Trash2,
} from "lucide-react";

type ReviewJobEventKind = "review" | "publish" | "payment";

type CalendarJobEvent = CalendarEvent & {
  kind: ReviewJobEventKind;
  jobId: string;
};

type JobLike = {
  id: string;
  title: string;
  reviewDeadline?: string | null;
  publishDate?: string | null;
  paymentDate?: string | null;
};

type UserNote = {
  id: string;
  date: string; // yyyy-MM-dd
  text: string;
};

import type { CalendarNote } from "@/types/calendarNotes";

type UseJobsResult = {
  events: CalendarJobEvent[];
  loading: boolean;
};

type UseNotesResult = {
  notes: UserNote[];
  reload: () => Promise<void>;
  loading: boolean;
};

function useJobsForCalendar(year: number): UseJobsResult {
  const tJobs = useTranslations("jobs");
  const [jobs, setJobs] = useState<JobLike[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/board?year=${year}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? tJobs("loadingError"));
      const data = (json.data ?? []) as JobLike[];
      setJobs(
        data.map((j) => ({
          id: j.id as string,
          title: j.title as string,
          reviewDeadline: j.reviewDeadline ?? null,
          publishDate: j.publishDate ?? null,
          paymentDate: j.paymentDate ?? null,
        })),
      );
    } catch (error) {
      toast.error(tJobs("loadingError"), String(error));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [tJobs, year]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const events: CalendarJobEvent[] = useMemo(() => {
    const all: CalendarJobEvent[] = [];
    for (const job of jobs) {
      const baseTitle = job.title;
      if (job.reviewDeadline) {
        const d = new Date(job.reviewDeadline);
        all.push({
          title: `${baseTitle} – ${tJobs("reviewDeadline")}`,
          start: startOfDay(d),
          end: endOfDay(d),
          kind: "review",
          jobId: job.id,
        });
      }
      if (job.publishDate) {
        const d = new Date(job.publishDate);
        all.push({
          title: `${baseTitle} – ${tJobs("publishDate")}`,
          start: startOfDay(d),
          end: endOfDay(d),
          kind: "publish",
          jobId: job.id,
        });
      }
      if (job.paymentDate) {
        const d = new Date(job.paymentDate);
        all.push({
          title: `${baseTitle} – ${tJobs("paymentDate")}`,
          start: startOfDay(d),
          end: endOfDay(d),
          kind: "payment",
          jobId: job.id,
        });
      }
    }
    return all;
  }, [jobs, tJobs]);

  return { events, loading };
}

function getCalendarRange(centerDate: Date): { from: string; to: string } {
  const monthStart = startOfMonth(centerDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const from = gridStart;
  const to = gridEnd;

  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

function CalendarSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-2 sm:p-3">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-1 rounded-md border bg-muted/60 p-0.5 sm:p-1">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-9 rounded" />
        </div>
      </div>
      <div className="overflow-x-auto -mx-0.5 sm:mx-0">
        <div className="grid grid-cols-7 gap-px rounded-md border bg-border min-w-[504px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted/60 px-0.5 sm:px-2 py-1 flex items-center justify-center"
            >
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
          {Array.from({ length: 6 * 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="min-h-[56px] md:min-h-[60px] lg:h-24 w-full rounded-none"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function useCalendarNotes(currentDate: Date): UseNotesResult {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("calendar");

  const load = useCallback(async () => {
    const { from, to } = getCalendarRange(currentDate);
    const res = await fetch(`/api/calendar/notes?from=${from}&to=${to}`);
    const json = (await res.json()) as {
      data?: CalendarNote[];
      error?: string;
    };
    if (!res.ok) {
      throw new Error(json.error ?? "Failed to fetch notes");
    }
    const data = (json.data ?? []) as CalendarNote[];
    setNotes(
      data.map((n) => ({
        id: n.id,
        // Normalize to yyyy-MM-dd so it matches calendar grid keys
        date:
          n.noteDate.length === 10
            ? n.noteDate
            : format(new Date(n.noteDate), "yyyy-MM-dd"),
        text: n.text,
      })),
    );
  }, [currentDate]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await load();
      } catch (error) {
        if (!cancelled) toast.error(t("loadNotesError"), String(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [load, t]);

  return { notes, reload: load, loading };
}

const KIND_DOT_CLASS: Record<ReviewJobEventKind, string> = {
  review: "bg-rose-400 dark:bg-rose-500",
  publish: "bg-sky-400 dark:bg-sky-500",
  payment: "bg-green-500 dark:bg-green-400",
};

export function CalendarClient({ feedToken = "" }: { feedToken?: string }) {
  const t = useTranslations("calendar");
  const { confirm, confirmDialog } = useConfirm();
  const locale = useLocale();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [mobileView, setMobileView] = useState<"agenda" | "month">("agenda");

  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    startOfDay(new Date())
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const { events, loading: jobsLoading } = useJobsForCalendar(
    currentDate.getFullYear(),
  );
  const { notes: loadedNotes, reload: reloadNotes, loading: notesLoading } =
    useCalendarNotes(currentDate);

  const isLoading = jobsLoading || notesLoading;

  useEffect(() => {
    setNotes(loadedNotes);
  }, [loadedNotes]);

  const dayKey = (date: Date) => format(startOfDay(date), "yyyy-MM-dd");

  useEffect(() => {
    if (!selectedDate) return;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    if (selectedDate < gridStart || selectedDate > gridEnd) {
      // Keep the side panel populated: snap selection into the visible month.
      setSelectedDate(startOfMonth(currentDate));
      setDialogOpen(false);
      setEditingNoteId(null);
      setNoteDraft("");
    }
  }, [currentDate, selectedDate]);

  const jobsOnSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const key = dayKey(selectedDate);
    return events.filter(
      (e) => dayKey(e.start as Date) === key && e.jobId,
    );
  }, [events, selectedDate]);

  const notesOnSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const key = dayKey(selectedDate);
    return notes.filter((n) => n.date === key);
  }, [notes, selectedDate]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setEditingNoteId(null);
    setNoteDraft("");
    // Desktop shows the day in the side panel; mobile opens a bottom sheet.
    if (!isDesktop) setDialogOpen(true);
  };

  /** Events + notes of the current month grouped per day, for the mobile agenda. */
  const agendaDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const byDay = new Map<
      string,
      { date: Date; events: CalendarJobEvent[]; notes: UserNote[] }
    >();
    const entryFor = (date: Date) => {
      const key = dayKey(date);
      let entry = byDay.get(key);
      if (!entry) {
        entry = { date: startOfDay(date), events: [], notes: [] };
        byDay.set(key, entry);
      }
      return entry;
    };
    for (const e of events) {
      const d = e.start as Date;
      if (d < monthStart || d > monthEnd) continue;
      entryFor(d).events.push(e);
    }
    for (const n of notes) {
      const d = new Date(`${n.date}T00:00:00`);
      if (Number.isNaN(d.getTime()) || d < monthStart || d > monthEnd) continue;
      entryFor(d).notes.push(n);
    }
    return [...byDay.values()].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [events, notes, currentDate]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(currentDate),
    [currentDate, locale]
  );

  const handleSaveNote = () => {
    if (!selectedDate) return;
    if (!noteDraft.trim()) {
      toast.error(t("noteLabel"), t("addNote"));
      return;
    }
    const key = dayKey(selectedDate);
    const payload = {
      noteDate: key,
      text: noteDraft.trim(),
    };

    const save = async () => {
      try {
        if (editingNoteId) {
          const res = await fetch(`/api/calendar/notes/${editingNoteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: payload.text }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Failed to update note");
        } else {
          const res = await fetch("/api/calendar/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Failed to create note");
        }
        await reloadNotes();
        setEditingNoteId(null);
        setNoteDraft("");
        toast.success(t("noteSavedSuccess"));
      } catch (error) {
        toast.error(t("saveNoteError"), String(error));
      }
    };

    void save();
  };

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setNoteDraft(note.text);
  };

  const handleDeleteNote = (id: string) => {
    const remove = async () => {
      if (!(await confirm({ description: t("confirmDeleteNote") }))) return;
      try {
        const res = await fetch(`/api/calendar/notes/${id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to delete note");
        await reloadNotes();
        if (editingNoteId === id) {
          setEditingNoteId(null);
          setNoteDraft("");
        }
        toast.success(t("deleteNote"));
      } catch (error) {
        toast.error(t("deleteNoteError"), String(error));
      }
    };

    void remove();
  };

  const selectedLabel =
    selectedDate && formatDateThai
      ? formatDateThai(format(selectedDate, "yyyy-MM-dd"))
      : selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : "";

  const dayDetail = (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("jobsSectionTitle")}
        </h3>
        {jobsOnSelectedDay.length === 0 ? (
          <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
            {t("noEvents")}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {jobsOnSelectedDay.map((e, idx) => (
              <li key={`${e.jobId ?? "job"}-${idx}`}>
                <Link
                  href={`/jobs/${e.jobId}`}
                  className="flex items-start gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 transition-colors touch-manipulation hover:bg-muted active:bg-muted"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      KIND_DOT_CLASS[e.kind]
                    )}
                  />
                  <span className="min-w-0 text-sm font-medium leading-snug">
                    {e.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("userEventsSectionTitle")}
        </h3>
        {notesOnSelectedDay.length > 0 && (
          <ul className="space-y-1.5">
            {notesOnSelectedDay.map((note) => (
              <li
                key={note.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-sm dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <p className="flex items-start gap-2 whitespace-pre-line pt-1.5">
                  <StickyNote
                    className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-hidden
                  />
                  {note.text}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={t("editNote")}
                    onClick={() => handleEditNote(note)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive hover:text-destructive"
                    aria-label={t("deleteNote")}
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <label className="sr-only" htmlFor="day-note">
            {t("noteLabel")}
          </label>
          <Textarea
            id="day-note"
            value={noteDraft}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNoteDraft(event.target.value)
            }
            rows={2}
            placeholder={t("addNote")}
          />
          <div className="flex justify-end gap-2">
            {(editingNoteId || noteDraft) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[40px]"
                onClick={() => {
                  setEditingNoteId(null);
                  setNoteDraft("");
                }}
              >
                {t("cancel")}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="min-h-[40px]"
              onClick={handleSaveNote}
            >
              {editingNoteId ? t("editNote") : t("saveNote")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );


  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <PageHeader
        title={t("pageTitle")}
        actions={
          <>
            {/* Mobile: switch between agenda list and month grid */}
            <div className="flex rounded-md border p-0.5 md:hidden">
              <Button
                type="button"
                variant={mobileView === "agenda" ? "secondary" : "ghost"}
                size="sm"
                className="min-h-[40px]"
                aria-pressed={mobileView === "agenda"}
                onClick={() => setMobileView("agenda")}
              >
                <List className="size-4" />
                {t("viewAgenda")}
              </Button>
              <Button
                type="button"
                variant={mobileView === "month" ? "secondary" : "ghost"}
                size="sm"
                className="min-h-[40px]"
                aria-pressed={mobileView === "month"}
                onClick={() => setMobileView("month")}
              >
                <CalendarDays className="size-4" />
                {t("viewMonth")}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px]"
              onClick={() => setCurrentDate(startOfDay(new Date()))}
            >
              {t("today")}
            </Button>
            <CalendarSubscribe feedToken={feedToken} />
          </>
        }
      />

      <div className="min-w-0">
          {isLoading ? (
            <CalendarSkeleton />
          ) : (
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
             <div className="min-w-0">
              {/* Mobile agenda view */}
              <div
                className={cn(
                  "md:hidden",
                  mobileView !== "agenda" && "hidden"
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={t("previousMonth")}
                    onClick={() => setCurrentDate((d) => addMonths(d, -1))}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <span className="text-sm font-semibold">{monthLabel}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={t("nextMonth")}
                    onClick={() => setCurrentDate((d) => addMonths(d, 1))}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </div>

                {agendaDays.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {t("noEventsThisMonth")}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {agendaDays.map(({ date, events: dayEvents, notes: dayNotes }) => (
                      <li key={dayKey(date)}>
                        <button
                          type="button"
                          className={cn(
                            "w-full cursor-pointer touch-manipulation rounded-xl border bg-card p-3 text-left transition-colors active:bg-muted",
                            isToday(date) && "border-primary/50 bg-primary/5"
                          )}
                          onClick={() => handleSelectDate(date)}
                        >
                          <p
                            className={cn(
                              "mb-2 text-sm font-semibold",
                              isToday(date) && "text-primary"
                            )}
                          >
                            {formatDateThai(format(date, "yyyy-MM-dd"))}
                          </p>
                          <ul className="space-y-1.5">
                            {dayEvents.map((e, idx) => (
                              <li
                                key={`${e.jobId}-${idx}`}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span
                                  aria-hidden
                                  className={cn(
                                    "size-2 shrink-0 rounded-full",
                                    KIND_DOT_CLASS[e.kind]
                                  )}
                                />
                                <span className="min-w-0 truncate">
                                  {e.title}
                                </span>
                              </li>
                            ))}
                            {dayNotes.map((n) => (
                              <li
                                key={n.id}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <StickyNote className="size-3.5 shrink-0" />
                                <span className="min-w-0 truncate">{n.text}</span>
                              </li>
                            ))}
                          </ul>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Month grid (always on md+, opt-in on mobile) */}
              <div
                className={cn(mobileView === "agenda" && "hidden md:block")}
              >
                <Calendar
                  date={currentDate}
                  onNavigate={(d) => setCurrentDate(startOfDay(d))}
                  events={events}
                  onSelectDate={handleSelectDate}
                  selectedDate={selectedDate}
                  dayNotes={notes}
                />
              </div>
             </div>

              {/* Desktop: day detail side panel */}
              <aside className="hidden lg:block lg:sticky lg:top-6">
                <div className="rounded-xl border bg-card p-4">
                  <h2 className="mb-4 text-base font-semibold">
                    {selectedDate ? selectedLabel : t("pageTitle")}
                  </h2>
                  {dayDetail}
                </div>
              </aside>
            </div>
          )}
      </div>

      {/* Mobile: day detail bottom sheet */}
      <Sheet
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingNoteId(null);
            setNoteDraft("");
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>
              {selectedDate ? selectedLabel : t("pageTitle")}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">{dayDetail}</div>
        </SheetContent>
      </Sheet>

      {confirmDialog}
    </div>
  );
}

