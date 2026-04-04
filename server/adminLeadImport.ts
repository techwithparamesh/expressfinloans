import ExcelJS from "exceljs";
import type { InsertInsuranceLead, InsertLead } from "@shared/schema";
import type { IStorage } from "./storage";

const MAX_TOTAL_ROWS = 4000;

/** Mirrors POST /api/staff/leads validation for date of birth. */
function validateDateOfBirthAndAge(dobStr: string | null | undefined): string | null {
  if (dobStr == null || dobStr === "") return "Date of birth is required";
  const d = new Date(dobStr);
  if (Number.isNaN(d.getTime())) return "Invalid date of birth";
  const normalized = d.toISOString().slice(0, 10);
  if (normalized !== dobStr) return "Invalid date of birth";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  if (age < 18) return "Age must be at least 18 years";
  if (age > 70) return "Age must not exceed 70 years";
  return null;
}

function normHeader(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function cellStr(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value == null) return "";
  const v = cell.value as unknown;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && v !== null && "richText" in v) {
    const rt = (v as { richText?: { text: string }[] }).richText;
    return Array.isArray(rt) ? rt.map((x) => x.text).join("") : "";
  }
  if (typeof v === "object" && v !== null && "text" in v) return String((v as { text: string }).text);
  if (typeof v === "object" && v !== null && "result" in v) {
    const r = (v as { result?: unknown }).result;
    if (r instanceof Date) return r.toISOString().slice(0, 10);
    if (r != null) return String(r);
  }
  return String(v);
}

/** Parse Excel / string into YYYY-MM-DD when possible. */
function cellDateYmd(cell: ExcelJS.Cell | undefined): string | null {
  if (!cell || cell.value == null || cell.value === "") return null;
  const v = cell.value as unknown;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = cellStr(cell).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      const dt = new Date(y, mo - 1, d);
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  }
  return null;
}

function strOrNull(cell: ExcelJS.Cell | undefined, maxLen?: number): string | null {
  const t = cellStr(cell).trim();
  if (!t) return null;
  if (maxLen != null && t.length > maxLen) return t.slice(0, maxLen);
  return t;
}

function colFor(headerMap: Map<string, number>, ...names: string[]): number | undefined {
  for (const n of names) {
    const c = headerMap.get(normHeader(n));
    if (c !== undefined) return c;
  }
  return undefined;
}

function buildHeaderMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  const row = sheet.getRow(1);
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const h = normHeader(cellStr(cell));
    if (h) map.set(h, colNumber);
  });
  return map;
}

export type ImportRowError = { sheet: string; row: number; kind: "loan" | "insurance" | "sheet"; message: string };

export type AdminLeadImportResult = {
  dryRun: boolean;
  /** Rows that passed validation (would be inserted on a real run). */
  loansReady: number;
  insuranceReady: number;
  loansInserted: number;
  insuranceInserted: number;
  loansSkipped: number;
  insuranceSkipped: number;
  errors: ImportRowError[];
  sheetsSkipped: string[];
};

type SheetMode = "leads" | "insurance" | "mixed" | "skip";

function classifySheet(sheetName: string, headerMap: Map<string, number>): { mode: SheetMode; message?: string } {
  const n = sheetName.trim().toLowerCase();
  if (["summary", "attendance", "leave", "leave requests"].includes(n)) return { mode: "skip" };
  if (n === "leads") return { mode: "leads" };
  if (n === "insurance leads") return { mode: "insurance" };

  const hasLt = headerMap.has("loan type");
  const hasIt = headerMap.has("insurance type");
  const hasRecord = headerMap.has("record type");

  if (hasLt && hasIt) {
    if (hasRecord) return { mode: "mixed" };
    return {
      mode: "skip",
      message:
        'Has both "Loan Type" and "Insurance Type" columns. Add a "Record Type" column (loan or insurance per row) or use separate sheets named "Leads" and "Insurance Leads".',
    };
  }
  if (hasLt && !hasIt) return { mode: "leads" };
  if (hasIt && !hasLt) return { mode: "insurance" };
  return { mode: "skip" };
}

