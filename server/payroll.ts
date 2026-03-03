/**
 * Payroll calculation (Option B: rules + inputs, app calculates).
 * Uses salary structure + payroll entry to compute earnings, deductions, net pay.
 */

function parseDecimal(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isNaN(v) ? 0 : v;
  const s = String(v).replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

export interface SalaryStructureRow {
  basic?: string | number | null;
  hraPercent?: string | number | null;
  specialAllowance?: string | number | null;
  conveyance?: string | number | null;
  medical?: string | number | null;
  employeePfPercent?: string | number | null;
  ptAmount?: string | number | null;
}

export interface PayrollEntryRow {
  incentives?: string | number | null;
  deductionsOther?: string | number | null;
  tdsAmount?: string | number | null;
  absentDays?: number | null;
}

export interface EarningsBreakdown {
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medical: number;
  incentives: number;
}

export interface DeductionsBreakdown {
  pf: number;
  pt: number;
  tds: number;
  other: number;
}

export interface ComputedPayslip {
  earningsBreakdown: EarningsBreakdown;
  deductionsBreakdown: DeductionsBreakdown;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
}

const PF_CAP_BASE = 15000; // PF statutory cap on basic (₹15,000)

export function computePayslip(structure: SalaryStructureRow, entry: PayrollEntryRow): ComputedPayslip {
  const basic = parseDecimal(structure.basic);
  const hraPercent = parseDecimal(structure.hraPercent);
  const specialAllowance = parseDecimal(structure.specialAllowance);
  const conveyance = parseDecimal(structure.conveyance);
  const medical = parseDecimal(structure.medical);
  const employeePfPercent = parseDecimal(structure.employeePfPercent) || 12;
  const ptAmount = parseDecimal(structure.ptAmount);
  const incentives = parseDecimal(entry.incentives);
  const deductionsOther = parseDecimal(entry.deductionsOther);
  const tdsAmount = parseDecimal(entry.tdsAmount);

  const hra = (basic * hraPercent) / 100;
  const pfBase = Math.min(basic, PF_CAP_BASE);
  const pf = (pfBase * employeePfPercent) / 100;

  const earningsBreakdown: EarningsBreakdown = {
    basic,
    hra,
    specialAllowance,
    conveyance,
    medical,
    incentives,
  };

  const deductionsBreakdown: DeductionsBreakdown = {
    pf,
    pt: ptAmount,
    tds: tdsAmount,
    other: deductionsOther,
  };

  const totalEarnings =
    earningsBreakdown.basic +
    earningsBreakdown.hra +
    earningsBreakdown.specialAllowance +
    earningsBreakdown.conveyance +
    earningsBreakdown.medical +
    earningsBreakdown.incentives;

  const totalDeductions =
    deductionsBreakdown.pf +
    deductionsBreakdown.pt +
    deductionsBreakdown.tds +
    deductionsBreakdown.other;

  const netPay = totalEarnings - totalDeductions;

  return {
    earningsBreakdown,
    deductionsBreakdown,
    totalEarnings,
    totalDeductions,
    netPay,
  };
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);
}
