"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, FileText, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

type BriefDoc = {
  id: string;
  filePath: string;
  kind: string;
  notes: string | null;
};

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp"];
const OFFICE_EXT = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

type FileType = "image" | "pdf" | "office" | "other";

/** Lower-case file extension from a URL or path, ignoring query/hash. */
function fileExt(path: string): string {
  const clean = path.split("?")[0].split("#")[0];
  const seg = clean.split("/").pop() ?? "";
  const dot = seg.lastIndexOf(".");
  return dot >= 0 ? seg.slice(dot + 1).toLowerCase() : "";
}

function fileType(ext: string): FileType {
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXT.includes(ext)) return "office";
  return "other";
}

/**
 * Microsoft Office Online viewer — renders doc/docx/xls/xlsx/ppt/pptx inside an
 * iframe without downloading. Requires a publicly reachable file URL (our S3
 * bucket is public). https://view.officeapps.live.com/op/embed.aspx?src=...
 */
function officeEmbedUrl(url: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    url,
  )}`;
}

/**
 * Upload + preview + delete the original brief files pinned to a job (the
 * screenshots / PDFs / Word docs the customer sent, stored as documents with
 * kind = "brief"). Tap a tile to preview in a dialog — never download.
 * Designed for touch: large tiles, 44px+ tap targets.
 */
export function BriefAttachments({
  jobId,
  files,
  onChanged,
}: {
  jobId: string;
  files: BriefDoc[];
  onChanged: () => Promise<void> | void;
}) {
  const t = useTranslations("jobs");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<BriefDoc | null>(null);

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (picked.length === 0) return;
    setUploading(true);
    try {
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error(t("uploadError"));
        const uj = await up.json();
        const doc = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewJobId: jobId,
            kind: "brief",
            filePath: uj.filePath,
          }),
        });
        if (!doc.ok) throw new Error(t("uploadError"));
      }
      toast.success(t("briefFilesAdded"));
      await onChanged();
    } catch (err) {
      toast.error(t("uploadError"), String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("deleteDocError"));
      toast.success(t("deleteDocSuccess"));
      if (preview?.id === id) setPreview(null);
      await onChanged();
    } catch (err) {
      toast.error(t("deleteDocError"), String(err));
    } finally {
      setDeletingId(null);
    }
  };

  const previewExt = preview ? fileExt(preview.filePath) : "";
  const previewType = fileType(previewExt);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t("briefFiles")}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFiles}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {t("addBriefFiles")}
        </Button>
      </div>

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((doc) => {
            const ext = fileExt(doc.filePath);
            const type = fileType(ext);
            return (
              <li key={doc.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setPreview(doc)}
                  className="block aspect-square w-full cursor-pointer overflow-hidden rounded-lg border bg-muted/30 outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {type === "image" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.filePath}
                        alt={t("filePreview")}
                        className="h-full w-full object-cover"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white/0 transition-colors group-hover:bg-black/30 group-hover:text-white">
                        <Eye className="h-6 w-6" />
                      </span>
                    </>
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center text-muted-foreground">
                      <FileText className="h-9 w-9" />
                      <span className="text-xs font-medium uppercase">
                        {ext || t("openFile")}
                      </span>
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="absolute right-1.5 top-1.5 z-10 rounded-full bg-destructive p-2 text-destructive-foreground opacity-90 shadow-sm transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                  aria-label={t("deleteFile")}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="flex h-[92dvh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b p-3 pr-14 text-left">
            <DialogTitle className="truncate text-sm font-medium">
              {previewExt ? `${previewExt.toUpperCase()} · ` : ""}
              {t("filePreview")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("filePreview")}
            </DialogDescription>
            {preview && (
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <a
                  href={preview.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("openOriginal")}</span>
                </a>
              </Button>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 bg-muted/30">
            {preview && previewType === "image" && (
              <div className="flex h-full w-full items-center justify-center overflow-auto p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.filePath}
                  alt={t("filePreview")}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            {preview && previewType === "pdf" && (
              <iframe
                src={preview.filePath}
                title={t("filePreview")}
                className="h-full w-full"
              />
            )}
            {preview && previewType === "office" && (
              <iframe
                src={officeEmbedUrl(preview.filePath)}
                title={t("filePreview")}
                className="h-full w-full"
              />
            )}
            {preview && previewType === "other" && (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("previewUnavailable")}
                </p>
                <Button variant="outline" asChild>
                  <a
                    href={preview.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("openOriginal")}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