function parseRecordType(raw: string): "loan" | "insurance" | null {
  const x = raw.trim().toLowerCase();
  if (["loan", "lead", "leads"].includes(x)) return "loan";
  if (["insurance", "ins"].includes(x)) return "insurance";
  return null;
}

async function buildEmployeeNumberToIdMap(storage: IStorage): Promise<Map<string, string>> {
  const staff = await storage.listEmployees();
  const m = new Map<string, string>();
  for (const u of staff) {
    const num = String((u as { employeeNumber?: string | null }).employeeNumber ?? "").trim();
    if (num) m.set(num, u.id);
  }
  return m;
}

function resolveEmployeeId(
  raw: string,
  empMap: Map<string, string>
): { id: string } | { error: string } {
  const key = raw.trim();
  if (!key) return { error: "Employee ID is required" };
  const id = empMap.get(key);
  if (!id) return { error: `Unknown Employee ID: ${key}` };
  return { id };
}

function validateAndBuildLoan(
  row: ExcelJS.Row,
  headerMap: Map<string, number>,
  employeeId: string,
  dateStr: string
): { data: InsertLead } | { error: string } {
  const g = (aliases: string[]) => {
    const c = colFor(headerMap, ...aliases);
    return c !== undefined ? row.getCell(c) : undefined;
  };

  const dateOfBirth = cellDateYmd(g(["dob", "date of birth"])) ?? strOrNull(g(["dob", "date of birth"])) ?? null;
  const dobNorm =
    dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      ? dateOfBirth
      : dateOfBirth
        ? (() => {
            const d = new Date(dateOfBirth);
            return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
          })()
        : null;

  const dobErr = validateDateOfBirthAndAge(dobNorm);
  if (dobErr) return { error: dobErr };

  const loanType = strOrNull(g(["loan type"]));
  if (!loanType?.trim()) return { error: "Loan type is required" };
  const subLoanType = strOrNull(g(["sub type"]));
  if (!subLoanType?.trim()) return { error: "Sub loan type is required" };
  const incomeType = strOrNull(g(["income type"]));
  if (!incomeType?.trim()) return { error: "Income type is required" };
  const customerPhone = strOrNull(g(["phone"]));
  if (!customerPhone?.trim()) return { error: "Contact number is required" };

  const data = {
    employeeId,
    date: dateStr,
    customerName: strOrNull(g(["customer name"])),
    dateOfBirth: dobNorm,
    customerPhone,
    customerEmail: strOrNull(g(["email"])),
    location: strOrNull(g(["location"])),
    loanType,
    subLoanType,
    incomeType,
    incomeComments: strOrNull(g(["income comments"])),
    amount: strOrNull(g(["request amount"])),
    cibil: strOrNull(g(["cibil"])),
    docsCollected: null,
    companyLogged: strOrNull(g(["company logged"])),
    applicationNumber: strOrNull(g(["application no", "application number"])),
    tenure: strOrNull(g(["tenure"])),
    roi: strOrNull(g(["roi"])),
    loanDisbursed: strOrNull(g(["disbursed amount"])),
    loanSanctionedAt: cellDateYmd(g(["sanctioned at"])) ?? null,
    loanDisbursedAt: cellDateYmd(g(["disbursed at"])) ?? null,
    status: strOrNull(g(["status"])) ?? "open",
    notes: strOrNull(g(["notes"])),
    formLocation: strOrNull(g(["form location"]), 500) ?? undefined,
    payoutPercent: strOrNull(g(["payout %", "payout percent"])),
    payoutAmount: strOrNull(g(["payout amount"])),
    reconsil: strOrNull(g(["reconsil"])),
    paymentStatus: strOrNull(g(["payment status"])),
  } as unknown as InsertLead;

  return { data };
}

