import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format date for display: DD/MM/YYYY. Accepts YYYY-MM-DD or ISO string. */
export function formatDateDdMmYyyy(val: string | null | undefined): string | null {
  if (val == null || String(val).trim() === "") return null;
  const s = String(val).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

/** Disbursed date for disbursed leads, sanctioned date for sanctioned leads, otherwise the lead date. */
export function getLeadEffectiveDate(l: {
  date?: string | null;
  status?: string | null;
  loanSanctionedAt?: string | null;
  loanDisbursedAt?: string | null;
}): string | null {
  const status = String(l.status ?? "").trim().toLowerCase();
  if (status === "disbursed" && l.loanDisbursedAt) return String(l.loanDisbursedAt).slice(0, 10);
  if (status === "sanctioned" && l.loanSanctionedAt) return String(l.loanSanctionedAt).slice(0, 10);
  return l.date ? String(l.date).slice(0, 10) : null;
}
