"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  /** Overrides the default upload button label (e.g. for non-image files). */
  buttonLabel?: string;
  existingImages?: Array<{ id: string; url: string }>;
  onRemoveExisting?: (id: string) => void;
};

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"];

/** True when a URL/path points at an image we can render as a thumbnail. */
function isImageUrl(url: string): boolean {
  const clean = url.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 && IMAGE_EXT.includes(clean.slice(dot + 1).toLowerCase());
}

/** Last path segment of a URL, for labelling non-image attachments. */
function fileNameFromUrl(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  return decodeURIComponent(clean.split("/").pop() || clean);
}

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  multiple = true,
  className,
  buttonLabel,
  existingImages = [],
  onRemoveExisting,
}: FileUploadProps) {
  const t = useTranslations("ui");
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Object URLs only for image files; non-image entries carry a null preview so
  // the grid can fall back to a labelled file card.
  const [previews, setPreviews] = React.useState<Array<string | null>>([]);

  React.useEffect(() => {
    const urls: Array<string | null> = value.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    );
    setPreviews(urls);

    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...value, ...files]);
    } else {
      onChange(files);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {buttonLabel ?? (multiple ? t("uploadImages") : t("uploadImage"))}
        </Button>
      </div>

      {(value.length > 0 || existingImages.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {existingImages.map((img) => (
            <div key={img.id} className="relative group">
              {isImageUrl(img.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={t("existingEvidence")}
                  className="h-32 w-full rounded-md border object-cover"
                />
              ) : (
                <a
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border bg-muted/30 p-2 text-center text-muted-foreground hover:border-primary/50"
                >
                  <FileText className="h-8 w-8" />
                  <span className="line-clamp-2 text-xs break-all">
                    {fileNameFromUrl(img.url)}
                  </span>
                </a>
              )}
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.id)}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-100 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {value.map((file, index) => (
            <div key={`new-${index}`} className="relative group">
              {previews[index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[index] as string}
                  alt={t("preview", { n: index + 1 })}
                  className="h-32 w-full rounded-md border object-cover"
                />
              ) : (
                <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border bg-muted/30 p-2 text-center text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <span className="line-clamp-2 text-xs break-all">
                    {file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-100 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:hover)]:opacity-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