function validateAndBuildInsurance(
  row: ExcelJS.Row,
  headerMap: Map<string, number>,
  employeeId: string,
  dateStr: string
): { data: InsertInsuranceLead } | { error: string } {
  const g = (aliases: string[]) => {
    const c = colFor(headerMap, ...aliases);
    return c !== undefined ? row.getCell(c) : undefined;
  };

  const dateOfBirth = cellDateYmd(g(["dob", "date of birth"])) ?? null;
  const dobNorm =
    dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      ? dateOfBirth
      : dateOfBirth
        ? (() => {
            const d = new Date(dateOfBirth);
            return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
          })()
        : null;

  const dobErr = validateDateOfBirthAndAge(dobNorm);
  if (dobErr) return { error: dobErr };

  const contactNum = strOrNull(g(["contact", "phone", "contact num"]));
  if (!contactNum?.trim()) return { error: "Contact number is required" };

  const data = {
    employeeId,
    date: dateStr,
    customerName: strOrNull(g(["customer name"])),
    dateOfBirth: dobNorm,
    contactNum,
    mailId: strOrNull(g(["email", "mail id"])),
    location: strOrNull(g(["location"])),
    insuranceType: strOrNull(g(["insurance type"])),
    insuranceCategory: strOrNull(g(["category"])),
    insuranceProductType: strOrNull(g(["product type"])),
    insuranceProductTypeOther: strOrNull(g(["product type other"])),
    vehicleNumber: strOrNull(g(["vehicle no", "vehicle number"])),
    insuranceSubtype: strOrNull(g(["subtype"])),
    insuranceSubtypeOther: strOrNull(g(["subtype other"])),
    profileType: strOrNull(g(["profile type"])),
    profileComments: strOrNull(g(["profile comments"])),
    businessType: strOrNull(g(["business type"])),
    businessTypeComments: strOrNull(g(["business comments", "business type comments"])),
    paymentMode: strOrNull(g(["payment mode"])),
    paymentModeComments: strOrNull(g(["payment mode comments"])),
    paymentDoneBy: strOrNull(g(["payment done by"])),
    paymentDoneByComments: strOrNull(g(["payment done by comments"])),
    incomeType: strOrNull(g(["income type"])),
    premiumQuoted: strOrNull(g(["premium quoted"])),
    premiumCollected: strOrNull(g(["premium collected"])),
    netPremium: strOrNull(g(["net premium"])),
    difference: strOrNull(g(["difference"])),
    miscellaneousExpenses: strOrNull(g(["misc expenses", "miscellaneous expenses"])),
    status: strOrNull(g(["status"])) ?? "open",
    notes: strOrNull(g(["notes"])),
    formLocation: strOrNull(g(["form location"]), 500) ?? undefined,
    policyNumber: strOrNull(g(["policy number"]), 100),
    policyStartDate: cellDateYmd(g(["policy start", "policy start date"])),
    policyEndDate: cellDateYmd(g(["policy end", "policy end date"])),
    collectedPremium: strOrNull(g(["collected premium"])),
    actualPremium: strOrNull(g(["actual premium"])),
    finalRemarks: strOrNull(g(["final remarks"]), 500),
  } as unknown as InsertInsuranceLead;

  return { data };
}

function rowHasAnyData(row: ExcelJS.Row, cols: number[]): boolean {
  for (const c of cols) {
    if (cellStr(row.getCell(c)).trim()) return true;
  }
  return false;
}

