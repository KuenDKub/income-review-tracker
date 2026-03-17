"use client";

import * as React from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDateThai } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";

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

export function CalendarClient() {
  const t = useTranslations("calendar");
  const tJobs = useTranslations("jobs");
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
      setSelectedDate(null);
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
    setDialogOpen(true);
    setEditingNoteId(null);
    setNoteDraft("");
  };

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


  return (
    <div className="min-w-0 space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold sm:text-2xl">
              {t("pageTitle")}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(startOfDay(new Date()))}
            >
              {t("today")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-4">
          {isLoading ? (
            <CalendarSkeleton />
          ) : (
            <Calendar
              date={currentDate}
              onNavigate={(d) => setCurrentDate(startOfDay(d))}
              events={events}
              onSelectDate={handleSelectDate}
              dayNotes={notes}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingNoteId(null);
            setNoteDraft("");
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? selectedLabel : t("pageTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t("jobsSectionTitle")}
                </h3>
              </div>
              {jobsOnSelectedDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noEvents")}</p>
              ) : (
                <ul className="space-y-2">
                  {jobsOnSelectedDay.map((e, idx) => {
                    const jobId = e.jobId;
                    const kind = e.kind;
                    return (
                      <li
                        key={`${jobId ?? "job"}-${idx}`}
                        className="flex items-start justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div className="space-y-1">
                          {jobId ? (
                            <Link
                              href={`/jobs/${jobId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {e.title}
                            </Link>
                          ) : (
                            <span className="font-medium">{e.title}</span>
                          )}
                          {kind && (
                            <div className="flex flex-wrap gap-1">
                      {kind === "review" && (
                        <Badge variant="outline">
                          {tJobs("reviewDeadline")}
                        </Badge>
                      )}
                      {kind === "publish" && (
                        <Badge variant="outline">
                          {tJobs("publishDate")}
                        </Badge>
                      )}
                      {kind === "payment" && (
                        <Badge variant="outline">
                          {tJobs("paymentDate")}
                        </Badge>
                      )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t("userEventsSectionTitle")}
                </h3>
              </div>
              <ul className="space-y-2">
                {notesOnSelectedDay.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    {t("noEvents")}
                  </li>
                )}
                {notesOnSelectedDay.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <p className="whitespace-pre-line">{note.text}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditNote(note)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        🗑
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="note">
                  {t("noteLabel")}
                </label>
                <Textarea
                  id="note"
                  value={noteDraft}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNoteDraft(event.target.value)
                  }
                  rows={3}
                  placeholder={t("addNote")}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingNoteId(null);
                      setNoteDraft("");
                      setDialogOpen(false);
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleSaveNote}>
                    {editingNoteId ? t("editNote") : t("saveNote")}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

