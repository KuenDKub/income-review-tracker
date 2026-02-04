import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type YearlySummaryCardProps = {
  gross: number;
  withholding: number;
  net: number;
};

export function YearlySummaryCard({
  gross,
  withholding,
  net,
}: YearlySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          Gross: <span className="font-medium">{gross.toLocaleString("th-TH")} THB</span>
        </p>
        <p>
          Withholding: <span className="font-medium">{withholding.toLocaleString("th-TH")} THB</span>
        </p>
        <p>
          Net: <span className="font-medium">{net.toLocaleString("th-TH")} THB</span>
        </p>
      </CardContent>
    </Card>
  );
}