export async function buildImportTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const leadHeaders = [
    "Employee ID",
    "Employee Name",
    "Date",
    "Customer Name",
    "DOB",
    "Phone",
    "Email",
    "Location",
    "Loan Type",
    "Sub Type",
    "Income Type",
    "Income Comments",
    "Request Amount",
    "CIBIL",
    "Company Logged",
    "Application No",
    "Tenure",
    "ROI",
    "Disbursed Amount",
    "Sanctioned At",
    "Disbursed At",
    "Status",
    "Notes",
    "Form Location",
    "Payout %",
    "Payout Amount",
    "Reconsil",
    "Payment Status",
  ];
  const insHeaders = [
    "Employee ID",
    "Employee Name",
    "Date",
    "Customer Name",
    "DOB",
    "Contact",
    "Email",
    "Location",
    "Insurance Type",
    "Category",
    "Product Type",
    "Product Type Other",
    "Vehicle No",
    "Subtype",
    "Subtype Other",
    "Profile Type",
    "Profile Comments",
    "Business Type",
    "Business Comments",
    "Payment Mode",
    "Payment Mode Comments",
    "Payment Done By",
    "Payment Done By Comments",
    "Income Type",
    "Premium Quoted",
    "Premium Collected",
    "Net Premium",
    "Difference",
    "Misc Expenses",
    "Status",
    "Notes",
    "Form Location",
    "Policy Number",
    "Policy Start",
    "Policy End",
    "Collected Premium",
    "Actual Premium",
    "Final Remarks",
  ];

  const leadsSheet = workbook.addWorksheet("Leads");
  leadsSheet.addRow(leadHeaders);
  leadsSheet.getRow(1).font = { bold: true };

  const insSheet = workbook.addWorksheet("Insurance Leads");
  insSheet.addRow(insHeaders);
  insSheet.getRow(1).font = { bold: true };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export class AdminLeadImportParseError extends Error {
  constructor() {
    super("IMPORT_XLSX_INVALID");
    this.name = "AdminLeadImportParseError";
  }
}

