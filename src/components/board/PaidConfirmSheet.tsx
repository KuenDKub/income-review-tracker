"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type PaidConfirmSheetProps = {
  open: boolean;
  saving: boolean;
  paymentDate: string;
  minPaymentDate?: string;
  files: File[];
  onPaymentDateChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onCancel: () => void;
  onSave: () => void;
};

function PaidForm({
  saving,
  paymentDate,
  minPaymentDate,
  files,
  onPaymentDateChange,
  onFilesChange,
}: Pick<
  PaidConfirmSheetProps,
  | "saving"
  | "paymentDate"
  | "minPaymentDate"
  | "files"
  | "onPaymentDateChange"
  | "onFilesChange"
>) {
  const t = useTranslations("jobs");
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="paid-payment-date" className="text-sm font-medium">
          {t("paymentDate")}
        </label>
        <Input
          id="paid-payment-date"
          type="date"
          className="min-h-[44px]"
          value={paymentDate}
          min={minPaymentDate}
          onChange={(e) => onPaymentDateChange(e.target.value)}
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">{t("evidenceOptional")}</div>
        <FileUpload
          value={files}
          onChange={onFilesChange}
          accept="image/*"
          multiple
          className={saving ? "opacity-70 pointer-events-none" : undefined}
        />
      </div>
    </div>
  );
}

export function PaidConfirmSheet(props: PaidConfirmSheetProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { open, saving, onCancel, onSave } = props;

  const handleOpenChange = (next: boolean) => {
    if (!next) onCancel();
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-[44px]"
        onClick={onCancel}
        disabled={saving}
      >
        {tCommon("cancel")}
      </Button>
      <Button
        type="button"
        className="min-h-[44px]"
        onClick={onSave}
        loading={saving}
      >
        {tCommon("save")}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={!saving}>
          <DialogHeader>
            <DialogTitle>{t("paidDialogTitle")}</DialogTitle>
            <DialogDescription>{t("paidDialogDescription")}</DialogDescription>
          </DialogHeader>
          <PaidForm {...props} />
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-3">
        <SheetHeader className="px-4 pt-1 pb-0">
          <SheetTitle className="text-base">{t("paidDialogTitle")}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t("paidDialogDescription")}
          </p>
        </SheetHeader>
        <div className="min-h-0 overflow-y-auto px-4">
          <PaidForm {...props} />
        </div>
        <div className="flex gap-2 border-t px-4 py-3 [&>button]:flex-1">
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}
