import { Card, CardContent } from "@/components/ui/card";

type PNDHintProps = {
  message?: string;
};

export function PNDHint({
  message = "Withholding tax (หักภาษี ณ ที่จ่าย) is reported on PND 50 (monthly) or PND 53 (annual). Export and period grouping for PND will be available in a future update.",
}: PNDHintProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <CardContent className="pt-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
      </CardContent>
    </Card>
  );
}
