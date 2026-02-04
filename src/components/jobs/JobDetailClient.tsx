"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobForm } from "./JobForm";
import { reviewJobCreateSchema } from "@/lib/schemas/reviewJob";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "@/lib/toast";
import { Trash2 } from "lucide-react";
import type { z } from "zod";

type ReviewJobJson = {
  id: string;
  payerId: string;
  platforms: string[];
  contentType: string;
  title: string;
  jobDate: string;
  tags: string[];
  notes: string | null;
};

type DocumentJson = {
  id: string;
  filePath: string;
  kind: string;
  notes: string | null;
};

type PayerJson = { id: string; name: string };

export function JobDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const [job, setJob] = useState<ReviewJobJson | null>(null);
  const [payers, setPayers] = useState<PayerJson[]>([]);
  const [documents, setDocuments] = useState<DocumentJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [existingEvidenceImages, setExistingEvidenceImages] = useState<Array<{ id: string; url: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, payersRes, docsRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch("/api/payers?page=1&pageSize=100"),
        fetch(`/api/documents?reviewJobId=${id}`),
      ]);
      const jobJson = await jobRes.json();
      const payersJson = await payersRes.json();
      const docsJson = await docsRes.json();
      if (!jobRes.ok) throw new Error(jobJson.error ?? "Job not found");
      setJob(jobJson.data ?? null);
      setPayers((payersJson.data ?? []) as PayerJson[]);
      const docs = (docsJson.data ?? []) as DocumentJson[];
      setDocuments(docs);
      setExistingEvidenceImages(
        docs
          .filter((doc) => doc.filePath)
          .map((doc) => ({ id: doc.id, url: doc.filePath! }))
      );
    } catch (e) {
      toast.error("Failed to load job", String(e));
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditSubmit = async (data: z.infer<typeof reviewJobCreateSchema>) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update job");

      // Upload new evidence files if any
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            throw new Error("Failed to upload file");
          }
          const uploadJson = await uploadRes.json();
          await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reviewJobId: id,
              kind: "evidence",
              filePath: uploadJson.filePath,
            }),
          });
        }
        setEvidenceFiles([]);
      }

      toast.success("Job updated");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error("Failed to update job", String(e));
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete job");
      }
      toast.success("Job deleted");
      router.push("/jobs");
    } catch (e) {
      toast.error("Failed to delete job", String(e));
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!job) return <p className="text-sm text-muted-foreground">Job not found</p>;

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
      toast.success("Document deleted");
      await load();
    } catch (e) {
      toast.error("Failed to delete document", String(e));
    }
  };

  const defaultValues = {
    payerId: job.payerId,
    platforms: job.platforms || [],
    contentType: job.contentType,
    title: job.title,
    jobDate: job.jobDate,
    tags: job.tags,
    notes: job.notes,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{job.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            {tCommon("edit")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            {tCommon("delete")}
          </Button>
        </div>
      </div>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Platforms</dt>
          <dd>
            <div className="flex flex-wrap gap-1 mt-1">
              {job.platforms && job.platforms.length > 0 ? (
                job.platforms.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Content type</dt>
          <dd>{job.contentType}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Job date</dt>
          <dd>{job.jobDate}</dd>
        </div>
        {job.notes && (
          <div>
            <dt className="font-medium text-muted-foreground">Notes</dt>
            <dd>{job.notes}</dd>
          </div>
        )}
      </dl>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Evidence Images</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {documents.map((doc) => (
              <div key={doc.id} className="relative group">
                <img
                  src={doc.filePath}
                  alt="Evidence"
                  className="w-full h-32 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editJob")}</DialogTitle>
          </DialogHeader>
          <JobForm
            schema={reviewJobCreateSchema}
            defaultValues={defaultValues}
            onSubmit={handleEditSubmit}
            submitLabel={tCommon("save")}
            payers={payers}
            evidenceFiles={evidenceFiles}
            onEvidenceFilesChange={setEvidenceFiles}
            existingEvidenceImages={existingEvidenceImages}
            onRemoveExistingEvidence={async (docId) => {
              try {
                const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Failed to delete document");
                setExistingEvidenceImages((prev) => prev.filter((img) => img.id !== docId));
                await load();
                toast.success("Image removed");
              } catch (e) {
                toast.error("Failed to remove image", String(e));
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
