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
  monthlyCtc?: string | number | null;
  basic?: string | number | null;
  hraPercent?: string | number | null;
  specialAllowance?: string | number | null;
  conveyance?: string | number | null;
  medical?: string | number | null;
  extraAllowancesJson?: string | null;
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
  extraAllowances: { label: string; amount: number }[];
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
  workingDaysInMonth?: number;
  daysPresent?: number;
}

const PF_CAP_BASE = 15000;

/** Weekdays (Mon–Fri) in the given month. month is 1-based. */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  let count = 0;
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    if (d.getDay() >= 1 && d.getDay() <= 5) count++;
  }
  return count;
}

export interface ProrationOptions {
  workingDaysInMonth: number;
  daysPresent: number;
}

export function computePayslip(
  structure: SalaryStructureRow,
  entry: PayrollEntryRow,
  proration?: ProrationOptions
): ComputedPayslip {
  const basic = parseDecimal(structure.basic);
  const hraPercent = parseDecimal(structure.hraPercent);
  const specialAllowance = parseDecimal(structure.specialAllowance);
  const conveyance = parseDecimal(structure.conveyance);
  const medical = parseDecimal(structure.medical);
  const employeePfPercent = parseDecimal(structure.employeePfPercent) || 12;
  const ptAmount = parseDecimal(structure.ptAmount);
  const incentives = parseDecimal(entry.incentives);
  let extraAllowances: { label: string; amount: number }[] = [];
  try {
    const parsed = structure.extraAllowancesJson ? JSON.parse(structure.extraAllowancesJson) : [];
    if (Array.isArray(parsed)) {
      extraAllowances = parsed
        .map((x) => ({
          label: String((x as any)?.label || "").trim(),
          amount: parseDecimal((x as any)?.amount),
        }))
        .filter((x) => x.label && x.amount > 0);
    }
  } catch {
    extraAllowances = [];
  }
  const deductionsOther = parseDecimal(entry.deductionsOther);
  const tdsAmount = parseDecimal(entry.tdsAmount);

  const hra = (basic * hraPercent) / 100;

  let factor = 1;
  const workingDaysInMonth = proration?.workingDaysInMonth ?? 0;
  const daysPresent = proration?.daysPresent ?? 0;
  if (proration && workingDaysInMonth > 0 && daysPresent >= 0) {
    factor = Math.min(1, daysPresent / workingDaysInMonth);
  }

  const basicProrated = basic * factor;
  const hraProrated = hra * factor;
  const specialAllowanceProrated = specialAllowance * factor;
  const conveyanceProrated = conveyance * factor;
  const medicalProrated = medical * factor;
  const incentivesProrated = incentives * factor;
  const extraAllowancesProrated = extraAllowances.map((x) => ({
    label: x.label,
    amount: Math.round(x.amount * factor * 100) / 100,
  }));

  const pfBase = Math.min(basicProrated, PF_CAP_BASE);
  const pf = (pfBase * employeePfPercent) / 100;

  const earningsBreakdown: EarningsBreakdown = {
    basic: Math.round(basicProrated * 100) / 100,
    hra: Math.round(hraProrated * 100) / 100,
    specialAllowance: Math.round(specialAllowanceProrated * 100) / 100,
    conveyance: Math.round(conveyanceProrated * 100) / 100,
    medical: Math.round(medicalProrated * 100) / 100,
    extraAllowances: extraAllowancesProrated,
    incentives: Math.round(incentivesProrated * 100) / 100,
  };

  const deductionsBreakdown: DeductionsBreakdown = {
    pf: Math.round(pf * 100) / 100,
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
    earningsBreakdown.extraAllowances.reduce((s, x) => s + x.amount, 0) +
    earningsBreakdown.incentives;

  const totalDeductions =
    deductionsBreakdown.pf +
    deductionsBreakdown.pt +
    deductionsBreakdown.tds +
    deductionsBreakdown.other;

  const netPay = Math.round((totalEarnings - totalDeductions) * 100) / 100;

  const result: ComputedPayslip = {
    earningsBreakdown,
    deductionsBreakdown,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay,
  };
  if (proration && workingDaysInMonth > 0) {
    result.workingDaysInMonth = workingDaysInMonth;
    result.daysPresent = daysPresent;
  }
  return result;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);
}
