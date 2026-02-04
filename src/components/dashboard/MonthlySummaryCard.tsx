import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MonthlySummaryCardProps = {
  gross: number;
  withholding: number;
  net: number;
};

export function MonthlySummaryCard({
  gross,
  withholding,
  net,
}: MonthlySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly summary</CardTitle>
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
