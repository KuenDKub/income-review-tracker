import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WithholdingSummaryProps = {
  periodLabel: string;
  totalWithholding: number;
  totalGross: number;
  totalNet: number;
};

export function WithholdingSummary({
  periodLabel,
  totalWithholding,
  totalGross,
  totalNet,
}: WithholdingSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Withholding tax summary — {periodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          Total gross: <span className="font-medium">{totalGross.toLocaleString("th-TH")} THB</span>
        </p>
        <p>
          Total withholding (หักภาษี ณ ที่จ่าย):{" "}
          <span className="font-medium">{totalWithholding.toLocaleString("th-TH")} THB</span>
        </p>
        <p>
          Total net: <span className="font-medium">{totalNet.toLocaleString("th-TH")} THB</span>
        </p>
      </CardContent>
    </Card>
  );
}