export async function runAdminLeadImport(
  fileBuffer: Buffer,
  options: { storage: IStorage; dryRun: boolean }
): Promise<AdminLeadImportResult> {
  const { storage, dryRun } = options;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer);
  } catch {
    throw new AdminLeadImportParseError();
  }

  const empMap = await buildEmployeeNumberToIdMap(storage);
  const errors: ImportRowError[] = [];
  const sheetsSkipped: string[] = [];

  type PendingLoan = { sheet: string; row: number; data: InsertLead };
  type PendingIns = { sheet: string; row: number; data: InsertInsuranceLead };
  const pendingLoans: PendingLoan[] = [];
  const pendingIns: PendingIns[] = [];

  let totalRowsSeen = 0;
  let abortedOverLimit = false;

  sheetLoop: for (const sheet of workbook.worksheets) {
    const headerMap = buildHeaderMap(sheet);
    const { mode, message } = classifySheet(sheet.name, headerMap);

    if (mode === "skip") {
      if (message) sheetsSkipped.push(`${sheet.name}: ${message}`);
      continue;
    }

    const empCol = colFor(headerMap, "employee id");
    if (empCol === undefined) {
      errors.push({ sheet: sheet.name, row: 1, kind: "sheet", message: 'Missing "Employee ID" column in header row.' });
      continue;
    }

    const dataCols = Array.from(headerMap.values());
    const recordCol = headerMap.get("record type");

    const rowCount = sheet.actualRowCount || sheet.rowCount;
    for (let r = 2; r <= rowCount; r++) {
      const row = sheet.getRow(r);
      if (!rowHasAnyData(row, dataCols)) continue;

      totalRowsSeen++;
      if (totalRowsSeen > MAX_TOTAL_ROWS) {
        errors.push({
          sheet: sheet.name,
          row: r,
          kind: "sheet",
          message: `Import stopped: more than ${MAX_TOTAL_ROWS} data rows across the workbook.`,
        });
        abortedOverLimit = true;
        break sheetLoop;
      }

      const empRaw = cellStr(row.getCell(empCol));
      const resolved = resolveEmployeeId(empRaw, empMap);
      if ("error" in resolved) {
        errors.push({ sheet: sheet.name, row: r, kind: mode === "insurance" ? "insurance" : "loan", message: resolved.error });
        continue;
      }

      const dateCell = colFor(headerMap, "date") !== undefined ? row.getCell(colFor(headerMap, "date")!) : undefined;
      const dateStr = cellDateYmd(dateCell) ?? todayStr();

      let rowMode: "leads" | "insurance" = mode === "mixed" ? "leads" : mode;
      if (mode === "mixed") {
        if (recordCol === undefined) {
          errors.push({ sheet: sheet.name, row: r, kind: "sheet", message: 'Record Type column missing for mixed sheet.' });
          continue;
        }
        const rt = parseRecordType(cellStr(row.getCell(recordCol)));
        if (!rt) {
          errors.push({
            sheet: sheet.name,
            row: r,
            kind: "sheet",
            message: 'Record Type must be "loan" or "insurance" (or lead / ins).',
          });
          continue;
        }
        rowMode = rt === "loan" ? "leads" : "insurance";
      }

      if (rowMode === "leads") {
        const built = validateAndBuildLoan(row, headerMap, resolved.id, dateStr);
        if ("error" in built) {
          errors.push({ sheet: sheet.name, row: r, kind: "loan", message: built.error });
          continue;
        }
        pendingLoans.push({ sheet: sheet.name, row: r, data: built.data });
      } else {
        const built = validateAndBuildInsurance(row, headerMap, resolved.id, dateStr);
        if ("error" in built) {
          errors.push({ sheet: sheet.name, row: r, kind: "insurance", message: built.error });
          continue;
        }
        pendingIns.push({ sheet: sheet.name, row: r, data: built.data });
      }
    }
  }

  if (abortedOverLimit) {
    return {
      dryRun,
      loansReady: pendingLoans.length,
      insuranceReady: pendingIns.length,
      loansInserted: 0,
      insuranceInserted: 0,
      loansSkipped: 0,
      insuranceSkipped: 0,
      errors,
      sheetsSkipped,
    };
  }

  if (dryRun) {
    return {
      dryRun: true,
      loansReady: pendingLoans.length,
      insuranceReady: pendingIns.length,
      loansInserted: 0,
      insuranceInserted: 0,
      loansSkipped: 0,
      insuranceSkipped: 0,
      errors,
      sheetsSkipped,
    };
  }

  const attendanceKeys = new Set<string>();
  let loansInserted = 0;
  let insuranceInserted = 0;

  for (const p of pendingLoans) {
    try {
      await storage.createLead(p.data);
      loansInserted++;
      attendanceKeys.add(`${p.data.employeeId}|${p.data.date}`);
    } catch (e) {
      errors.push({
        sheet: p.sheet,
        row: p.row,
        kind: "loan",
        message: e instanceof Error ? e.message : "Failed to insert loan lead",
      });
    }
  }

  for (const p of pendingIns) {
    try {
      await storage.createInsuranceLead(p.data);
      insuranceInserted++;
    } catch (e) {
      errors.push({
        sheet: p.sheet,
        row: p.row,
        kind: "insurance",
        message: e instanceof Error ? e.message : "Failed to insert insurance lead",
      });
    }
  }

  for (const key of Array.from(attendanceKeys)) {
    const pipe = key.indexOf("|");
    const employeeId = key.slice(0, pipe);
    const dateStr = key.slice(pipe + 1);
    try {
      const count = await storage.getLeadsCountForEmployeeOnDate(employeeId, dateStr);
      await storage.updateAttendanceFromLeadsCount(employeeId, dateStr, count);
    } catch {
      /* non-fatal */
    }
  }

  return {
    dryRun: false,
    loansReady: pendingLoans.length,
    insuranceReady: pendingIns.length,
    loansInserted,
    insuranceInserted,
    loansSkipped: pendingLoans.length - loansInserted,
    insuranceSkipped: pendingIns.length - insuranceInserted,
    errors,
    sheetsSkipped,
  };
}
