"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  existingImages?: Array<{ id: string; url: string }>;
  onRemoveExisting?: (id: string) => void;
};

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  multiple = true,
  className,
  existingImages = [],
  onRemoveExisting,
}: FileUploadProps) {
  const t = useTranslations("ui");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = React.useState<string[]>([]);

  React.useEffect(() => {
    const newPreviews: string[] = [];
    value.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        newPreviews.push(url);
      }
    });
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
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
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {multiple ? t("uploadImages") : t("uploadImage")}
        </Button>
      </div>

      {(previews.length > 0 || existingImages.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {existingImages.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.url}
                alt={t("existingEvidence")}
                className="w-full h-32 object-cover rounded-md border"
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.id)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {previews.map((preview, index) => (
            <div key={`new-${index}`} className="relative group">
              <img
                src={preview}
                alt={t("preview", { n: index + 1 })}
                className="w-full h-32 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
