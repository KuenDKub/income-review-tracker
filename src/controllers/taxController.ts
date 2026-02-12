import { getYearlySummary } from "@/controllers/incomeController";
import { computeTaxPayable, type TaxPayableResult } from "@/lib/thaiPit";

const PERSONAL_ALLOWANCE = 60_000;

export type TaxSummaryResult = {
  year: number;
  yearlyGross: number;
  yearlyWithholding: number;
  yearlyNet: number;
  personalAllowance: number;
  taxableIncome: number;
  taxLiability: number;
  taxPayable: number;
  refund: boolean;
  refundAmount: number;
};

export async function getTaxSummary(year: number): Promise<TaxSummaryResult> {
  const yearly = await getYearlySummary(year);
  const result: TaxPayableResult = computeTaxPayable(
    yearly.net,
    yearly.withholding,
    PERSONAL_ALLOWANCE
  );
  return {
    year,
    yearlyGross: yearly.gross,
    yearlyWithholding: yearly.withholding,
    yearlyNet: yearly.net,
    personalAllowance: PERSONAL_ALLOWANCE,
    taxableIncome: result.taxableIncome,
    taxLiability: result.taxLiability,
    taxPayable: result.taxPayable,
    refund: result.refund,
    refundAmount: result.refundAmount,
  };
}
