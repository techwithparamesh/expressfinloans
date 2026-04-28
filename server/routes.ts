import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { randomBytes } from "node:crypto";
import path from "path";
import fs from "fs";
import passport from "passport";
import multer from "multer";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireAdminOrTeamLead } from "./auth";
import {
  AdminLeadImportParseError,
  buildImportTemplateBuffer,
  runAdminLeadImport,
} from "./adminLeadImport";
import { getClientIp, getLocationFromIp, reverseGeocode } from "./lib/geolocation";
import { computePayslip, formatCurrency, getWorkingDaysInMonth, type ComputedPayslip } from "./payroll";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const AVATARS_DIR = path.join(UPLOADS_DIR, "avatars");
const PAYSLIPS_DIR = path.join(UPLOADS_DIR, "payslips");
const OFFER_TEMPLATES_DIR = path.join(UPLOADS_DIR, "offer-templates");
const OFFER_LETTERS_DIR = path.join(UPLOADS_DIR, "offer-letters");

/** Resolve company logo path for payslips (checks .png then .jpg). Returns path if file exists. */
function getCompanyLogoPath(): string | null {
  const base = path.join(UPLOADS_DIR, "company-logo");
  for (const ext of [".png", ".jpg", ".jpeg"]) {
    const p = base + ext;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Format date for payslip display (handles ISO string or Date). */
function formatPayslipDate(d: string | Date | null | undefined): string {
  if (d == null) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Format date as DD-MM-YYYY for payslip tables. */
function formatPayslipDateDDMMYYYY(d: string | Date | null | undefined): string {
  if (d == null) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

/** Convert number to words (Indian style: Lakh, Crore). Returns e.g. "One Lakh Sixty Nine Thousand and Thirty Four Only" */
function numberToWordsInRupees(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const round = Math.round(n);
  if (round === 0) return "Zero Only";
  if (round < 0) return "Minus " + numberToWordsInRupees(-round);

  function toWords(num: number): string {
    if (num === 0) return "";
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return (tens[Math.floor(num / 10)] + " " + ones[num % 10]).trim();
    if (num < 1000) return (ones[Math.floor(num / 100)] + " Hundred " + toWords(num % 100)).trim();
    if (num < 100000) return (toWords(Math.floor(num / 1000)) + " Thousand " + toWords(num % 1000)).trim();
    if (num < 10000000) return (toWords(Math.floor(num / 100000)) + " Lakh " + toWords(num % 100000)).trim();
    return (toWords(Math.floor(num / 10000000)) + " Crore " + toWords(num % 10000000)).trim();
  }
  const s = toWords(round).replace(/\s+/g, " ").trim();
  return s ? s + " Only" : "Zero Only";
}

const LEAD_MIN_FOR_PRESENT = 2;

const adminLeadImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    if (name.endsWith(".xlsx")) cb(null, true);
    else cb(new Error("Only .xlsx files are allowed"));
  },
});

const offerTemplateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".html")) cb(null, true);
    else cb(new Error("Only .txt or .html templates are allowed"));
  },
});

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysYmd(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysLeftFromToday(endDateStr: string): number {
  const today = new Date(todayStr() + "T00:00:00");
  const end = new Date(String(endDateStr).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(today.getTime()) || Number.isNaN(end.getTime())) return -1;
  return Math.floor((end.getTime() - today.getTime()) / 86400000);
}

function normalizeYmd(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const isoPrefix = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoPrefix)) return isoPrefix;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function pickActiveApprovedResignation<T extends { status?: string; effectiveLastWorkingDay?: unknown }>(rows: T[]): { row: T; lwd: string; daysLeft: number } | null {
  let best: { row: T; lwd: string; daysLeft: number } | null = null;
  for (const row of rows) {
    if (String(row.status || "").toLowerCase() !== "approved") continue;
    const lwd = normalizeYmd(row.effectiveLastWorkingDay);
    if (!lwd) continue;
    const daysLeft = daysLeftFromToday(lwd);
    if (daysLeft < 0) continue;
    if (!best || daysLeft < best.daysLeft) {
      best = { row, lwd, daysLeft };
    }
  }
  return best;
}

function extractTemplatePlaceholders(body: string): string[] {
  const out = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(body)) !== null) {
    if (m[1]) out.add(m[1]);
  }
  return Array.from(out);
}

function renderTemplateBody(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_all, key: string) => values[key] ?? "");
}

function stripSimpleHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function getFiscalYearStart(dateStr: string): number {
  const d = new Date(String(dateStr).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return new Date().getFullYear();
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-index
  return m >= 3 ? y : y - 1; // Apr..Dec => same year, Jan..Mar => previous year
}

function getFiscalQuarterRanges(fiscalYearStart: number): Array<{ quarter: "Q1" | "Q2" | "Q3" | "Q4"; from: string; to: string }> {
  return [
    { quarter: "Q1", from: `${fiscalYearStart}-04-01`, to: `${fiscalYearStart}-06-30` },
    { quarter: "Q2", from: `${fiscalYearStart}-07-01`, to: `${fiscalYearStart}-09-30` },
    { quarter: "Q3", from: `${fiscalYearStart}-10-01`, to: `${fiscalYearStart}-12-31` },
    { quarter: "Q4", from: `${fiscalYearStart + 1}-01-01`, to: `${fiscalYearStart + 1}-03-31` },
  ];
}

function drawOfferLetterPdf(
  doc: any,
  opts: { title: string; employeeName: string; letterBody: string; generatedOn: Date }
) {
  const margin = 50;
  const body = stripSimpleHtml(opts.letterBody);
  doc.font("Helvetica-Bold").fontSize(18).text(opts.title, margin, 60, { align: "center" });
  doc.moveDown(1.2);
  doc.font("Helvetica").fontSize(10).text(`Generated on: ${opts.generatedOn.toLocaleDateString("en-IN")}`, {
    align: "right",
  });
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(11).text(`Candidate: ${opts.employeeName}`);
  doc.moveDown(1);
  doc.font("Helvetica").fontSize(11).text(body, {
    align: "left",
  });
}

function isSecondSaturday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  return d.getDay() === 6 && d.getDate() >= 8 && d.getDate() <= 14;
}

function enumerateSecondSaturdays(fromDate: string, toDate: string): string[] {
  const out: string[] = [];
  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T00:00:00");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return out;
  const cur = new Date(from);
  while (cur <= to) {
    const ds = cur.toISOString().slice(0, 10);
    if (isSecondSaturday(ds)) out.push(ds);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Parse amount from string (handles currency symbols, commas, spaces). Returns 0 if invalid. Do not remove decimal point. */
function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const s = String(value)
    .replace(/[\s₹Rs$]/gi, "")
    .replace(/,/g, "")
    .trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Get disbursed amount from a lead (loanDisbursed or amount; camelCase/snake_case). */
function getLeadAmount(lead: { loanDisbursed?: string | null; loan_disbursed?: string | null; amount?: string | null }): number {
  const amt =
    (lead as { loanDisbursed?: string | null }).loanDisbursed ??
    (lead as { loan_disbursed?: string | null }).loan_disbursed ??
    (lead as { amount?: string | null }).amount;
  return parseAmount(amt);
}

/** Get request amount from a lead (amount field only). */
function getLeadRequestAmount(lead: { amount?: string | null }): number {
  return parseAmount((lead as any).amount);
}

/** Read assigned budget from a monthly target row (camelCase or snake_case from DB). */
function getTargetBudget(row: { assignedBudget?: string | number | null; assigned_budget?: string | number | null } | null | undefined): number {
  if (row == null) return 0;
  const v = (row as any).assignedBudget ?? (row as any).assigned_budget;
  return v != null && String(v).trim() !== "" ? parseAmount(v) : 0;
}

/** Read total budget from a company monthly target row (camelCase or snake_case from DB). */
function getCompanyBudget(row: { totalBudget?: string | number | null; total_budget?: string | number | null } | null | undefined): number {
  if (row == null) return 0;
  const v = (row as any).totalBudget ?? (row as any).total_budget;
  return v != null && String(v).trim() !== "" ? parseAmount(v) : 0;
}

/** Read assigned leads from a monthly target row (camelCase or snake_case from DB). */
function getTargetLeads(row: { assignedLeads?: number | null; assigned_leads?: number | null } | null | undefined): number {
  if (row == null) return 0;
  const v = (row as any).assignedLeads ?? (row as any).assigned_leads;
  return typeof v === "number" && !Number.isNaN(v) ? v : (typeof v === "string" ? parseInt(String(v), 10) || 0 : 0);
}

/** Get list of { month, year } (month 1-12) between fromDate and toDate (YYYY-MM-DD). */
function getMonthsInRange(fromDate: string, toDate: string): { month: number; year: number }[] {
  const out: { month: number; year: number }[] = [];
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const startY = from.getFullYear(), startM = from.getMonth() + 1;
  const endY = to.getFullYear(), endM = to.getMonth() + 1;
  for (let y = startY; y <= endY; y++) {
    const mStart = y === startY ? startM : 1;
    const mEnd = y === endY ? endM : 12;
    for (let m = mStart; m <= mEnd; m++) out.push({ month: m, year: y });
  }
  return out;
}

/** Validate date string YYYY-MM-DD and age between 18 and 70. Returns error message or null. */
function validateDateOfBirthAndAge(dobStr: string | null | undefined): string | null {
  if (dobStr == null || dobStr === "") return null;
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

/** Returns employee IDs the current user can see. Admin: null (all). Team Lead: their team member IDs. */
async function getVisibleEmployeeIds(req: express.Request): Promise<string[] | null> {
  const role = (req.user as { role?: string })?.role;
  if (role === "admin") return null;
  if (role === "team_lead") {
    const team = await storage.listEmployees({ teamLeadId: (req.user as { id: string }).id });
    return team.map((u) => u.id);
  }
  return [];
}

/** One-time tokens for Capacitor native download (no session cookie on HttpURLConnection). */
type MonthlyExportTokenRow = {
  userId: string;
  role: string;
  format: string;
  monthParam?: string;
  fromParam?: string;
  toParam?: string;
  employeeId?: string;
  exp: number;
};
const monthlyExportTokenStore = new Map<string, MonthlyExportTokenRow>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PAYSLIPS_DIR)) {
    fs.mkdirSync(PAYSLIPS_DIR, { recursive: true });
  }
  if (!fs.existsSync(OFFER_TEMPLATES_DIR)) {
    fs.mkdirSync(OFFER_TEMPLATES_DIR, { recursive: true });
  }
  if (!fs.existsSync(OFFER_LETTERS_DIR)) {
    fs.mkdirSync(OFFER_LETTERS_DIR, { recursive: true });
  }
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Redirect /staff and /admin to staff subdomain when STAFF_DOMAIN is set (e.g. staff.expressfinloans.com)
  const staffDomain = process.env.STAFF_DOMAIN?.trim().toLowerCase();
  app.get(["/staff", "/staff/*", "/admin", "/admin/*"], (req, res, next) => {
    const pathStrip = req.path.startsWith("/staff") ? req.path.slice(6) || "/" : req.path.startsWith("/admin") ? req.path.slice(6) || "/" : req.path;
    if (staffDomain && req.hostname?.toLowerCase() !== staffDomain) {
      const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
      return res.redirect(302, `${protocol}://${staffDomain}${pathStrip}`);
    }
    if (!staffDomain && req.path.startsWith("/admin")) {
      return res.redirect(302, "/staff" + pathStrip);
    }
    if (pathStrip !== req.path) {
      return res.redirect(302, pathStrip);
    }
    next();
  });

  // --- Auth (no auth required) ---
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json({ user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    return res.json({ user: req.user });
  });

  // --- Staff: attendance (login/logout buttons) ---
  app.post("/api/staff/attendance/login", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const dateStr = (req.body?.date as string) || todayStr();
      const holiday = await storage.isHoliday(dateStr);
      if (holiday.isHoliday && holiday.holidayType === "full_day") {
        return res.status(400).json({ message: `Today is a holiday${holiday.occasion ? ` (${holiday.occasion})` : ""}` });
      }
      const body = req.body || {};
      const clientIp = getClientIp(req);
      const ipStr = clientIp ? clientIp.slice(0, 45) : null;

      let loginLocation: string | null = null;
      let loginLat: string | null = null;
      let loginLng: string | null = null;

      const lat = body.latitude != null ? Number(body.latitude) : NaN;
      const lng = body.longitude != null ? Number(body.longitude) : NaN;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      if (hasCoords) {
        loginLat = String(lat);
        loginLng = String(lng);
        try {
          loginLocation = await reverseGeocode(lat, lng);
        } catch {
          loginLocation = null;
        }
        if (!loginLocation) loginLocation = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } else {
        const isLocalhost = !clientIp || clientIp === "::1" || clientIp === "127.0.0.1" || clientIp.startsWith("127.");
        if (isLocalhost) {
          loginLocation = "Location not captured (allow browser location when logging in for address)";
        } else {
          loginLocation = await getLocationFromIp(clientIp);
          if (!loginLocation && clientIp) loginLocation = `IP: ${clientIp}`;
        }
      }

      const log = await storage.setAttendanceLogin(userId, dateStr, {
        loginLocation: loginLocation || null,
        loginIp: ipStr,
        loginLat: loginLat || null,
        loginLng: loginLng || null,
      });
      const row = log as Record<string, unknown>;
      res.json({
        ...row,
        loginLocation: row.loginLocation ?? row.login_location ?? (loginLocation || null),
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/attendance/logout", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const dateStr = (req.body?.date as string) || todayStr();
      const holiday = await storage.isHoliday(dateStr);
      if (holiday.isHoliday && holiday.holidayType === "full_day") {
        return res.status(400).json({ message: `Today is a holiday${holiday.occasion ? ` (${holiday.occasion})` : ""}` });
      }
      const body = req.body || {};
      const clientIp = getClientIp(req);

      let logoutLocation: string | null = null;
      let logoutLat: string | null = null;
      let logoutLng: string | null = null;

      const lat = body.latitude != null ? Number(body.latitude) : NaN;
      const lng = body.longitude != null ? Number(body.longitude) : NaN;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      if (hasCoords) {
        logoutLat = String(lat);
        logoutLng = String(lng);
        try {
          logoutLocation = await reverseGeocode(lat, lng);
        } catch {
          logoutLocation = null;
        }
        if (!logoutLocation) logoutLocation = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } else {
        const isLocalhost = !clientIp || clientIp === "::1" || clientIp === "127.0.0.1" || clientIp.startsWith("127.");
        if (isLocalhost) {
          logoutLocation = "Location not captured (allow browser location when logging out for address)";
        } else {
          logoutLocation = await getLocationFromIp(clientIp);
          if (!logoutLocation && clientIp) logoutLocation = `IP: ${clientIp}`;
        }
      }

      const log = await storage.setAttendanceLogout(userId, dateStr, {
        logoutLocation: logoutLocation || null,
        logoutLat: logoutLat || null,
        logoutLng: logoutLng || null,
      });
      const row = log as Record<string, unknown>;
      res.json({
        ...row,
        logoutLocation: row.logoutLocation ?? row.logout_location ?? (logoutLocation || null),
      });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/attendance/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const logs = await storage.getAttendanceLogsByEmployee(userId, from, to);
      const holidayRows: any[] = [];
      if (from && to) {
        const holidays = await storage.getHolidays(from, to);
        const existingDates = new Set(logs.map((l) => String((l as any).date).slice(0, 10)));
        for (const h of holidays) {
          const ds = String((h as any).date).slice(0, 10);
          if (!existingDates.has(ds)) {
            holidayRows.push({
              id: `holiday-${userId}-${ds}`,
              employeeId: userId,
              date: ds,
              loginAt: null,
              logoutAt: null,
              leadsCount: 0,
              status: "holiday",
              holidayType: (h as any).holidayType ?? "full_day",
              holidayName: (h as any).occasion ?? "Holiday",
            });
          }
        }
        for (const ds of enumerateSecondSaturdays(from, to)) {
          if (!existingDates.has(ds)) {
            holidayRows.push({
              id: `holiday-${userId}-${ds}`,
              employeeId: userId,
              date: ds,
              loginAt: null,
              logoutAt: null,
              leadsCount: 0,
              status: "holiday",
              holidayType: "half_day",
              holidayName: "Second Saturday (Half Day)",
            });
          }
        }
      }
      const merged = [...logs, ...holidayRows].sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)));
      res.json(merged);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/attendance", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const logs = await storage.getAllAttendanceLogs(from, to);
      const visibleIds = await getVisibleEmployeeIds(req);
      const employees = visibleIds === null
        ? await storage.listEmployees()
        : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      const filteredLogs = visibleIds === null ? logs : logs.filter((l) => visibleIds.includes(l.employeeId));
      const mapped = filteredLogs.map((l) => ({
        ...l,
        employeeName: byId[l.employeeId]?.name ?? l.employeeId,
        employeeNumber: byId[l.employeeId]?.number ?? "",
      }));
      const holidayRows: any[] = [];
      if (from && to) {
        const holidays = await storage.getHolidays(from, to);
        const secondSaturdays = enumerateSecondSaturdays(from, to);
        const targetEmployees = visibleIds === null ? employees.map((e) => e.id) : visibleIds;
        const existingKeys = new Set(mapped.map((l: any) => `${l.employeeId}:${String(l.date).slice(0, 10)}`));
        for (const eid of targetEmployees) {
          for (const h of holidays) {
            const ds = String((h as any).date).slice(0, 10);
            const key = `${eid}:${ds}`;
            if (!existingKeys.has(key)) {
              holidayRows.push({
                id: `holiday-${eid}-${ds}`,
                employeeId: eid,
                employeeName: byId[eid]?.name ?? eid,
                employeeNumber: byId[eid]?.number ?? "",
                date: ds,
                loginAt: null,
                logoutAt: null,
                loginLocation: null,
                logoutLocation: null,
                leadsCount: 0,
                status: "holiday",
                holidayType: (h as any).holidayType ?? "full_day",
                holidayName: (h as any).occasion ?? "Holiday",
              });
            }
          }
          for (const ds of secondSaturdays) {
            const key = `${eid}:${ds}`;
            if (!existingKeys.has(key)) {
              holidayRows.push({
                id: `holiday-${eid}-${ds}`,
                employeeId: eid,
                employeeName: byId[eid]?.name ?? eid,
                employeeNumber: byId[eid]?.number ?? "",
                date: ds,
                loginAt: null,
                logoutAt: null,
                loginLocation: null,
                logoutLocation: null,
                leadsCount: 0,
                status: "holiday",
                holidayType: "half_day",
                holidayName: "Second Saturday (Half Day)",
              });
            }
          }
        }
      }
      res.json([...mapped, ...holidayRows].sort((a: any, b: any) => String(b.date).localeCompare(String(a.date))));
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: holiday calendar ---
  app.get("/api/staff/holidays", requireAuth, async (req, res, next) => {
    try {
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const includeSecondSaturdaysRaw = String(req.query.includeSecondSaturdays ?? "true").toLowerCase();
      const includeSecondSaturdays = !["false", "0", "no"].includes(includeSecondSaturdaysRaw);
      const list = await storage.getHolidays(from, to);
      const out = Array.isArray(list) ? [...list] : [];
      if (includeSecondSaturdays && from && to) {
        const explicit = new Set(out.map((h: any) => String((h as any).date).slice(0, 10)));
        for (const ds of enumerateSecondSaturdays(from, to)) {
          if (!explicit.has(ds)) {
            out.push({
              id: `second-saturday-${ds}`,
              date: ds as any,
              occasion: "Second Saturday (Half Day)",
              holidayType: "half_day",
              isActive: 1,
            } as any);
          }
        }
      }
      out.sort((a: any, b: any) => String((a as any).date).localeCompare(String((b as any).date)));
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/holidays", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body || {};
      const date = (body.date as string)?.trim()?.slice(0, 10);
      const occasion = (body.occasion as string)?.trim();
      const holidayTypeRaw = (body.holidayType as string)?.trim()?.toLowerCase();
      const holidayType = holidayTypeRaw === "half_day" ? "half_day" : "full_day";
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Valid date is required (YYYY-MM-DD)" });
      if (!occasion) return res.status(400).json({ message: "Occasion is required" });
      const row = await storage.createHoliday({
        date: date as any,
        occasion,
        holidayType: holidayType as any,
        isActive: 1,
      } as any);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/holidays/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const existing = await storage.getHoliday(id);
      if (!existing) return res.status(404).json({ message: "Holiday not found" });
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (body.date !== undefined) {
        const date = String(body.date || "").trim().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Valid date is required (YYYY-MM-DD)" });
        data.date = date;
      }
      if (body.occasion !== undefined) data.occasion = String(body.occasion || "").trim();
      if (body.holidayType !== undefined) {
        const t = String(body.holidayType || "").trim().toLowerCase();
        if (!["full_day", "half_day"].includes(t)) return res.status(400).json({ message: "holidayType must be full_day or half_day" });
        data.holidayType = t;
      }
      if (body.isActive !== undefined) data.isActive = Number(body.isActive) ? 1 : 0;
      const updated = await storage.updateHoliday(id, data as any);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/staff/holidays/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteHoliday(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: Offer Letter templates + workflow ---
  app.get("/api/staff/offer-templates", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const activeOnly = String(req.query.activeOnly ?? "false") === "true";
      const list = await storage.listOfferLetterTemplates(activeOnly);
      res.json(
        list.map((t) => ({
          id: t.id,
          name: t.name,
          templatePath: t.templatePath ?? null,
          placeholders: t.placeholdersJson ? JSON.parse(String(t.placeholdersJson)) : [],
          isActive: t.isActive,
          createdAt: t.createdAt,
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/offer-templates/upload", requireAuth, requireAdmin, offerTemplateUpload.single("template"), async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "Template file is required" });
      const bodyText = file.buffer.toString("utf8");
      if (!bodyText.trim()) return res.status(400).json({ message: "Template content cannot be empty" });
      const nameRaw = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const templateName = nameRaw || file.originalname || "Offer Letter Template";
      const ext = path.extname(file.originalname || "").toLowerCase() || ".txt";
      const templateId = randomBytes(16).toString("hex");
      const filename = `${templateId}${ext}`;
      const savedPath = path.join(OFFER_TEMPLATES_DIR, filename);
      fs.writeFileSync(savedPath, file.buffer);
      const placeholders = extractTemplatePlaceholders(bodyText);
      const created = await storage.createOfferLetterTemplate({
        name: templateName,
        templatePath: path.join("offer-templates", filename),
        templateBody: bodyText,
        placeholdersJson: JSON.stringify(placeholders),
        isActive: 1,
        createdBy: (req.user as any).id,
      } as any);
      res.status(201).json({
        id: created.id,
        name: created.name,
        placeholders,
        templatePath: created.templatePath,
        isActive: created.isActive,
      });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/offer-letters", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const employeeId = typeof req.query.employeeId === "string" ? req.query.employeeId : undefined;
      const [rows, staff] = await Promise.all([
        storage.listOfferLetters({ status, employeeId }),
        storage.listEmployees(),
      ]);
      const byId = new Map(staff.map((u) => [u.id, u]));
      res.json(rows.map((r) => ({
        ...r,
        employeeName: (byId.get(r.employeeId) as any)?.fullName ?? (byId.get(r.employeeId) as any)?.username ?? r.employeeId,
        employeeNumber: (byId.get(r.employeeId) as any)?.employeeNumber ?? "",
      })));
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/offer-letters/generate", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body || {};
      const employeeId = typeof body.employeeId === "string" ? body.employeeId : "";
      const templateId = typeof body.templateId === "string" ? body.templateId : "";
      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Offer Letter";
      const payloadInput = typeof body.values === "object" && body.values ? body.values as Record<string, unknown> : {};
      if (!employeeId) return res.status(400).json({ message: "employeeId is required" });
      const employee = await storage.getUser(employeeId);
      if (!employee || !["employee", "team_lead"].includes(employee.role)) {
        return res.status(400).json({ message: "Offer letter can be generated only for employee or team lead" });
      }
      const template = templateId
        ? await storage.getOfferLetterTemplate(templateId)
        : (await storage.listOfferLetterTemplates(true))[0];
      if (!template) return res.status(400).json({ message: "No active offer letter template found" });
      const mergedValues: Record<string, string> = {
        fullName: String((employee as any).fullName ?? employee.username ?? ""),
        employeeName: String((employee as any).fullName ?? employee.username ?? ""),
        employeeNumber: String((employee as any).employeeNumber ?? ""),
        designation: String((employee as any).designation ?? ""),
        dateOfJoining: normalizeYmd((employee as any).dateOfJoining) ?? "",
        department: String((employee as any).department ?? ""),
        location: String((employee as any).location ?? ""),
      };
      for (const [k, v] of Object.entries(payloadInput)) mergedValues[k] = String(v ?? "");
      const letterBody = renderTemplateBody(String(template.templateBody ?? ""), mergedValues);
      const pdfName = `offer_${randomBytes(16).toString("hex")}.pdf`;
      const fullPath = path.join(OFFER_LETTERS_DIR, pdfName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(fullPath);
      doc.pipe(stream);
      drawOfferLetterPdf(doc, {
        title,
        employeeName: mergedValues.fullName || mergedValues.employeeName || employee.username,
        letterBody,
        generatedOn: new Date(),
      });
      doc.end();
      await new Promise<void>((resolve, reject) => {
        stream.on("finish", () => resolve());
        stream.on("error", reject);
      });
      const created = await storage.createOfferLetter({
        employeeId,
        templateId: template.id,
        title,
        status: "generated",
        payloadJson: JSON.stringify(mergedValues),
        letterBody,
        pdfPath: path.join("offer-letters", pdfName),
        generatedBy: (req.user as any).id,
      } as any);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/offer-letters/:id/publish", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const row = await storage.getOfferLetterById(id);
      if (!row) return res.status(404).json({ message: "Offer letter not found" });
      if (row.status !== "generated") return res.status(400).json({ message: "Only generated letters can be published" });
      const updated = await storage.updateOfferLetter(id, {
        status: "published",
        publishedBy: (req.user as any).id,
        publishedAt: new Date(),
      } as any);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/offer-letters/mine", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!["employee", "team_lead"].includes(user.role)) return res.json([]);
      const rows = await storage.listOfferLettersByEmployee(user.id);
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/offer-letters/:id/decision", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const user = req.user as any;
      const row = await storage.getOfferLetterById(id);
      if (!row) return res.status(404).json({ message: "Offer letter not found" });
      const role = String(user.role || "");
      if (role !== "admin" && row.employeeId !== user.id) return res.status(403).json({ message: "Forbidden" });
      const decision = String(req.body?.decision || "").toLowerCase();
      if (!["accepted", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "decision must be accepted or rejected" });
      }
      if (row.status !== "published") {
        return res.status(400).json({ message: "Only published offer letters can be accepted/rejected" });
      }
      const remarks = typeof req.body?.remarks === "string" ? req.body.remarks.trim() || null : null;
      const updated = await storage.updateOfferLetter(id, {
        status: decision,
        acceptedAt: decision === "accepted" ? new Date() : null,
        rejectedAt: decision === "rejected" ? new Date() : null,
        decisionRemarks: remarks,
      } as any);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/offer-letters/:id/file", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      const row = await storage.getOfferLetterById(req.params.id);
      if (!row) return res.status(404).json({ message: "Offer letter not found" });
      if (user.role !== "admin" && row.employeeId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!row.pdfPath) return res.status(404).json({ message: "Offer letter file not found" });
      const fullPath = path.join(UPLOADS_DIR, row.pdfPath);
      if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "Offer letter file missing" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="offer-letter-${row.id}.pdf"`);
      fs.createReadStream(fullPath).pipe(res);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: reverse-geocode (for lead form location display) ---
  app.get("/api/staff/reverse-geocode", requireAuth, async (req, res, next) => {
    try {
      const lat = req.query.lat != null ? Number(req.query.lat) : NaN;
      const lng = req.query.lng != null ? Number(req.query.lng) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ message: "Query params lat and lng required" });
      }
      const address = await reverseGeocode(lat, lng);
      res.json({ address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: leads ---
  app.get("/api/staff/leads/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const list = await storage.getLeadsByEmployee(userId, from, to);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/leads", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const dateStr = body.date || todayStr();
      if (!body.dateOfBirth || (typeof body.dateOfBirth === "string" && !body.dateOfBirth.trim())) {
        return res.status(400).json({ message: "Date of birth is required" });
      }
      const dobErr = validateDateOfBirthAndAge(body.dateOfBirth);
      if (dobErr) return res.status(400).json({ message: dobErr });
      if (!body.loanType || (typeof body.loanType === "string" && !body.loanType.trim())) {
        return res.status(400).json({ message: "Loan type is required" });
      }
      if (!body.subLoanType || (typeof body.subLoanType === "string" && !body.subLoanType.trim())) {
        return res.status(400).json({ message: "Sub loan type is required" });
      }
      if (!body.incomeType || (typeof body.incomeType === "string" && !body.incomeType.trim())) {
        return res.status(400).json({ message: "Income type is required" });
      }
      if (!body.customerPhone || (typeof body.customerPhone === "string" && !body.customerPhone.trim())) {
        return res.status(400).json({ message: "Contact number is required" });
      }
      let formLocation: string | null = (body.formLocation && String(body.formLocation).trim()) ? String(body.formLocation).trim().slice(0, 500) : null;
      if (!formLocation && body.latitude != null && body.longitude != null) {
        const lat = Number(body.latitude);
        const lng = Number(body.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) formLocation = await reverseGeocode(lat, lng) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      const lead = await storage.createLead({
        employeeId: userId,
        date: dateStr,
        customerName: body.customerName ?? null,
        dateOfBirth: body.dateOfBirth && String(body.dateOfBirth).trim() ? String(body.dateOfBirth).trim().slice(0, 10) : null,
        customerPhone: body.customerPhone && String(body.customerPhone).trim() ? String(body.customerPhone).trim() : null,
        customerEmail: body.customerEmail ?? null,
        location: body.location ?? null,
        loanType: body.loanType ?? null,
        subLoanType: body.subLoanType ?? null,
        incomeType: body.incomeType ?? null,
        incomeComments: body.incomeComments ?? null,
        amount: body.amount ?? null,
        cibil: body.cibil ?? null,
        docsCollected: body.docsCollected ?? null,
        companyLogged: body.companyLogged ?? null,
        applicationNumber: body.applicationNumber ?? null,
        tenure: body.tenure ?? null,
        roi: body.roi ?? null,
        loanDisbursed: body.loanDisbursed ?? null,
        loanSanctionedAt: body.loanSanctionedAt && String(body.loanSanctionedAt).trim() ? String(body.loanSanctionedAt).trim().slice(0, 10) : null,
        loanDisbursedAt: body.loanDisbursedAt && String(body.loanDisbursedAt).trim() ? String(body.loanDisbursedAt).trim().slice(0, 10) : null,
        status: body.status ?? "open",
        notes: body.notes ?? null,
        formLocation: formLocation ?? undefined,
      });
      const count = await storage.getLeadsCountForEmployeeOnDate(userId, dateStr);
      await storage.updateAttendanceFromLeadsCount(userId, dateStr, count);
      res.status(201).json(lead);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/leads", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const employeeId = (req.query.employeeId as string) || undefined;
      const fromDate = (req.query.from as string) || undefined;
      const toDate = (req.query.to as string) || undefined;
      const status = (req.query.status as string) || undefined;
      const list = await storage.getAllLeads({ employeeId, fromDate, toDate, status });
      const visibleIds = await getVisibleEmployeeIds(req);
      const employees = visibleIds === null
        ? await storage.listEmployees()
        : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      const filtered = visibleIds === null ? list : list.filter((l) => visibleIds.includes(l.employeeId));
      res.json(
        filtered.map((l) => ({
          ...l,
          employeeName: byId[l.employeeId]?.name ?? l.employeeId,
          employeeNumber: byId[l.employeeId]?.number ?? "",
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/leads/:id", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getLead(id);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      const isAdminOrLead = role === "admin" || role === "team_lead";
      if (isAdminOrLead) {
        const visibleIds = await getVisibleEmployeeIds(req);
        if (visibleIds !== null && !visibleIds.includes(lead.employeeId) && lead.employeeId !== userId) {
          return res.status(404).json({ message: "Lead not found" });
        }
      } else if (lead.employeeId !== userId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/leads/:id", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getLead(id);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      const isAdmin = role === "admin";
      const isTeamLead = role === "team_lead";
      if (isTeamLead) {
        const visibleIds = await getVisibleEmployeeIds(req);
        if (visibleIds === null || (!visibleIds.includes(lead.employeeId) && lead.employeeId !== userId)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      } else if (!isAdmin && lead.employeeId !== userId) return res.status(403).json({ message: "Forbidden" });
      const body = req.body || {};
      const dobErr = validateDateOfBirthAndAge(body.dateOfBirth);
      if (dobErr) return res.status(400).json({ message: dobErr });
      const data: Record<string, unknown> = {};
      if (body.customerName !== undefined) data.customerName = body.customerName;
      if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth && String(body.dateOfBirth).trim() ? String(body.dateOfBirth).trim().slice(0, 10) : null;
      if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone;
      if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail;
      if (body.location !== undefined) data.location = body.location;
      if (body.loanType !== undefined) data.loanType = body.loanType;
      if (body.subLoanType !== undefined) data.subLoanType = body.subLoanType;
      if (body.incomeType !== undefined) data.incomeType = body.incomeType;
      if (body.incomeComments !== undefined) data.incomeComments = body.incomeComments;
      if (body.amount !== undefined) data.amount = body.amount;
      if (body.cibil !== undefined) data.cibil = body.cibil;
      if (body.docsCollected !== undefined) data.docsCollected = body.docsCollected;
      if (body.companyLogged !== undefined) data.companyLogged = body.companyLogged;
      if (body.applicationNumber !== undefined) data.applicationNumber = body.applicationNumber;
      if (body.tenure !== undefined) data.tenure = body.tenure;
      if (body.roi !== undefined) data.roi = body.roi;
      if (body.loanDisbursed !== undefined) data.loanDisbursed = body.loanDisbursed;
      if (body.loanSanctionedAt !== undefined) data.loanSanctionedAt = body.loanSanctionedAt && String(body.loanSanctionedAt).trim() ? String(body.loanSanctionedAt).trim().slice(0, 10) : null;
      if (body.loanDisbursedAt !== undefined) data.loanDisbursedAt = body.loanDisbursedAt && String(body.loanDisbursedAt).trim() ? String(body.loanDisbursedAt).trim().slice(0, 10) : null;
      if (body.status !== undefined) data.status = body.status;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.date !== undefined) data.date = typeof body.date === "string" ? body.date.trim().slice(0, 10) : body.date;
      if (body.formLocation !== undefined) data.formLocation = body.formLocation;
      // Admin-only fields: only admins can set these
      if (isAdmin) {
        if (body.payoutPercent !== undefined) data.payoutPercent = body.payoutPercent;
        if (body.payoutAmount !== undefined) data.payoutAmount = body.payoutAmount;
        if (body.reconsil !== undefined) data.reconsil = body.reconsil;
        if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus;
      }
      const updated = await storage.updateLead(id, data);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      const empId = (updated as any).employeeId ?? (updated as any).employee_id;
      const rawDate = (updated as any).date;
      const dateStr = rawDate ? (typeof rawDate === "string" ? rawDate.slice(0, 10) : String(rawDate).slice(0, 10)) : "";
      if (empId && dateStr) {
        try {
          const count = await storage.getLeadsCountForEmployeeOnDate(empId, dateStr);
          await storage.updateAttendanceFromLeadsCount(empId, dateStr, count);
        } catch (_) { /* non-fatal */ }
      }
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/staff/leads/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getLead(id);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      await storage.deleteLead(id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: insurance leads ---
  app.get("/api/staff/insurance-leads/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const list = await storage.getInsuranceLeadsByEmployee(userId, from, to);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/insurance-leads", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const dateStr = body.date || todayStr();
      if (!body.dateOfBirth || (typeof body.dateOfBirth === "string" && !body.dateOfBirth.trim())) {
        return res.status(400).json({ message: "Date of birth is required" });
      }
      if (!body.contactNum || (typeof body.contactNum === "string" && !body.contactNum.trim())) {
        return res.status(400).json({ message: "Contact number is required" });
      }
      let formLocation: string | null = (body.formLocation && String(body.formLocation).trim()) ? String(body.formLocation).trim().slice(0, 500) : null;
      if (!formLocation && body.latitude != null && body.longitude != null) {
        const lat = Number(body.latitude);
        const lng = Number(body.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) formLocation = await reverseGeocode(lat, lng) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      const lead = await storage.createInsuranceLead({
        employeeId: userId,
        date: dateStr,
        customerName: body.customerName ?? null,
        dateOfBirth: body.dateOfBirth && String(body.dateOfBirth).trim() ? String(body.dateOfBirth).trim().slice(0, 10) : null,
        contactNum: body.contactNum && String(body.contactNum).trim() ? String(body.contactNum).trim() : null,
        mailId: body.mailId ?? null,
        location: body.location ?? null,
        insuranceType: body.insuranceType ?? null,
        insuranceCategory: body.insuranceCategory ?? null,
        insuranceProductType: body.insuranceProductType ?? null,
        insuranceProductTypeOther: body.insuranceProductTypeOther ?? null,
        vehicleNumber: body.vehicleNumber ?? null,
        insuranceSubtype: body.insuranceSubtype ?? null,
        insuranceSubtypeOther: body.insuranceSubtypeOther ?? null,
        profileType: body.profileType ?? null,
        profileComments: body.profileComments ?? null,
        businessType: body.businessType ?? null,
        businessTypeComments: body.businessTypeComments ?? null,
        paymentMode: body.paymentMode ?? null,
        paymentModeComments: body.paymentModeComments ?? null,
        paymentDoneBy: body.paymentDoneBy ?? null,
        paymentDoneByComments: body.paymentDoneByComments ?? null,
        premiumQuoted: body.premiumQuoted ?? null,
        premiumCollected: body.premiumCollected ?? null,
        netPremium: body.netPremium ?? null,
        difference: body.difference ?? null,
        miscellaneousExpenses: body.miscellaneousExpenses ?? null,
        status: body.status ?? "open",
        notes: body.notes ?? null,
        formLocation: formLocation ?? undefined,
        policyNumber: body.policyNumber && String(body.policyNumber).trim() ? String(body.policyNumber).trim().slice(0, 100) : null,
        policyStartDate: body.policyStartDate && String(body.policyStartDate).trim() ? String(body.policyStartDate).trim().slice(0, 10) : null,
        policyEndDate: body.policyEndDate && String(body.policyEndDate).trim() ? String(body.policyEndDate).trim().slice(0, 10) : null,
      });
      res.status(201).json(lead);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/insurance-leads", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const employeeId = (req.query.employeeId as string) || undefined;
      const fromDate = (req.query.from as string) || undefined;
      const toDate = (req.query.to as string) || undefined;
      const list = await storage.getAllInsuranceLeads({ employeeId, fromDate, toDate });
      const visibleIds = await getVisibleEmployeeIds(req);
      const employees = visibleIds === null
        ? await storage.listEmployees()
        : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      const filtered = visibleIds === null ? list : list.filter((l) => visibleIds.includes(l.employeeId));
      res.json(
        filtered.map((l) => ({
          ...l,
          employeeName: byId[l.employeeId]?.name ?? l.employeeId,
          employeeNumber: byId[l.employeeId]?.number ?? "",
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/insurance-leads/upcoming-renewals", requireAuth, async (req, res, next) => {
    try {
      const days = Math.min(31, Math.max(1, parseInt(String(req.query.days || "3"), 10) || 3));
      const visibleIds = await getVisibleEmployeeIds(req);
      const userId = (req.user as any).id;
      const employeeIds = visibleIds === null ? (await storage.listEmployees()).map((u) => u.id) : [userId, ...visibleIds];
      const list = await storage.getInsuranceLeadsExpiringSoon(employeeIds, days);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/insurance-leads/:id", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getInsuranceLead(id);
      if (!lead) return res.status(404).json({ message: "Insurance lead not found" });
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      const isAdmin = role === "admin";
      if (!isAdmin) {
        if (lead.employeeId !== userId) {
          if (role === "team_lead") {
            const visibleIds = await getVisibleEmployeeIds(req);
            if (visibleIds === null || (!visibleIds.includes(lead.employeeId) && lead.employeeId !== userId))
              return res.status(403).json({ message: "Forbidden" });
          } else {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
      }
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (body.date !== undefined) data.date = body.date && String(body.date).trim() ? String(body.date).trim().slice(0, 10) : null;
      if (body.customerName !== undefined) data.customerName = body.customerName;
      if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth && String(body.dateOfBirth).trim() ? String(body.dateOfBirth).trim().slice(0, 10) : null;
      if (body.contactNum !== undefined) data.contactNum = body.contactNum;
      if (body.mailId !== undefined) data.mailId = body.mailId;
      if (body.location !== undefined) data.location = body.location;
      if (body.insuranceType !== undefined) data.insuranceType = body.insuranceType;
      if (body.insuranceCategory !== undefined) data.insuranceCategory = body.insuranceCategory;
      if (body.insuranceProductType !== undefined) data.insuranceProductType = body.insuranceProductType;
      if (body.insuranceProductTypeOther !== undefined) data.insuranceProductTypeOther = body.insuranceProductTypeOther;
      if (body.vehicleNumber !== undefined) data.vehicleNumber = body.vehicleNumber;
      if (body.insuranceSubtype !== undefined) data.insuranceSubtype = body.insuranceSubtype;
      if (body.insuranceSubtypeOther !== undefined) data.insuranceSubtypeOther = body.insuranceSubtypeOther;
      if (body.profileType !== undefined) data.profileType = body.profileType;
      if (body.profileComments !== undefined) data.profileComments = body.profileComments;
      if (body.businessType !== undefined) data.businessType = body.businessType;
      if (body.businessTypeComments !== undefined) data.businessTypeComments = body.businessTypeComments;
      if (body.paymentMode !== undefined) data.paymentMode = body.paymentMode;
      if (body.paymentModeComments !== undefined) data.paymentModeComments = body.paymentModeComments;
      if (body.paymentDoneBy !== undefined) data.paymentDoneBy = body.paymentDoneBy;
      if (body.paymentDoneByComments !== undefined) data.paymentDoneByComments = body.paymentDoneByComments;
      if (body.premiumQuoted !== undefined) data.premiumQuoted = body.premiumQuoted;
      if (body.premiumCollected !== undefined) data.premiumCollected = body.premiumCollected;
      if (body.netPremium !== undefined) data.netPremium = body.netPremium;
      if (body.difference !== undefined) data.difference = body.difference;
      if (body.miscellaneousExpenses !== undefined) data.miscellaneousExpenses = body.miscellaneousExpenses;
      if (body.status !== undefined) data.status = body.status;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.formLocation !== undefined) data.formLocation = body.formLocation;
      if (body.policyNumber !== undefined) data.policyNumber = body.policyNumber && String(body.policyNumber).trim() ? String(body.policyNumber).trim().slice(0, 100) : null;
      if (body.policyStartDate !== undefined) data.policyStartDate = body.policyStartDate && String(body.policyStartDate).trim() ? String(body.policyStartDate).trim().slice(0, 10) : null;
      if (body.policyEndDate !== undefined) data.policyEndDate = body.policyEndDate && String(body.policyEndDate).trim() ? String(body.policyEndDate).trim().slice(0, 10) : null;
      if (body.renewedAt !== undefined) data.renewedAt = body.renewedAt === true || body.renewedAt === "true" ? new Date() : body.renewedAt === false || body.renewedAt === "false" ? null : undefined;
      if (isAdmin) {
        if (body.collectedPremium !== undefined) data.collectedPremium = body.collectedPremium;
        if (body.actualPremium !== undefined) data.actualPremium = body.actualPremium;
        if (body.finalRemarks !== undefined) data.finalRemarks = body.finalRemarks;
      }
      const updated = await storage.updateInsuranceLead(id, data);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/staff/insurance-leads/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getInsuranceLead(id);
      if (!lead) return res.status(404).json({ message: "Insurance lead not found" });
      await storage.deleteInsuranceLead(id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  // --- Admin: bulk import loan + insurance leads (insert-only; .xlsx) ---
  app.get("/api/staff/admin/import-leads-template", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const buf = await buildImportTemplateBuffer();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", 'attachment; filename="leads-import-template.xlsx"');
      res.send(buf);
    } catch (e) {
      next(e);
    }
  });

  app.post(
    "/api/staff/admin/import-leads-data",
    requireAuth,
    requireAdmin,
    (req, res, next) => {
      adminLeadImportUpload.single("file")(req, res, (err) => {
        if (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          return res.status(400).json({ message: msg });
        }
        next();
      });
    },
    async (req, res, next) => {
      try {
        const file = req.file;
        if (!file?.buffer) {
          return res.status(400).json({ message: "file is required (form field name: file)" });
        }
        const dryRun =
          String(req.query.dryRun || "") === "1" || String(req.body?.dryRun || "") === "true";
        const result = await runAdminLeadImport(file.buffer, { storage, dryRun });
        res.json(result);
      } catch (e) {
        if (e instanceof AdminLeadImportParseError) {
          return res
            .status(400)
            .json({ message: "Could not read Excel file. Use a valid .xlsx workbook." });
        }
        next(e);
      }
    }
  );

  // --- Staff: admin expenses (admin only) ---
  app.get("/api/staff/admin-expenses", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const month = (req.query.month as string)?.trim() || undefined;
      const purpose = (req.query.purpose as string)?.trim() || undefined;
      const list = await storage.getAdminExpenses({ month, purpose });
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/admin-expenses/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const row = await storage.getAdminExpense(req.params.id);
      if (!row) return res.status(404).json({ message: "Admin expense not found" });
      res.json(row);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/admin-expenses", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const purpose = (body.purpose as string)?.trim();
      const month = (body.month as string)?.trim();
      if (!purpose || !month) {
        return res.status(400).json({ message: "Purpose and month are required" });
      }
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Month must be YYYY-MM" });
      }
      const row = await storage.createAdminExpense({
        purpose,
        purposeOther: (body.purposeOther as string)?.trim() || null,
        month,
        address: (body.address as string)?.trim() || null,
        amount: (body.amount as string)?.trim() || null,
        paymentDate: (body.paymentDate as string)?.trim()?.slice(0, 10) || null,
        transactionDetail: (body.transactionDetail as string)?.trim() || null,
        bankName: (body.bankName as string)?.trim() || null,
        remarks: (body.remarks as string)?.trim() || null,
        createdBy: userId,
      } as any);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/admin-expenses/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const existing = await storage.getAdminExpense(id);
      if (!existing) return res.status(404).json({ message: "Admin expense not found" });
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (body.purpose !== undefined) data.purpose = String(body.purpose).trim();
      if (body.purposeOther !== undefined) data.purposeOther = body.purposeOther ? String(body.purposeOther).trim() : null;
      if (body.month !== undefined) data.month = String(body.month).trim().slice(0, 7);
      if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
      if (body.amount !== undefined) data.amount = body.amount ? String(body.amount).trim() : null;
      if (body.paymentDate !== undefined) data.paymentDate = body.paymentDate ? String(body.paymentDate).trim().slice(0, 10) : null;
      if (body.transactionDetail !== undefined) data.transactionDetail = body.transactionDetail ? String(body.transactionDetail).trim() : null;
      if (body.bankName !== undefined) data.bankName = body.bankName ? String(body.bankName).trim() : null;
      if (body.remarks !== undefined) data.remarks = body.remarks ? String(body.remarks).trim() : null;
      const updated = await storage.updateAdminExpense(id, data as any);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/staff/admin-expenses/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const row = await storage.getAdminExpense(req.params.id);
      if (!row) return res.status(404).json({ message: "Admin expense not found" });
      await storage.deleteAdminExpense(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: leader expense requests (team leads create, admin approves/rejects) ---
  app.get("/api/staff/leader-expense-requests", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      const month = (req.query.month as string)?.trim() || undefined;
      let monthFrom = (req.query.monthFrom as string)?.trim() || undefined;
      let monthTo = (req.query.monthTo as string)?.trim() || undefined;
      const status = (req.query.status as string)?.trim() || undefined;
      const requestedByParam = (req.query.requestedBy as string)?.trim() || undefined;

      const ymOk = (s: string) => /^\d{4}-\d{2}$/.test(s);
      if (month && !ymOk(month)) {
        return res.status(400).json({ message: "month must be YYYY-MM" });
      }
      if (monthFrom && !ymOk(monthFrom)) {
        return res.status(400).json({ message: "monthFrom must be YYYY-MM" });
      }
      if (monthTo && !ymOk(monthTo)) {
        return res.status(400).json({ message: "monthTo must be YYYY-MM" });
      }
      if (monthFrom && !monthTo) monthTo = monthFrom;
      if (!monthFrom && monthTo) monthFrom = monthTo;

      const rangeFilter =
        monthFrom && monthTo
          ? { monthFrom: monthFrom <= monthTo ? monthFrom : monthTo, monthTo: monthFrom <= monthTo ? monthTo : monthFrom }
          : undefined;
      const monthFilter = rangeFilter ? undefined : month;

      const baseFilters = {
        ...(rangeFilter ?? {}),
        ...(monthFilter ? { month: monthFilter } : {}),
        ...(status ? { status } : {}),
      };

      if (role === "team_lead") {
        const list = await storage.getLeaderExpenseRequests({ ...baseFilters, requestedBy: userId });
        return res.json(list);
      }

      if (role === "admin") {
        const list = await storage.getLeaderExpenseRequests({
          ...baseFilters,
          ...(requestedByParam ? { requestedBy: requestedByParam } : {}),
        });
        return res.json(list);
      }

      return res.status(403).json({ message: "Only admins and team leaders can view leader expense requests" });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/leader-expense-requests", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      if (role !== "team_lead") {
        return res.status(403).json({ message: "Only team leaders can create expense requests" });
      }
      const body = req.body || {};
      const purpose = (body.purpose as string)?.trim();
      const month = (body.month as string)?.trim();
      if (!purpose || !month) {
        return res.status(400).json({ message: "Purpose and month are required" });
      }
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Month must be YYYY-MM" });
      }
      const row = await storage.createLeaderExpenseRequest({
        purpose,
        purposeOther: (body.purposeOther as string)?.trim() || null,
        month,
        address: (body.address as string)?.trim() || null,
        amount: (body.amount as string)?.trim() || null,
        paymentDate: (body.paymentDate as string)?.trim()?.slice(0, 10) || null,
        transactionDetail: (body.transactionDetail as string)?.trim() || null,
        bankName: (body.bankName as string)?.trim() || null,
        remarks: (body.remarks as string)?.trim() || null,
        requestedBy: userId,
        status: "pending",
      } as any);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/leader-expense-requests/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      const id = req.params.id;
      const existing = await storage.getLeaderExpenseRequest(id);
      if (!existing) return res.status(404).json({ message: "Leader expense request not found" });

      if (role !== "admin") {
        return res.status(403).json({ message: "Only admin can approve or reject leader expense requests" });
      }

      const body = req.body || {};
      const status = (body.status as string)?.trim().toLowerCase();
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      if ((existing as any).status && (existing as any).status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be approved or rejected" });
      }

      const updated = await storage.updateLeaderExpenseRequest(id, {
        status,
        approvedBy: userId,
        approvedAt: new Date(),
      } as any);

      // On approve, optionally copy into admin_expenses so it appears in admin ledger and expenditure.
      if (status === "approved" && updated) {
        const u: any = updated;
        try {
          await storage.createAdminExpense({
            purpose: u.purpose,
            purposeOther: u.purposeOther ?? null,
            month: u.month,
            address: u.address ?? null,
            amount: u.amount ?? null,
            paymentDate: u.paymentDate ?? null,
            transactionDetail: u.transactionDetail ?? null,
            bankName: u.bankName ?? null,
            remarks: u.remarks ?? null,
            createdBy: userId,
          } as any);
        } catch (err) {
          // Do not fail the approval if the admin expense insert fails; just log.
          // eslint-disable-next-line no-console
          console.error("Failed to create admin expense from leader request", err);
        }
      }

      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: workflow alerts (resignation + probation confirmation) ---
  app.get("/api/staff/workflow-alerts", requireAuth, async (req, res, next) => {
    try {
      const role = (req.user as any).role as "admin" | "team_lead" | "employee";
      const userId = (req.user as any).id as string;
      if (role !== "admin" && role !== "team_lead") {
        return res.json({ pendingResignations: [], pendingProbationConfirmations: [] });
      }
      const visibleIds = await getVisibleEmployeeIds(req);
      const employeeIds = visibleIds === null ? (await storage.listEmployees()).map((u) => u.id) : visibleIds;
      await storage.ensureProbationConfirmationsForEmployees(employeeIds);
      const [resignations, confirmations, employees] = await Promise.all([
        storage.getResignationRequestsForApproval(role, userId, employeeIds),
        storage.getProbationConfirmationsForApproval(role, userId, employeeIds),
        visibleIds === null ? storage.listEmployees() : storage.listEmployees({ teamLeadId: userId }),
      ]);
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      return res.json({
        pendingResignations: resignations.map((r) => ({
          ...r,
          employeeName: byId[r.employeeId]?.name ?? r.employeeId,
          employeeNumber: byId[r.employeeId]?.number ?? "",
        })),
        pendingProbationConfirmations: confirmations.map((r) => ({
          ...r,
          employeeName: byId[r.employeeId]?.name ?? r.employeeId,
          employeeNumber: byId[r.employeeId]?.number ?? "",
        })),
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: resignation requests (employee/team_lead applies; approval TL -> admin) ---
  app.post("/api/staff/resignations", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id as string;
      const role = (req.user as any).role as string;
      if (role !== "employee" && role !== "team_lead") {
        return res.status(403).json({ message: "Only employees or team leads can raise resignation requests" });
      }
      const [employee] = await Promise.all([storage.getUser(userId)]);
      if (!employee) return res.status(404).json({ message: "User not found" });
      const open = (await storage.getResignationRequestsByEmployee(userId)).find((r) =>
        ["pending_team_lead", "pending_admin", "approved"].includes(String((r as any).status || ""))
      );
      if (open) return res.status(400).json({ message: "A resignation request is already active" });
      const body = req.body || {};
      const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;
      const requestedLastWorkingDay =
        typeof body.requestedLastWorkingDay === "string" && body.requestedLastWorkingDay.trim()
          ? body.requestedLastWorkingDay.trim().slice(0, 10)
          : null;
      const status = String((employee as any).employmentStatus ?? "confirmed");
      const noticeDays = status === "confirmed" ? 90 : 30;
      const minLwd = addDaysYmd(todayStr(), noticeDays);
      const effectiveLastWorkingDay =
        requestedLastWorkingDay && requestedLastWorkingDay > minLwd ? requestedLastWorkingDay : minLwd;
      const created = await storage.createResignationRequest({
        employeeId: userId,
        reason,
        requestedLastWorkingDay: requestedLastWorkingDay as any,
        effectiveLastWorkingDay: effectiveLastWorkingDay as any,
        noticeDays,
        status: role === "team_lead" ? "pending_admin" : "pending_team_lead",
      } as any);
      return res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/resignations/on-notice", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const role = (req.user as any).role as "admin" | "team_lead";
      const visibleIds = await getVisibleEmployeeIds(req);
      let people = await storage.listEmployees();
      if (role === "team_lead") {
        const allowed = new Set((visibleIds ?? []).map(String));
        people = people.filter((u) => u.role === "employee" && allowed.has(u.id));
      } else {
        people = people.filter((u) => u.role === "employee" || u.role === "team_lead");
      }
      const out: Array<Record<string, unknown>> = [];
      for (const p of people) {
        const list = await storage.getResignationRequestsByEmployee(p.id);
        const active = pickActiveApprovedResignation(list as any[]);
        if (!active) continue;
        out.push({
          ...active.row,
          employeeName: (p as any).fullName?.trim() || p.username || p.id,
          employeeNumber: (p as any).employeeNumber ?? "",
          employeeRole: p.role,
          effectiveLastWorkingDay: active.lwd,
          daysLeft: active.daysLeft,
        });
      }
      out.sort((a, b) => Number((a as any).daysLeft ?? 9999) - Number((b as any).daysLeft ?? 9999));
      return res.json(out);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/resignations/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id as string;
      const list = await storage.getResignationRequestsByEmployee(userId);
      return res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/resignations/:id/decision", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const actorId = (req.user as any).id as string;
      const role = (req.user as any).role as "admin" | "team_lead" | "employee";
      if (role !== "admin" && role !== "team_lead") {
        return res.status(403).json({ message: "Only admin or team lead can decide" });
      }
      const row = await storage.getResignationRequest(id);
      if (!row) return res.status(404).json({ message: "Resignation request not found" });
      const body = req.body || {};
      const decision = String(body.decision || "").toLowerCase();
      if (!["approved", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "decision must be approved or rejected" });
      }
      const remarks = typeof body.remarks === "string" ? body.remarks.trim() || null : null;
      if (role === "team_lead") {
        const visibleIds = await getVisibleEmployeeIds(req);
        if (!visibleIds || !visibleIds.includes(row.employeeId)) {
          return res.status(403).json({ message: "Not allowed for this employee" });
        }
        if (row.status !== "pending_team_lead") {
          return res.status(400).json({ message: "Only pending team lead requests can be decided" });
        }
        const updated = await storage.updateResignationRequest(id, {
          teamLeadDecision: decision,
          teamLeadDecisionBy: actorId,
          teamLeadDecisionAt: new Date(),
          teamLeadRemarks: remarks,
          status: decision === "approved" ? "pending_admin" : "rejected_by_team_lead",
        } as any);
        return res.json(updated);
      }
      if (row.status !== "pending_admin") {
        return res.status(400).json({ message: "Only pending admin requests can be decided" });
      }
      const updated = await storage.updateResignationRequest(id, {
        adminDecision: decision,
        adminDecisionBy: actorId,
        adminDecisionAt: new Date(),
        adminRemarks: remarks,
        status: decision === "approved" ? "approved" : "rejected_by_admin",
      } as any);
      if (decision === "approved") {
        await storage.updateUser(row.employeeId, { employmentStatus: "resigned" as any });
      }
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: probation confirmation (eligible after 3 months, approval TL -> admin) ---
  app.get("/api/staff/probation-confirmations/mine", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id as string;
      const list = await storage.getProbationConfirmationsByEmployee(userId);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/probation-confirmations/:id/decision", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const actorId = (req.user as any).id as string;
      const role = (req.user as any).role as "admin" | "team_lead" | "employee";
      if (role !== "admin" && role !== "team_lead") {
        return res.status(403).json({ message: "Only admin or team lead can decide" });
      }
      const row = await storage.getProbationConfirmation(id);
      if (!row) return res.status(404).json({ message: "Probation confirmation not found" });
      const body = req.body || {};
      const decision = String(body.decision || "").toLowerCase();
      if (!["approved", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "decision must be approved or rejected" });
      }
      const remarks = typeof body.remarks === "string" ? body.remarks.trim() || null : null;
      if (role === "team_lead") {
        const visibleIds = await getVisibleEmployeeIds(req);
        if (!visibleIds || !visibleIds.includes(row.employeeId)) {
          return res.status(403).json({ message: "Not allowed for this employee" });
        }
        if (row.status !== "pending_team_lead") {
          return res.status(400).json({ message: "Only pending team lead confirmations can be decided" });
        }
        const updated = await storage.updateProbationConfirmation(id, {
          teamLeadDecision: decision,
          teamLeadDecisionBy: actorId,
          teamLeadDecisionAt: new Date(),
          teamLeadRemarks: remarks,
          status: decision === "approved" ? "pending_admin" : "rejected_by_team_lead",
        } as any);
        return res.json(updated);
      }
      if (row.status !== "pending_admin") {
        return res.status(400).json({ message: "Only pending admin confirmations can be decided" });
      }
      const updated = await storage.updateProbationConfirmation(id, {
        adminDecision: decision,
        adminDecisionBy: actorId,
        adminDecisionAt: new Date(),
        adminRemarks: remarks,
        status: decision === "approved" ? "approved" : "rejected_by_admin",
      } as any);
      if (decision === "approved") {
        await storage.updateUser(row.employeeId, {
          employmentStatus: "confirmed" as any,
          confirmedAt: new Date(),
        });
      }
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: leave requests ---
  app.post("/api/staff/leave", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const leaveType = (body.leaveType as string)?.trim() || "on_duty";
      const startDate = (body.startDate as string)?.trim();
      const endDate = (body.endDate as string)?.trim();
      const reason = (body.reason as string)?.trim() || null;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      if (startDate > endDate) {
        return res.status(400).json({ message: "Start date must be before or equal to end date" });
      }
      const validTypes = ["on_duty", "missed_punch", "on_leave", "loss_of_pay", "personal", "sick", "casual", "emergency", "other"];
      if (!validTypes.includes(leaveType)) {
        return res.status(400).json({ message: "Invalid leave type" });
      }
      const leave = await storage.createLeaveRequest({
        employeeId: userId,
        leaveType,
        startDate,
        endDate,
        reason,
        status: "pending",
      } as any);
      res.status(201).json(leave);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/leave/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const list = await storage.getLeaveRequestsByEmployee(userId, from, to);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/leave", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const visibleIds = await getVisibleEmployeeIds(req);
      if (visibleIds !== null && visibleIds.length === 0) {
        return res.json([]);
      }
      const status = (req.query.status as string) || undefined;
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const employeeIds = visibleIds === null ? (await storage.listEmployees()).map((u) => u.id) : visibleIds;
      const list = await storage.getLeaveRequestsForApproval(employeeIds, { status, fromDate: from, toDate: to });
      const employees = visibleIds === null ? await storage.listEmployees() : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      res.json(
        list.map((l) => ({
          ...l,
          employeeName: byId[l.employeeId]?.name ?? l.employeeId,
          employeeNumber: byId[l.employeeId]?.number ?? "",
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/leave/:id", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const leave = await storage.getLeaveRequest(id);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      if (leave.employeeId !== userId) {
        if (role === "admin" || role === "team_lead") {
          const visibleIds = await getVisibleEmployeeIds(req);
          if (visibleIds !== null && !visibleIds.includes(leave.employeeId)) {
            return res.status(404).json({ message: "Leave request not found" });
          }
        } else {
          return res.status(404).json({ message: "Leave request not found" });
        }
      }
      res.json(leave);
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/leave/:id", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const leave = await storage.getLeaveRequest(id);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      const body = req.body || {};
      const isApproval = body.status === "approved" || body.status === "rejected";
      const isCancel = body.status === "cancelled";

      if (isCancel) {
        // Cancel (withdraw) pending leave: owner, team lead for team member, or admin
        if (leave.status !== "pending") {
          return res.status(400).json({ message: "Only pending leave requests can be cancelled" });
        }
        const canCancel =
          leave.employeeId === userId ||
          role === "admin" ||
          (role === "team_lead" && (await getVisibleEmployeeIds(req))?.includes(leave.employeeId));
        if (!canCancel) {
          return res.status(403).json({ message: "You can only cancel your own pending leave or your team members'" });
        }
        const updated = await storage.updateLeaveRequest(id, { status: "cancelled" });
        if (!updated) return res.status(500).json({ message: "Update failed" });
        return res.json(updated);
      }

      if (isApproval) {
        // Approve/reject: only admin or team lead for their team
        if (role !== "admin" && role !== "team_lead") {
          return res.status(403).json({ message: "Only admin or team lead can approve or reject leave" });
        }
        if (leave.status !== "pending") {
          return res.status(400).json({ message: "Leave request already processed" });
        }
        const visibleIds = await getVisibleEmployeeIds(req);
        if (visibleIds !== null && !visibleIds.includes(leave.employeeId)) {
          return res.status(403).json({ message: "You can only approve/reject leave for your team members" });
        }
        const status = body.status === "rejected" ? "rejected" : "approved";
        const updated = await storage.updateLeaveRequest(id, {
          status,
          approvedById: userId,
          approvedAt: new Date(),
        });
        if (!updated) return res.status(500).json({ message: "Update failed" });
        return res.json(updated);
      }

      // Edit content (leaveType, startDate, endDate, reason): only for pending, by owner or team lead or admin
      if (leave.status !== "pending") {
        return res.status(400).json({ message: "Only pending leave requests can be edited" });
      }
      const canEdit =
        leave.employeeId === userId ||
        role === "admin" ||
        (role === "team_lead" && (await getVisibleEmployeeIds(req))?.includes(leave.employeeId));
      if (!canEdit) {
        return res.status(403).json({ message: "You can only edit your own pending leave or your team members'" });
      }
      const validTypes = ["on_duty", "missed_punch", "on_leave", "loss_of_pay", "personal", "sick", "casual", "emergency", "other"];
      const data: Partial<{ leaveType: string; startDate: string; endDate: string; reason: string | null }> = {};
      if (body.leaveType !== undefined) {
        const leaveType = String(body.leaveType).trim();
        if (!validTypes.includes(leaveType)) return res.status(400).json({ message: "Invalid leave type" });
        data.leaveType = leaveType;
      }
      if (body.startDate !== undefined) data.startDate = String(body.startDate).trim().slice(0, 10);
      if (body.endDate !== undefined) data.endDate = String(body.endDate).trim().slice(0, 10);
      if (body.reason !== undefined) data.reason = body.reason === null || body.reason === "" ? null : String(body.reason).trim();
      const startDate = data.startDate ?? (leave as any).startDate ?? (leave as any).start_date;
      const endDate = data.endDate ?? (leave as any).endDate ?? (leave as any).end_date;
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ message: "Start date must be before or equal to end date" });
      }
      if (Object.keys(data).length === 0) return res.json(leave);
      const updated = await storage.updateLeaveRequest(id, data);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: monthly target (for employees + team_lead popup on login) ---
  app.get("/api/staff/monthly-target", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      if (role === "admin") {
        return res.json({ forStaffOnly: true });
      }
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

      if (role === "team_lead") {
        const employees = await storage.listEmployees({ teamLeadId: userId });
        const targetsThisMonth = await storage.getMonthlyTargetsByMonth(month, year);
        const targetByUser = new Map(targetsThisMonth.map((t) => [(t as any).userId ?? (t as any).user_id, t]));
        let overallTarget = 0;
        let teamLeadsThisMonth = 0;
        let teamLeadsConverted = 0;
        let teamLeadsOpen = 0;
        let teamSanctionAmount = 0;
        for (const emp of employees) {
          const mt = targetByUser.get(emp.id);
          const target = mt ? getTargetLeads(mt) : (Number((emp as any).monthlyLeadTarget) || 0);
          overallTarget += target;
          const empLeads = await storage.getLeadsByEmployee(emp.id, from, to);
          teamLeadsThisMonth += empLeads.length;
          const converted = empLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
          teamLeadsConverted += converted;
          teamLeadsOpen += empLeads.filter((l) => (l.status || "").toLowerCase() === "open").length;
          empLeads.forEach((l) => {
            if ((l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned") {
              teamSanctionAmount += getLeadAmount(l as any);
            }
          });
        }
        const achievementPct = overallTarget > 0 ? Math.round((teamLeadsThisMonth / overallTarget) * 100) : 0;
        const jointVisits = await storage.getJointVisitsCount(userId, from, to);
        let conveyancePct = 0;
        if (jointVisits >= 4 && teamLeadsThisMonth >= 10) {
          if (achievementPct >= 100) conveyancePct = 120;
          else if (achievementPct >= 80) conveyancePct = 50;
        }
        return res.json({
          forTeamLead: true,
          monthTarget: overallTarget,
          achievement: teamLeadsThisMonth,
          achievementPct,
          overallLeadsGenerated: teamLeadsThisMonth,
          leadsConverted: teamLeadsConverted,
          leadsOpen: teamLeadsOpen,
          sanctionAmount: Math.round(teamSanctionAmount),
          conveyancePct,
          monthLabel,
        });
      }

      const allocatedTarget = await storage.getMonthlyTarget(userId, month, year);
      const user = await storage.getUser(userId);
      const monthTargetFromUser = user && (user as any).monthlyLeadTarget != null ? Number((user as any).monthlyLeadTarget) : null;
      const monthTarget = allocatedTarget ? getTargetLeads(allocatedTarget) : ((monthTargetFromUser != null && !Number.isNaN(monthTargetFromUser)) ? monthTargetFromUser : 0);
      const leads = await storage.getLeadsByEmployee(userId, from, to);
      const overallLeadsGenerated = leads.length;
      const leadsConverted = leads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
      const leadsOpen = leads.filter((l) => (l.status || "").toLowerCase() === "open").length;
      let sanctionAmount = 0;
      leads.forEach((l) => {
        if ((l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned") {
          sanctionAmount += getLeadAmount(l as any);
        }
      });
      const achievement = overallLeadsGenerated;
      const achievementPct = monthTarget > 0 ? Math.round((achievement / monthTarget) * 100) : 0;
      const budgetAchievementPct = monthTarget > 0 ? Math.round((leadsConverted / monthTarget) * 100) : 0;
      let conveyancePct = 0;
      if (overallLeadsGenerated >= 20) {
        if (budgetAchievementPct >= 100) conveyancePct = 120;
        else if (budgetAchievementPct >= 60) conveyancePct = 50;
      }
      res.json({
        monthTarget,
        achievement,
        achievementPct,
        overallLeadsGenerated,
        leadsConverted,
        leadsOpen,
        sanctionAmount: Math.round(sanctionAmount),
        conveyancePct,
        monthLabel,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Hierarchical Monthly Target Allocation ---
  app.get("/api/staff/targets/company", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const month = parseInt(String(req.query.month), 10);
      const year = parseInt(String(req.query.year), 10);
      if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Valid month (1-12) and year required" });
      }
      const row = await storage.getCompanyMonthlyTarget(month, year);
      res.json(row ?? { month, year, totalBudget: "0", totalLeads: 0, isLocked: 0 });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/targets/company", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as { month?: number; year?: number; totalBudget?: number | string; totalLeads?: number };
      const month = Number(body?.month);
      const year = Number(body?.year);
      if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Valid month (1-12) and year required" });
      }
      const existing = await storage.getCompanyMonthlyTarget(month, year);
      if (existing && existing.isLocked === 1) {
        return res.status(400).json({ message: "Targets are locked for this month" });
      }
      const totalBudget = body.totalBudget != null ? Number(body.totalBudget) : 0;
      const totalLeads = Number(body.totalLeads) || 0;
      const created = await storage.upsertCompanyMonthlyTarget({
        month,
        year,
        totalBudget: String(totalBudget),
        totalLeads,
        createdBy: (req.user as any).id,
      });
      await storage.insertTargetAuditLog({
        month,
        year,
        action: existing ? "updated" : "created",
        changedBy: (req.user as any).id,
        newValue: JSON.stringify({ totalBudget, totalLeads }),
      });
      res.json(created);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/targets/leaders", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const month = parseInt(String(req.query.month), 10);
      const year = parseInt(String(req.query.year), 10);
      if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Valid month and year required" });
      }
      const leaders = await storage.listTeamLeads();
      const targets = await storage.getMonthlyTargetsByMonth(month, year);
      const byUser = new Map(targets.map((t) => [t.userId, t]));
      const list = leaders.map((u) => {
        const t = byUser.get(u.id);
        return {
          userId: u.id,
          fullName: (u as any).fullName || (u as any).username,
          username: (u as any).username,
          assignedBudget: t ? String((t as any).assignedBudget ?? (t as any).assigned_budget ?? "0") : "0",
          assignedLeads: getTargetLeads(t),
        };
      });
      res.json({ leaders: list });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/targets/leaders", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as { month?: number; year?: number; leaderTargets?: Array<{ userId: string; assignedBudget: number | string; assignedLeads: number }> };
      const month = Number(body?.month);
      const year = Number(body?.year);
      if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Valid month and year required" });
      }
      const company = await storage.getCompanyMonthlyTarget(month, year);
      if (company && (company.isLocked === 1 || (company as any).is_locked === 1)) {
        return res.status(400).json({ message: "Targets are locked for this month" });
      }
      const totalBudget = getCompanyBudget(company);
      const leaderTargets = Array.isArray(body.leaderTargets) ? body.leaderTargets : [];
      let sumBudget = 0;
      for (const lt of leaderTargets) {
        const b = parseAmount(lt.assignedBudget);
        if (!Number.isNaN(b)) sumBudget += b;
      }
      if (totalBudget <= 0 && sumBudget > 0) {
        return res.status(400).json({
          message: "Save the company target (Step 1) first, then save leader targets.",
          totalBudget,
          sumBudget,
        });
      }
      const diff = Math.abs(sumBudget - totalBudget);
      const budgetMatch = diff < 0.02 || (totalBudget > 0 && diff / totalBudget < 1e-9);
      if (!budgetMatch) {
        return res.status(400).json({
          message: "Sum of leader budgets must equal company budget",
          totalBudget,
          sumBudget,
        });
      }
      const adminId = (req.user as any).id;
      for (const lt of leaderTargets) {
        await storage.upsertMonthlyTarget({
          userId: lt.userId,
          month,
          year,
          assignedBudget: lt.assignedBudget,
          assignedLeads: Number(lt.assignedLeads) || 0,
          createdBy: adminId,
        });
      }
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/targets/employees", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const month = parseInt(String(req.query.month), 10);
      const year = parseInt(String(req.query.year), 10);
      const leaderId = (req.query.leaderId as string) || (req.user as any).id;
      if (Number.isNaN(month) || Number.isNaN(year)) {
        return res.status(400).json({ message: "Valid month and year required" });
      }
      const role = (req.user as any).role;
      if (role === "team_lead" && leaderId !== (req.user as any).id) {
        return res.status(403).json({ message: "Can only view own team" });
      }
      const employees = await storage.listEmployees({ teamLeadId: leaderId });
      const targets = await storage.getMonthlyTargetsByMonth(month, year);
      const byUser = new Map(targets.map((t) => [t.userId, t]));
      const list = employees.map((u) => {
        const t = byUser.get(u.id);
        return {
          userId: u.id,
          fullName: (u as any).fullName || (u as any).username,
          username: (u as any).username,
          employeeNumber: (u as any).employeeNumber,
          assignedBudget: t ? String((t as any).assignedBudget ?? (t as any).assigned_budget ?? "0") : "0",
          assignedLeads: getTargetLeads(t),
        };
      });
      res.json({ employees: list });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/targets/employees", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const body = req.body as { month?: number; year?: number; employeeTargets?: Array<{ userId: string; assignedBudget: number | string; assignedLeads: number }> };
      const month = Number(body?.month);
      const year = Number(body?.year);
      const leaderId = (req.user as any).id;
      const role = (req.user as any).role;
      if (role !== "admin" && role !== "team_lead") {
        return res.status(403).json({ message: "Only admin or leader can allocate" });
      }
      if (Number.isNaN(month) || Number.isNaN(year)) {
        return res.status(400).json({ message: "Valid month and year required" });
      }
      const leaderTarget = await storage.getMonthlyTarget(leaderId, month, year);
      const leaderBudget = getTargetBudget(leaderTarget);
      const leaderLeads = getTargetLeads(leaderTarget);
      const company = await storage.getCompanyMonthlyTarget(month, year);
      if (company && company.isLocked === 1) {
        return res.status(400).json({ message: "Targets are locked for this month" });
      }
      const employeeTargets = Array.isArray(body.employeeTargets) ? body.employeeTargets : [];
      let sumBudget = 0;
      let sumLeads = 0;
      for (const et of employeeTargets) {
        sumBudget += parseAmount(et.assignedBudget);
        sumLeads += Number(et.assignedLeads) || 0;
      }
      const budgetMatch = Math.abs(sumBudget - leaderBudget) < 0.01;
      if (!budgetMatch || sumLeads !== leaderLeads) {
        return res.status(400).json({
          message: "Sum of employee budgets must equal your assigned budget and sum of leads must equal your assigned leads",
          leaderBudget,
          leaderLeads,
          sumBudget,
          sumLeads,
        });
      }
      for (const et of employeeTargets) {
        await storage.upsertMonthlyTarget({
          userId: et.userId,
          month,
          year,
          assignedBudget: et.assignedBudget,
          assignedLeads: Number(et.assignedLeads) || 0,
          createdBy: leaderId,
        });
      }
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/targets/lock", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as { month?: number; year?: number; locked?: boolean };
      const month = Number(body?.month);
      const year = Number(body?.year);
      const locked = body?.locked === true;
      if (Number.isNaN(month) || Number.isNaN(year)) {
        return res.status(400).json({ message: "Valid month and year required" });
      }
      await storage.setMonthlyTargetsLocked(month, year, locked, (req.user as any).id);
      await storage.insertTargetAuditLog({
        month,
        year,
        action: locked ? "locked" : "unlocked",
        changedBy: (req.user as any).id,
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/targets/performance", requireAuth, async (req, res, next) => {
    try {
      const month = parseInt(String(req.query.month), 10);
      const year = parseInt(String(req.query.year), 10);
      const userId = (req.query.userId as string) || (req.user as any).id;
      if (Number.isNaN(month) || Number.isNaN(year)) {
        return res.status(400).json({ message: "Valid month and year required" });
      }
      const role = (req.user as any).role;
      if (role === "employee" && userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Can only view own performance" });
      }
      const target = await storage.getMonthlyTarget(userId, month, year);
      const { achievedBudget, achievedLeads } = await storage.getAchievedBudgetAndLeads(userId, month, year);
      const assignedBudget = getTargetBudget(target);
      const achievementPct = assignedBudget > 0 ? Math.round((achievedBudget / assignedBudget) * 10000) / 100 : 0;
      await storage.upsertMonthlyPerformance({
        userId,
        month,
        year,
        achievedBudget,
        achievedLeads,
        achievementPercentage: achievementPct,
      });
      res.json({
        userId,
        month,
        year,
        assignedBudget: target ? String((target as any).assignedBudget ?? (target as any).assigned_budget ?? "0") : "0",
        assignedLeads: getTargetLeads(target),
        achievedBudget,
        achievedLeads,
        achievementPercentage: achievementPct,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: my dashboard (employee-only; admin/team_lead use /dashboard) ---
  app.get("/api/staff/my-dashboard", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      if (role === "admin" || role === "team_lead") {
        return res.status(404).json({ message: "Not for admin or team lead" });
      }
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const allocatedTarget = await storage.getMonthlyTarget(userId, month, year);
      const user = await storage.getUser(userId);
      const monthTargetFromUser = user && (user as any).monthlyLeadTarget != null ? Number((user as any).monthlyLeadTarget) : null;
      const monthTarget = allocatedTarget ? getTargetLeads(allocatedTarget) : ((monthTargetFromUser != null && !Number.isNaN(monthTargetFromUser)) ? monthTargetFromUser : 0);
      const leadsThisMonth = await storage.getLeadsByEmployee(userId, monthStart, monthEnd);
      const insuranceLeadsThisMonth = await storage.getInsuranceLeadsByEmployee(userId, monthStart, monthEnd);
      const achievement = leadsThisMonth.length;
      const achievementPct = monthTarget > 0 ? Math.round((achievement / monthTarget) * 100) : 0;
      const { achievedBudget, achievedLeads } = await storage.getAchievedBudgetAndLeads(userId, month, year);
      const assignedBudget = getTargetBudget(allocatedTarget);
      const budgetAchievementPct = assignedBudget > 0 ? Math.round((achievedBudget / assignedBudget) * 100) : 0;
      const attendanceLogs = await storage.getAttendanceLogsByEmployee(userId, monthStart, monthEnd);
      const holidayList = await storage.getHolidays(monthStart, monthEnd);
      const holidayDates = new Set<string>([
        ...holidayList.map((h: any) => String((h as any).date).slice(0, 10)),
        ...enumerateSecondSaturdays(monthStart, monthEnd),
      ]);
      const daysPresent = attendanceLogs.filter((a) => {
        const ds = String((a as any).date).slice(0, 10);
        return (a.status || "").toLowerCase() === "present" && !holidayDates.has(ds);
      }).length;
      const daysLogged = attendanceLogs.filter((a) => {
        const ds = String((a as any).date).slice(0, 10);
        return !holidayDates.has(ds);
      }).length;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const from7 = sevenDaysAgo.toISOString().slice(0, 10);
      const today = todayStr();
      const leadsLast7 = await storage.getLeadsByEmployee(userId, from7, today);
      const insuranceLeadsLast7 = await storage.getInsuranceLeadsByEmployee(userId, from7, today);
      const byDate: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        byDate[d.toISOString().slice(0, 10)] = 0;
      }
      for (const l of leadsLast7) {
        const dateStr = String(l.date).slice(0, 10);
        if (byDate[dateStr] !== undefined) byDate[dateStr]++;
      }
      for (const il of insuranceLeadsLast7) {
        const dateStr = String((il as any).date ?? il.date).slice(0, 10);
        if (byDate[dateStr] !== undefined) byDate[dateStr]++;
      }
      const leadsLast7Days = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
      res.json({
        monthLabel: now.toLocaleString("default", { month: "long", year: "numeric" }),
        leadsThisMonth: achievement,
        insuranceLeadsThisMonth: insuranceLeadsThisMonth.length,
        monthTarget,
        achievementPct,
        assignedBudget,
        disbursedAmount: achievedBudget,
        budgetAchievementPct,
        daysPresent,
        daysLogged,
        leadsLast7Days,
      });
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/staff/employees/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const currentUserId = (req.user as any).id;
      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if ((target as any).role === "admin") {
        return res.status(400).json({ message: "Cannot delete an admin user" });
      }
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/employees/:id", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const id = req.params.id;
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      const currentUserId = (req.user as any).id;
      const role = (req.user as any).role;
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (role === "admin") {
        if (body.fullName !== undefined) data.fullName = typeof body.fullName === "string" ? body.fullName.trim() || null : null;
        if (body.email !== undefined) data.email = typeof body.email === "string" ? body.email.trim() || null : null;
        if (body.phone !== undefined) data.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
        if (body.monthlyLeadTarget !== undefined) {
          const v = body.monthlyLeadTarget;
          data.monthlyLeadTarget = v === null || v === "" ? null : Number(v);
          if (data.monthlyLeadTarget !== null && Number.isNaN(data.monthlyLeadTarget as number)) data.monthlyLeadTarget = null;
        }
        if (body.teamLeadId !== undefined) data.teamLeadId = body.teamLeadId === null || body.teamLeadId === "" ? null : body.teamLeadId;
        if (body.designation !== undefined) data.designation = typeof body.designation === "string" ? body.designation.trim() || null : null;
        if (body.bankAccountNumber !== undefined) data.bankAccountNumber = typeof body.bankAccountNumber === "string" ? body.bankAccountNumber.trim() || null : null;
        if (body.bankIfsc !== undefined) data.bankIfsc = typeof body.bankIfsc === "string" ? body.bankIfsc.trim() || null : null;
        if (body.pan !== undefined) data.pan = typeof body.pan === "string" ? body.pan.trim() || null : null;
        if (body.uan !== undefined) data.uan = typeof body.uan === "string" ? body.uan.trim() || null : null;
        if (body.dateOfJoining !== undefined) data.dateOfJoining = typeof body.dateOfJoining === "string" ? (body.dateOfJoining.trim() || null) : null;
        if (body.department !== undefined) data.department = typeof body.department === "string" ? body.department.trim() || null : null;
        if (body.location !== undefined) data.location = typeof body.location === "string" ? body.location.trim() || null : null;
        if (body.dateOfBirth !== undefined) data.dateOfBirth = typeof body.dateOfBirth === "string" ? (body.dateOfBirth.trim() || null) : null;
        if (body.gender !== undefined) data.gender = typeof body.gender === "string" ? body.gender.trim() || null : null;
        if (body.employmentStatus !== undefined) {
          const v = String(body.employmentStatus || "").trim().toLowerCase();
          if (["probation", "confirmed", "resigned"].includes(v)) data.employmentStatus = v;
        }
        if (body.probationStartDate !== undefined) {
          data.probationStartDate = typeof body.probationStartDate === "string" ? (body.probationStartDate.trim() || null) : null;
        }
      } else if (role === "team_lead") {
        if ((target as any).role !== "employee") return res.status(403).json({ message: "Can only assign employees to your team" });
        if (body.teamLeadId !== undefined) {
          const v = body.teamLeadId;
          if (v === currentUserId || v === null || v === "") {
            const newVal = v === currentUserId ? currentUserId : null;
            const team = await storage.listEmployees({ teamLeadId: currentUserId });
            const unassigned = await storage.listEmployees({ unassignedOnly: true });
            const inMyTeam = team.some((u) => u.id === id);
            const isUnassigned = unassigned.some((u) => u.id === id);
            if (newVal === currentUserId && !isUnassigned) {
              return res.status(403).json({ message: "Can only add unassigned employees to your team" });
            }
            if (newVal === null && !inMyTeam) {
              return res.status(403).json({ message: "Can only remove employees from your own team" });
            }
            data.teamLeadId = newVal;
          } else {
            return res.status(403).json({ message: "You can only add or remove employees to/from your own team" });
          }
        }
      }
      if (Object.keys(data).length === 0) return res.status(400).json({ message: "No valid fields to update" });
      const updated = await storage.updateUser(id, data as any);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      res.json({
        id: updated.id,
        username: updated.username,
        role: updated.role,
        fullName: updated.fullName ?? null,
        email: updated.email ?? null,
        phone: updated.phone ?? null,
        employeeNumber: (updated as any).employeeNumber ?? null,
        monthlyLeadTarget: (updated as any).monthlyLeadTarget ?? null,
        teamLeadId: (updated as any).teamLeadId ?? null,
        designation: (updated as any).designation ?? null,
        bankAccountNumber: (updated as any).bankAccountNumber ?? null,
        bankIfsc: (updated as any).bankIfsc ?? null,
        pan: (updated as any).pan ?? null,
        uan: (updated as any).uan ?? null,
        dateOfJoining: (updated as any).dateOfJoining ?? null,
        department: (updated as any).department ?? null,
        location: (updated as any).location ?? null,
        dateOfBirth: (updated as any).dateOfBirth ?? null,
        gender: (updated as any).gender ?? null,
        employmentStatus: (updated as any).employmentStatus ?? null,
        probationStartDate: (updated as any).probationStartDate ?? null,
        confirmedAt: (updated as any).confirmedAt ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: profile ---
  app.get("/api/staff/profile/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
        avatarUrl: (user as any).avatarUrl ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/profile/avatar", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const dataUrl = (req.body?.image as string)?.trim();
      if (!dataUrl || !dataUrl.startsWith("data:image/")) {
        return res.status(400).json({ message: "Send JSON body with image: data:image/...;base64,..." });
      }
      const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) return res.status(400).json({ message: "Invalid image data URL" });
      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const base64 = match[2];
      const buf = Buffer.from(base64, "base64");
      if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ message: "Image too large (max 5MB)" });
      const filename = `${userId}.${ext}`;
      const filepath = path.join(AVATARS_DIR, filename);
      fs.writeFileSync(filepath, buf);
      const avatarUrl = "/uploads/avatars/" + filename;
      await storage.updateUser(userId, { avatarUrl });
      res.json({ avatarUrl });
    } catch (e) {
      next(e);
    }
  });

  app.patch("/api/staff/profile/me", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (body.fullName !== undefined) data.fullName = body.fullName;
      if (body.email !== undefined) data.email = body.email;
      if (body.phone !== undefined) data.phone = body.phone;
      if (body.password !== undefined && body.password) data.password = body.password;
      if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
      const updated = await storage.updateUser(userId, data);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      res.json({
        id: updated.id,
        username: updated.username,
        role: updated.role,
        fullName: updated.fullName ?? null,
        email: updated.email ?? null,
        phone: updated.phone ?? null,
        avatarUrl: (updated as any).avatarUrl ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: employees (admin: all; team_lead: their team or unassigned list) ---
  app.get("/api/staff/employees", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const role = (req.user as any).role;
      const unassignedOnly = (req.query.unassigned as string) === "1";
      let list: Awaited<ReturnType<typeof storage.listEmployees>> = [];
      if (role === "admin") {
        list = await storage.listEmployees();
      } else if (role === "team_lead") {
        list = unassignedOnly
          ? await storage.listEmployees({ unassignedOnly: true })
          : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      }
      res.json(
        list.map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          fullName: u.fullName ?? null,
          email: u.email ?? null,
          phone: u.phone ?? null,
          employeeNumber: (u as any).employeeNumber ?? null,
          monthlyLeadTarget: (u as any).monthlyLeadTarget ?? null,
          teamLeadId: (u as any).teamLeadId ?? null,
          designation: (u as any).designation ?? null,
          bankAccountNumber: (u as any).bankAccountNumber ?? null,
          bankIfsc: (u as any).bankIfsc ?? null,
          pan: (u as any).pan ?? null,
          uan: (u as any).uan ?? null,
          dateOfJoining: (u as any).dateOfJoining ?? null,
          department: (u as any).department ?? null,
          location: (u as any).location ?? null,
          dateOfBirth: (u as any).dateOfBirth ?? null,
          gender: (u as any).gender ?? null,
          employmentStatus: (u as any).employmentStatus ?? null,
          probationStartDate: (u as any).probationStartDate ?? null,
          confirmedAt: (u as any).confirmedAt ?? null,
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/team-leads", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const list = await storage.listTeamLeads();
      res.json(
        list.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName ?? null,
        }))
      );
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/employees", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body || {};
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() || null : null;
      const email = typeof body.email === "string" ? body.email.trim() || null : null;
      const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
      const monthlyLeadTarget = body.monthlyLeadTarget != null ? Number(body.monthlyLeadTarget) : undefined;
      const role = body.role === "team_lead" ? "team_lead" : "employee";
      const teamLeadId = body.teamLeadId != null && body.teamLeadId !== "" ? String(body.teamLeadId) : undefined;
      const dateOfJoining =
        typeof body.dateOfJoining === "string" && body.dateOfJoining.trim()
          ? body.dateOfJoining.trim().slice(0, 10)
          : todayStr();
      const user = await storage.createUser({
        username,
        password,
        role,
        fullName,
        email,
        phone,
        ...(monthlyLeadTarget != null && !Number.isNaN(monthlyLeadTarget) ? { monthlyLeadTarget } : {}),
        ...(teamLeadId && role === "employee" ? { teamLeadId } : {}),
        dateOfJoining,
        probationStartDate: role === "employee" ? dateOfJoining : null,
        employmentStatus: role === "employee" ? "probation" : "confirmed",
      } as any);
      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
        monthlyLeadTarget: (user as any).monthlyLeadTarget ?? null,
        teamLeadId: (user as any).teamLeadId ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: dashboard summary (admin or team_lead; team_lead sees only their team) ---
  app.get("/api/staff/dashboard", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const today = todayStr();
      const visibleIds = await getVisibleEmployeeIds(req);
      const employees = visibleIds === null
        ? await storage.listEmployees()
        : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      const allAttendance = await storage.getAllAttendanceLogs(today, today);
      const allLeads = await storage.getAllLeads({ fromDate: today, toDate: today });
      const closures = await storage.getAllLeads({ status: "closed_won" });
      const filterByVisible = <T extends { employeeId: string }>(arr: T[]): T[] =>
        visibleIds === null ? arr : arr.filter((x) => visibleIds.includes(x.employeeId));
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const from14 = fourteenDaysAgo.toISOString().slice(0, 10);
      const from30 = thirtyDaysAgo.toISOString().slice(0, 10);
      const leadsLast30 = await storage.getAllLeads({ fromDate: from30, toDate: today });
      const leadsLast30Filtered = filterByVisible(leadsLast30);
      const byDate: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        byDate[d.toISOString().slice(0, 10)] = 0;
      }
      const byStatus: Record<string, number> = {};
      const byEmployee: Record<string, number> = {};
      for (const l of leadsLast30Filtered) {
        const dateStr = String(l.date).slice(0, 10);
        if (dateStr >= from14) byDate[dateStr] = (byDate[dateStr] ?? 0) + 1;
        const st = (l.status || "open").toLowerCase();
        byStatus[st] = (byStatus[st] ?? 0) + 1;
        byEmployee[l.employeeId] = (byEmployee[l.employeeId] ?? 0) + 1;
      }
      const leadsLast14Days = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
      const leadsByStatus = Object.entries(byStatus).map(([status, count]) => ({ status, count }));
      const leadsByEmployee = Object.entries(byEmployee).map(([id, count]) => ({
        employeeId: id,
        employeeName: byId[id]?.name ?? id,
        employeeNumber: byId[id]?.number ?? "",
        count,
      }));
      const attendanceTodayFiltered = filterByVisible(allAttendance);
      const leadsTodayFiltered = filterByVisible(allLeads);
      const closuresFiltered = filterByVisible(closures);
      const payload: Record<string, unknown> = {
        today,
        employeeCount: employees.length,
        attendanceToday: attendanceTodayFiltered.map((a) => ({
          ...a,
          employeeName: byId[a.employeeId]?.name ?? a.employeeId,
          employeeNumber: byId[a.employeeId]?.number ?? "",
        })),
        leadsToday: leadsTodayFiltered.map((l) => ({
          ...l,
          employeeName: byId[l.employeeId]?.name ?? l.employeeId,
          employeeNumber: byId[l.employeeId]?.number ?? "",
        })),
        totalClosures: closuresFiltered.length,
        leadsLast14Days,
        leadsByStatus,
        leadsByEmployee,
      };
      const role = (req.user as any).role;
      if (role === "admin" || role === "team_lead") {
        const visibleSet = new Set((visibleIds ?? []).map(String));
        const scoped = role === "team_lead"
          ? employees.filter((u) => u.role === "employee" && visibleSet.has(u.id))
          : employees.filter((u) => u.role === "employee" || u.role === "team_lead");
        const onNotice: Array<Record<string, unknown>> = [];
        for (const p of scoped) {
          const list = await storage.getResignationRequestsByEmployee(p.id);
          const active = pickActiveApprovedResignation(list as any[]);
          if (!active) continue;
          onNotice.push({
            id: active.row.id,
            employeeId: p.id,
            employeeName: byId[p.id]?.name ?? p.id,
            employeeNumber: byId[p.id]?.number ?? "",
            employeeRole: p.role,
            effectiveLastWorkingDay: active.lwd,
            noticeDays: (active.row as any).noticeDays ?? null,
            daysLeft: active.daysLeft,
          });
        }
        onNotice.sort((a, b) => Number((a as any).daysLeft ?? 9999) - Number((b as any).daysLeft ?? 9999));
        payload.onNoticeResignations = onNotice;
      }
      if (role === "team_lead") {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        const teamLeadId = (req.user as any).id;
        const leaderOwnTarget = await storage.getMonthlyTarget(teamLeadId, month, year);
        const leaderAssignedLeads = leaderOwnTarget ? (leaderOwnTarget.assignedLeads ?? (leaderOwnTarget as any).assigned_leads ?? 0) : 0;
        const leaderAssignedBudget = getTargetBudget(leaderOwnTarget);
        const leaderTargetLeads = getTargetLeads(leaderOwnTarget);
        let overallTarget = 0;
        let teamDisbursedAmount = 0;
        const teamMembersSummary: { employeeId: string; employeeName: string; employeeNumber: string; monthlyTarget: number; assignedBudget: number; leadsThisMonth: number; disbursedAmount: number; achievementPct: number; leadsConverted: number; isTeamLead?: boolean }[] = [];
        let teamLeadsThisMonth = 0;
        let teamLeadsConverted = 0;
        const leaderOwnLeads = await storage.getLeadsByEmployee(teamLeadId, monthStart, monthEnd);
        let leaderDisbursedAmount = 0;
        for (const l of leaderOwnLeads) {
          if ((l.status || "").toLowerCase() === "disbursed") {
            const amt = getLeadAmount(l as any);
            leaderDisbursedAmount += amt;
            teamDisbursedAmount += amt;
          }
        }
        const leaderConverted = leaderOwnLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
        const leaderAchievementPct = leaderTargetLeads > 0
          ? Math.round((leaderOwnLeads.length / leaderTargetLeads) * 100)
          : (leaderAssignedBudget > 0 ? Math.round((leaderDisbursedAmount / leaderAssignedBudget) * 100) : 0);
        const leaderUser = await storage.getUser(teamLeadId);
        const leaderName = leaderUser ? ((leaderUser as any).fullName?.trim() || leaderUser.username || teamLeadId) : (byId[teamLeadId]?.name ?? (req.user as any).fullName ?? (req.user as any).username ?? "Team lead");
        const leaderEmpNum = leaderUser ? String((leaderUser as any).employeeNumber ?? "") : (byId[teamLeadId]?.number ?? "");
        for (const emp of employees) {
          const mt = await storage.getMonthlyTarget(emp.id, month, year);
          const target = mt ? getTargetLeads(mt) : (Number((emp as any).monthlyLeadTarget) || 0);
          overallTarget += target;
          const empLeads = await storage.getLeadsByEmployee(emp.id, monthStart, monthEnd);
          const converted = empLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
          let empDisbursedAmount = 0;
          for (const l of empLeads) {
            if ((l.status || "").toLowerCase() === "disbursed") {
              const amt = getLeadAmount(l as any);
              empDisbursedAmount += amt;
              teamDisbursedAmount += amt;
            }
          }
          teamLeadsThisMonth += empLeads.length;
          teamLeadsConverted += converted;
          const empAssignedBudget = getTargetBudget(mt);
          const achievementPct = target > 0
            ? Math.round((empLeads.length / target) * 100)
            : (empAssignedBudget > 0 ? Math.round((empDisbursedAmount / empAssignedBudget) * 100) : 0);
          teamMembersSummary.push({
            employeeId: emp.id,
            employeeName: byId[emp.id]?.name ?? emp.id,
            employeeNumber: byId[emp.id]?.number ?? "",
            monthlyTarget: target,
            assignedBudget: empAssignedBudget,
            leadsThisMonth: empLeads.length,
            disbursedAmount: empDisbursedAmount,
            achievementPct,
            leadsConverted: converted,
          });
        }
        if (employees.length === 0 && leaderAssignedLeads > 0) {
          overallTarget = leaderAssignedLeads;
        }
        const achievementPct = overallTarget > 0
          ? Math.round((teamLeadsThisMonth / overallTarget) * 100)
          : (leaderAssignedBudget > 0 ? Math.round((teamDisbursedAmount / leaderAssignedBudget) * 100) : 0);
        const jointVisits = await storage.getJointVisitsCount(teamLeadId, monthStart, monthEnd);
        let conveyancePct = 0;
        if (jointVisits >= 4 && teamLeadsThisMonth >= 10) {
          if (achievementPct >= 100) conveyancePct = 120;
          else if (achievementPct >= 80) conveyancePct = 50;
        }
        teamMembersSummary.unshift({
          employeeId: teamLeadId,
          employeeName: leaderName,
          employeeNumber: leaderEmpNum,
          monthlyTarget: leaderTargetLeads,
          assignedBudget: leaderAssignedBudget,
          leadsThisMonth: leaderOwnLeads.length,
          disbursedAmount: leaderDisbursedAmount,
          achievementPct: leaderAchievementPct,
          leadsConverted: leaderConverted,
          isTeamLead: true,
        });
        payload.overallTarget = overallTarget;
        payload.teamDisbursedAmount = teamDisbursedAmount;
        payload.teamLeadsThisMonth = teamLeadsThisMonth;
        payload.achievementPct = achievementPct;
        payload.conveyancePct = conveyancePct;
        payload.teamMembersSummary = teamMembersSummary;
        payload.monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
        payload.leaderAssignedBudget = leaderAssignedBudget;
      }
      if (role === "admin") {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const fyParamRaw = typeof req.query.fyStart === "string" ? req.query.fyStart : "";
        const fyFromQuery = /^\d{4}$/.test(fyParamRaw) ? Number(fyParamRaw) : NaN;
        const fiscalYearStart = Number.isFinite(fyFromQuery) ? fyFromQuery : getFiscalYearStart(today);
        const employeeIdFilterRaw = typeof req.query.employeeId === "string" ? req.query.employeeId.trim() : "";
        const employeeIdFilter = employeeIdFilterRaw ? employeeIdFilterRaw : null;
        const validStaffIds = new Set(employees.map((e) => e.id));
        const selectedEmployeeId = employeeIdFilter && validStaffIds.has(employeeIdFilter) ? employeeIdFilter : null;
        const monthStart = new Date(year, now.getMonth(), 1).toISOString().slice(0, 10);
        const monthEnd = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);
        const ytdStart = `${year}-01-01`;
        const ytdEnd = today;
        let companyTargetYtd = 0;
        let companyAchievedYtd = 0;
        for (let m = 1; m <= month; m++) {
          const ct = await storage.getCompanyMonthlyTarget(m, year);
          companyTargetYtd += getCompanyBudget(ct);
        }
        const leadsYtd = await storage.getAllLeads({ fromDate: ytdStart, toDate: ytdEnd });
        const disbursedYtd = leadsYtd.filter(
          (l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned"
        );
        for (const l of disbursedYtd) companyAchievedYtd += getLeadAmount(l as any);

        const ctMtd = await storage.getCompanyMonthlyTarget(month, year);
        const companyTargetMtd = getCompanyBudget(ctMtd);
        const leadsMtd = await storage.getAllLeads({ fromDate: monthStart, toDate: monthEnd });
        const disbursedMtd = leadsMtd.filter(
          (l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned"
        );
        let companyAchievedMtd = 0;
        for (const l of disbursedMtd) companyAchievedMtd += getLeadAmount(l as any);

        const allEmployeeTargetAchievement: {
          employeeId: string;
          employeeName: string;
          employeeNumber: string;
          monthlyTarget: number;
          assignedBudget: number;
          achievedLeads: number;
          achievedBudget: number;
          achievementPct: number;
          leadsConverted: number;
        }[] = [];
        const targetsThisMonth = await storage.getMonthlyTargetsByMonth(month, year);
        const targetByUser = new Map(targetsThisMonth.map((t) => [t.userId, t]));
        for (const emp of employees) {
          const mt = targetByUser.get(emp.id);
          const targetLeads = mt ? getTargetLeads(mt) : (Number((emp as any).monthlyLeadTarget) || 0);
          const assignedBudget = getTargetBudget(mt);
          const { achievedBudget, achievedLeads } = await storage.getAchievedBudgetAndLeads(emp.id, month, year);
          const achievementPct = targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0;
          const empLeads = await storage.getLeadsByEmployee(emp.id, monthStart, monthEnd);
          const leadsConverted = empLeads.filter(
            (l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned"
          ).length;
          allEmployeeTargetAchievement.push({
            employeeId: emp.id,
            employeeName: byId[emp.id]?.name ?? emp.id,
            employeeNumber: byId[emp.id]?.number ?? "",
            monthlyTarget: targetLeads,
            assignedBudget,
            achievedLeads,
            achievedBudget,
            achievementPct,
            leadsConverted,
          });
        }

        const teamLeads = await storage.listTeamLeads();
        const conveyanceReport: {
          employeeId: string;
          employeeName: string;
          employeeNumber: string;
          isTeamLead: boolean;
          teamLeadsThisMonth: number;
          achievementPct: number;
          jointVisits: number;
          conveyancePct: number;
        }[] = [];
        for (const emp of employees) {
          const isTeamLead = teamLeads.some((tl) => tl.id === emp.id);
          let teamLeadsThisMonth = 0;
          let achievementPct = 0;
          let conveyancePct = 0;
          let jointVisits = 0;
          if (isTeamLead) {
            const teamMembers = await storage.listEmployees({ teamLeadId: emp.id });
            let overallTarget = 0;
            for (const m of teamMembers) {
              const mt = targetByUser.get(m.id);
              const t = mt ? getTargetLeads(mt) : (Number((m as any).monthlyLeadTarget) || 0);
              overallTarget += t;
              const leads = await storage.getLeadsByEmployee(m.id, monthStart, monthEnd);
              teamLeadsThisMonth += leads.length;
            }
            achievementPct = overallTarget > 0 ? Math.round((teamLeadsThisMonth / overallTarget) * 100) : 0;
            jointVisits = await storage.getJointVisitsCount(emp.id, monthStart, monthEnd);
            if (jointVisits >= 4 && teamLeadsThisMonth >= 10) {
              if (achievementPct >= 100) conveyancePct = 120;
              else if (achievementPct >= 80) conveyancePct = 50;
            }
          }
          conveyanceReport.push({
            employeeId: emp.id,
            employeeName: byId[emp.id]?.name ?? emp.id,
            employeeNumber: byId[emp.id]?.number ?? "",
            isTeamLead,
            teamLeadsThisMonth,
            achievementPct,
            jointVisits,
            conveyancePct,
          });
        }

        const insuranceLeadsMonth = await storage.getAllInsuranceLeads({ fromDate: monthStart, toDate: monthEnd });
        let expenditureMisc = 0;
        for (const il of insuranceLeadsMonth) {
          expenditureMisc += parseAmount((il as { miscellaneousExpenses?: string | null }).miscellaneousExpenses);
        }

        // FTD Achieved: loans and insurance counts for FTD (today), MTD, YTD
        const leadsFtd = leadsTodayFiltered;
        const leadsMtdFiltered = filterByVisible(leadsMtd);
        const leadsYtdFiltered = filterByVisible(leadsYtd);
        const insuranceLeadsFtd = filterByVisible(await storage.getAllInsuranceLeads({ fromDate: today, toDate: today }));
        const insuranceLeadsMtd = filterByVisible(insuranceLeadsMonth);
        const insuranceLeadsYtd = filterByVisible(await storage.getAllInsuranceLeads({ fromDate: ytdStart, toDate: ytdEnd }));

        const countLoans = (arr: { status?: string | null }[], status: string) =>
          arr.filter((l) => (l.status || "").toLowerCase() === status.toLowerCase()).length;
        const countIns = (
          arr: { businessType?: string | null; insuranceType?: string | null; insuranceCategory?: string | null }[],
          kind: "new" | "rollover" | "ownRenewal" | "nonMotor" | "life" | "health"
        ) => {
          if (kind === "new") return arr.filter((i) => (i.businessType || "").trim() === "New").length;
          if (kind === "rollover") return arr.filter((i) => (i.businessType || "").trim() === "Rollover").length;
          if (kind === "ownRenewal") return arr.filter((i) => (i.businessType || "").trim() === "Own Renewal").length;
          if (kind === "nonMotor") return arr.filter((i) => (i.insuranceCategory || "").trim() === "Non-Motor").length;
          if (kind === "life") return arr.filter((i) => (i.insuranceType || "").trim() === "Life").length;
          if (kind === "health") return arr.filter((i) => (i.insuranceType || "").trim() === "Health").length;
          return 0;
        };

        payload.ftdAchieved = {
          loans: {
            open: { ftd: countLoans(leadsFtd, "open"), mtd: countLoans(leadsMtdFiltered, "open"), ytd: countLoans(leadsYtdFiltered, "open") },
            logged: { ftd: countLoans(leadsFtd, "logged"), mtd: countLoans(leadsMtdFiltered, "logged"), ytd: countLoans(leadsYtdFiltered, "logged") },
            docCollected: { ftd: countLoans(leadsFtd, "doc collected"), mtd: countLoans(leadsMtdFiltered, "doc collected"), ytd: countLoans(leadsYtdFiltered, "doc collected") },
            discrepancy: { ftd: countLoans(leadsFtd, "discrepancy"), mtd: countLoans(leadsMtdFiltered, "discrepancy"), ytd: countLoans(leadsYtdFiltered, "discrepancy") },
            sanctioned: { ftd: countLoans(leadsFtd, "sanctioned"), mtd: countLoans(leadsMtdFiltered, "sanctioned"), ytd: countLoans(leadsYtdFiltered, "sanctioned") },
            disbursed: { ftd: countLoans(leadsFtd, "disbursed"), mtd: countLoans(leadsMtdFiltered, "disbursed"), ytd: countLoans(leadsYtdFiltered, "disbursed") },
            rejected: { ftd: countLoans(leadsFtd, "rejected"), mtd: countLoans(leadsMtdFiltered, "rejected"), ytd: countLoans(leadsYtdFiltered, "rejected") },
            notInterested: { ftd: countLoans(leadsFtd, "not interested"), mtd: countLoans(leadsMtdFiltered, "not interested"), ytd: countLoans(leadsYtdFiltered, "not interested") },
          },
          insurance: {
            new: { ftd: countIns(insuranceLeadsFtd, "new"), mtd: countIns(insuranceLeadsMtd, "new"), ytd: countIns(insuranceLeadsYtd, "new") },
            rollover: { ftd: countIns(insuranceLeadsFtd, "rollover"), mtd: countIns(insuranceLeadsMtd, "rollover"), ytd: countIns(insuranceLeadsYtd, "rollover") },
            ownRenewal: { ftd: countIns(insuranceLeadsFtd, "ownRenewal"), mtd: countIns(insuranceLeadsMtd, "ownRenewal"), ytd: countIns(insuranceLeadsYtd, "ownRenewal") },
            nonMotor: { ftd: countIns(insuranceLeadsFtd, "nonMotor"), mtd: countIns(insuranceLeadsMtd, "nonMotor"), ytd: countIns(insuranceLeadsYtd, "nonMotor") },
            life: { ftd: countIns(insuranceLeadsFtd, "life"), mtd: countIns(insuranceLeadsMtd, "life"), ytd: countIns(insuranceLeadsYtd, "life") },
            health: { ftd: countIns(insuranceLeadsFtd, "health"), mtd: countIns(insuranceLeadsMtd, "health"), ytd: countIns(insuranceLeadsYtd, "health") },
          },
        };

        const monthName = now.toLocaleString("en-IN", { month: "long" });
        const currentYear = now.getFullYear();
        payload.adminKpi = {
          companyTargetYtd,
          companyAchievedYtd,
          companyTargetMtd,
          companyAchievedMtd,
          monthLabel: `${monthName} ${currentYear}`,
        };
        const quarterRanges = getFiscalQuarterRanges(fiscalYearStart);
        const quarterlyDisbursal = [] as Array<{ quarter: "Q1" | "Q2" | "Q3" | "Q4"; from: string; to: string; amount: number; disbursedCount: number }>;
        for (const q of quarterRanges) {
          const leadsQuarter = await storage.getAllLeads({ fromDate: q.from, toDate: q.to });
          const leadsQuarterVisible = filterByVisible(leadsQuarter);
          const leadsQuarterScoped = selectedEmployeeId
            ? leadsQuarterVisible.filter((l) => l.employeeId === selectedEmployeeId)
            : leadsQuarterVisible;
          const disbursed = leadsQuarterScoped.filter((l) => String(l.status || "").toLowerCase() === "disbursed");
          let amount = 0;
          for (const l of disbursed) amount += getLeadAmount(l as any);
          quarterlyDisbursal.push({
            quarter: q.quarter,
            from: q.from,
            to: q.to,
            amount,
            disbursedCount: disbursed.length,
          });
        }
        payload.quarterlyDisbursal = quarterlyDisbursal;
        payload.fiscalYear = {
          startYear: fiscalYearStart,
          label: `FY ${fiscalYearStart}-${String((fiscalYearStart + 1) % 100).padStart(2, "0")}`,
        };
        payload.quarterlyDisbursalEmployeeId = selectedEmployeeId;
        payload.allEmployeeTargetAchievement = allEmployeeTargetAchievement;
        payload.conveyanceReport = conveyanceReport;
        payload.expenditure = {
          loans: companyAchievedMtd,
          miscellaneous: expenditureMisc,
          total: companyAchievedMtd + expenditureMisc,
          monthLabel: payload.adminKpi.monthLabel,
        };
        const attendanceWithTargets = await Promise.all(
          attendanceTodayFiltered.map(async (a) => {
            const mt = targetByUser.get(a.employeeId);
            const targetLeads = mt ? getTargetLeads(mt) : (Number((employees.find((e) => e.id === a.employeeId) as any)?.monthlyLeadTarget) || 0);
            const { achievedLeads } = await storage.getAchievedBudgetAndLeads(a.employeeId, month, year);
            const achievementPct = targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0;
            return {
              ...a,
              monthlyTarget: targetLeads,
              leadsThisMonth: achievedLeads,
              achievementPct,
            };
          })
        );
        payload.attendanceToday = attendanceWithTargets;
      }
      res.json(payload);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: admin reports (month = YYYY-MM, or from & to = YYYY-MM-DD for custom range) ---
  app.get("/api/staff/reports/target-achievement", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const monthParam = (req.query.month as string)?.trim();
      const fromParam = (req.query.from as string)?.trim();
      const toParam = (req.query.to as string)?.trim();
      const useRange = fromParam && toParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam) && fromParam <= toParam;
      let monthStart: string, monthEnd: string, monthLabel: string;
      let year: number, month: number;
      if (useRange) {
        monthStart = fromParam;
        monthEnd = toParam;
        monthLabel = `${fromParam} to ${toParam}`;
        year = 0;
        month = 0;
      } else {
        const now = new Date();
        year = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear();
        month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseInt(monthParam.slice(5, 7), 10) : now.getMonth() + 1;
        monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        monthLabel = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
      }
      const employees = await storage.listEmployees();
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = { name: (u as any).fullName?.trim() || u.username || u.id, number: (u as any).employeeNumber ?? "" };
      }
      const rows: { employeeId: string; employeeName: string; employeeNumber: string; monthlyTarget: number; assignedBudget: number; achievedLeads: number; achievedBudget: number; achievementPct: number; leadsConverted: number }[] = [];
      if (useRange) {
        const monthsInRange = getMonthsInRange(monthStart, monthEnd);
        for (const emp of employees) {
          let targetLeads = 0;
          let assignedBudget = 0;
          for (const { month: m, year: y } of monthsInRange) {
            const mt = await storage.getMonthlyTarget(emp.id, m, y);
            targetLeads += mt ? getTargetLeads(mt) : (Number((emp as any).monthlyLeadTarget) || 0);
            assignedBudget += getTargetBudget(mt);
          }
          const empLeads = await storage.getLeadsByEmployee(emp.id, monthStart, monthEnd);
          let achievedBudget = 0;
          const disbursed = empLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned");
          for (const l of disbursed) achievedBudget += getLeadAmount(l as any);
          const achievedLeads = empLeads.length;
          const leadsConverted = disbursed.length;
          const achievementPct = targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0;
          rows.push({
            employeeId: emp.id,
            employeeName: byId[emp.id]?.name ?? emp.id,
            employeeNumber: byId[emp.id]?.number ?? "",
            monthlyTarget: targetLeads,
            assignedBudget,
            achievedLeads,
            achievedBudget,
            achievementPct,
            leadsConverted,
          });
        }
      } else {
        const targetsThisMonth = await storage.getMonthlyTargetsByMonth(month, year);
        const targetByUser = new Map(targetsThisMonth.map((t) => [t.userId, t]));
        for (const emp of employees) {
          const mt = targetByUser.get(emp.id);
          const targetLeads = mt ? getTargetLeads(mt) : (Number((emp as any).monthlyLeadTarget) || 0);
          const assignedBudget = getTargetBudget(mt);
          const { achievedBudget, achievedLeads } = await storage.getAchievedBudgetAndLeads(emp.id, month, year);
          const achievementPct = targetLeads > 0 ? Math.round((achievedLeads / targetLeads) * 100) : 0;
          const empLeads = await storage.getLeadsByEmployee(emp.id, monthStart, monthEnd);
          const leadsConverted = empLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
          rows.push({
            employeeId: emp.id,
            employeeName: byId[emp.id]?.name ?? emp.id,
            employeeNumber: byId[emp.id]?.number ?? "",
            monthlyTarget: targetLeads,
            assignedBudget,
            achievedLeads,
            achievedBudget,
            achievementPct,
            leadsConverted,
          });
        }
      }
      res.json({ month: useRange ? undefined : `${year}-${String(month).padStart(2, "0")}`, monthLabel, rows });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/reports/conveyance", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const monthParam = (req.query.month as string)?.trim();
      const fromParam = (req.query.from as string)?.trim();
      const toParam = (req.query.to as string)?.trim();
      const useRange = fromParam && toParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam) && fromParam <= toParam;
      let monthStart: string, monthEnd: string, monthLabel: string;
      if (useRange) {
        monthStart = fromParam;
        monthEnd = toParam;
        monthLabel = `${fromParam} to ${toParam}`;
      } else {
        const now = new Date();
        const year = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear();
        const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseInt(monthParam.slice(5, 7), 10) : now.getMonth() + 1;
        monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        monthLabel = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
      }
      const employees = await storage.listEmployees();
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = { name: (u as any).fullName?.trim() || u.username || u.id, number: (u as any).employeeNumber ?? "" };
      }
      const teamLeads = await storage.listTeamLeads();
      const rows: { employeeId: string; employeeName: string; employeeNumber: string; isTeamLead: boolean; teamLeadsThisMonth: number; achievementPct: number; jointVisits: number; conveyancePct: number }[] = [];
      for (const emp of employees) {
        const isTeamLead = teamLeads.some((tl) => tl.id === emp.id);
        let teamLeadsThisMonth = 0;
        let achievementPct = 0;
        let conveyancePct = 0;
        let jointVisits = 0;
        if (isTeamLead) {
          const teamMembers = await storage.listEmployees({ teamLeadId: emp.id });
          let overallTarget = 0;
          if (useRange) {
            const monthsInRange = getMonthsInRange(monthStart, monthEnd);
            for (const m of teamMembers) {
              for (const { month: mo, year: y } of monthsInRange) {
                const mt = await storage.getMonthlyTarget(m.id, mo, y);
                overallTarget += mt ? getTargetLeads(mt) : (Number((m as any).monthlyLeadTarget) || 0);
              }
              const leads = await storage.getLeadsByEmployee(m.id, monthStart, monthEnd);
              teamLeadsThisMonth += leads.length;
            }
          } else {
            const year = parseInt(monthStart.slice(0, 4), 10);
            const month = parseInt(monthStart.slice(5, 7), 10);
            const targetsThisMonth = await storage.getMonthlyTargetsByMonth(month, year);
            const targetByUser = new Map(targetsThisMonth.map((t) => [t.userId, t]));
            for (const m of teamMembers) {
              const mt = targetByUser.get(m.id);
              overallTarget += mt ? getTargetLeads(mt) : (Number((m as any).monthlyLeadTarget) || 0);
              const leads = await storage.getLeadsByEmployee(m.id, monthStart, monthEnd);
              teamLeadsThisMonth += leads.length;
            }
          }
          achievementPct = overallTarget > 0 ? Math.round((teamLeadsThisMonth / overallTarget) * 100) : 0;
          jointVisits = await storage.getJointVisitsCount(emp.id, monthStart, monthEnd);
          if (jointVisits >= 4 && teamLeadsThisMonth >= 10) {
            if (achievementPct >= 100) conveyancePct = 120;
            else if (achievementPct >= 80) conveyancePct = 50;
          }
        }
        rows.push({
          employeeId: emp.id,
          employeeName: byId[emp.id]?.name ?? emp.id,
          employeeNumber: byId[emp.id]?.number ?? "",
          isTeamLead,
          teamLeadsThisMonth,
          achievementPct,
          jointVisits,
          conveyancePct,
        });
      }
      res.json({ month: useRange ? undefined : monthStart.slice(0, 7), monthLabel, rows });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/reports/expenditure", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const monthParam = (req.query.month as string)?.trim();
      const fromParam = (req.query.from as string)?.trim();
      const toParam = (req.query.to as string)?.trim();
      let monthStart: string, monthEnd: string, monthLabel: string;
      if (fromParam && toParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam) && fromParam <= toParam) {
        monthStart = fromParam;
        monthEnd = toParam;
        monthLabel = `${fromParam} to ${toParam}`;
      } else {
        const now = new Date();
        const year = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear();
        const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseInt(monthParam.slice(5, 7), 10) : now.getMonth() + 1;
        monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        monthLabel = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
      }
      const leadsMtd = await storage.getAllLeads({ fromDate: monthStart, toDate: monthEnd });
      const disbursedMtd = leadsMtd.filter(
        (l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned"
      );
      let loans = 0;
      for (const l of disbursedMtd) loans += getLeadAmount(l as any);
      const insuranceLeadsMonth = await storage.getAllInsuranceLeads({ fromDate: monthStart, toDate: monthEnd });
      let miscellaneous = 0;
      for (const il of insuranceLeadsMonth) {
        miscellaneous += parseAmount((il as { miscellaneousExpenses?: string | null }).miscellaneousExpenses);
      }
      res.json({
        month: monthStart.slice(0, 7),
        monthLabel,
        loans,
        miscellaneous,
        total: loans + miscellaneous,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: Payroll & Payslips (Option B: rules + inputs, app calculates) ---
  app.get("/api/staff/salary-structure/:employeeId", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const structure = await storage.getSalaryStructure(req.params.employeeId);
      if (!structure) return res.status(404).json({ message: "Salary structure not found" });
      const row = structure as Record<string, unknown>;
      res.json({
        id: row.id,
        employeeId: row.employeeId,
        monthlyCtc: row.monthlyCtc ?? 0,
        basic: row.basic ?? 0,
        hraPercent: row.hraPercent ?? 0,
        specialAllowance: row.specialAllowance ?? 0,
        conveyance: row.conveyance ?? 0,
        medical: row.medical ?? 0,
        extraAllowances: row.extraAllowancesJson ? JSON.parse(String(row.extraAllowancesJson)) : [],
        employeePfPercent: row.employeePfPercent ?? 12,
        ptAmount: row.ptAmount ?? 0,
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/salary-structure", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = req.body || {};
      const employeeId = (body.employeeId as string)?.trim();
      if (!employeeId) return res.status(400).json({ message: "employeeId is required" });
      const monthlyCtc = parseAmount(body.monthlyCtc);
      const basicAuto = Math.round((monthlyCtc * 0.4) * 100) / 100;
      const hraPercent = parseAmount(body.hraPercent) || 40;
      const basic = monthlyCtc > 0 ? basicAuto : (parseAmount(body.basic) || 0);
      const specialAllowance = parseAmount(body.specialAllowance) || 0;
      const conveyance = parseAmount(body.conveyance) || 0;
      const medical = parseAmount(body.medical) || 0;
      const extraAllowances = Array.isArray(body.extraAllowances)
        ? body.extraAllowances
            .map((x) => ({
              label: String((x as any)?.label || "").trim(),
              amount: parseAmount((x as any)?.amount),
            }))
            .filter((x) => x.label && x.amount > 0)
        : [];
      const structure = await storage.upsertSalaryStructure({
        employeeId,
        monthlyCtc: String(monthlyCtc || 0),
        basic: String(basic),
        hraPercent: String(hraPercent),
        specialAllowance: String(specialAllowance),
        conveyance: String(conveyance),
        medical: String(medical),
        extraAllowancesJson: JSON.stringify(extraAllowances),
        employeePfPercent: String(parseAmount(body.employeePfPercent) || 12),
        ptAmount: String(parseAmount(body.ptAmount) || 0),
      } as any);
      res.json(structure);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/payroll-entries", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const period = (req.query.period as string)?.trim();
      if (!period || !/^\d{4}-\d{2}$/.test(period))
        return res.status(400).json({ message: "Query period (YYYY-MM) is required" });
      const entries = await storage.getPayrollEntriesByPeriod(period);
      res.json(entries.map((e) => ({ id: e.id, employeeId: e.employeeId, period: e.period, incentives: e.incentives, deductionsOther: e.deductionsOther, tdsAmount: e.tdsAmount, absentDays: e.absentDays, notes: e.notes })));
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/payroll-entries", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const employeeId = (body.employeeId as string)?.trim();
      const period = (body.period as string)?.trim();
      if (!employeeId || !period || !/^\d{4}-\d{2}$/.test(period))
        return res.status(400).json({ message: "employeeId and period (YYYY-MM) are required" });
      const entry = await storage.upsertPayrollEntry({
        employeeId,
        period,
        incentives: String(parseAmount(body.incentives) || 0),
        deductionsOther: String(parseAmount(body.deductionsOther) || 0),
        tdsAmount: body.tdsAmount != null ? String(parseAmount(body.tdsAmount)) : undefined,
        absentDays: Number(body.absentDays) || 0,
        notes: (body.notes as string)?.trim() || undefined,
        createdBy: userId,
      } as any);
      res.json(entry);
    } catch (e) {
      next(e);
    }
  });

  type PayslipPDFOpts = {
    employeeName: string;
    employeeNumber: string;
    periodLabel: string;
    payslipTitle: string; // "PAYSLIP FOR THE MONTH OF JUNE 2025"
    computed: ComputedPayslip;
    companyName: string;
    companyAddress?: string | null;
    designation?: string | null;
    dateOfJoining?: string | Date | null;
    dateOfBirth?: string | Date | null;
    bankAccountNumber?: string | null;
    bankIfsc?: string | null;
    pan?: string | null;
    uan?: string | null;
    department?: string | null;
    location?: string | null;
    gender?: string | null;
    logoPath?: string | null;
    calendarDaysInMonth: number;
  };

  function drawPayslipPDF(doc: import("pdfkit").PDFDocument, opts: PayslipPDFOpts) {
    const {
      employeeName,
      employeeNumber,
      periodLabel,
      payslipTitle,
      computed,
      companyName,
      companyAddress,
      designation,
      dateOfJoining,
      dateOfBirth,
      bankAccountNumber,
      pan,
      uan,
      department,
      location,
      gender,
      logoPath,
      calendarDaysInMonth,
    } = opts;
    const M = 45;
    const pageW = 595;
    const rightEdge = pageW - M;
    const contentW = rightEdge - M;
    const smallFont = 9;
    const rowH = 15;
    const cellPad = 6;

    const drawCell = (x: number, y: number, w: number, h: number, text: string, bold = false, align: "left" | "right" = "left") => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(smallFont);
      doc.rect(x, y, w, h).stroke("#333");
      doc.text(String(text), x + cellPad, y + cellPad, { width: w - cellPad * 2, height: h - cellPad * 2, align, lineBreak: false });
    };

    let y = M;
    const hasLogo = !!(logoPath && fs.existsSync(logoPath));
    if (hasLogo) {
      try {
        doc.image(logoPath!, M, y, { fit: [56, 56] });
      } catch {
        // ignore invalid image
      }
    }
    const headerLeft = hasLogo ? M + 62 : M;
    const headerW = rightEdge - headerLeft;
    doc.fontSize(14).font("Helvetica-Bold").text(companyName || "Company", headerLeft, y + 4, { align: "center", width: headerW });
    if (companyAddress) {
      doc.fontSize(8).font("Helvetica").fillColor("#333");
      const lines = (companyAddress || "").split("\n").filter(Boolean);
      lines.forEach((line, i) => {
        doc.text(line.trim(), headerLeft, y + 22 + i * 10, { align: "center", width: headerW });
      });
      y += 22 + lines.length * 10;
    } else {
      y += 22;
    }
    doc.fontSize(10).font("Helvetica-Bold").text(payslipTitle, M, y, { align: "center", width: pageW - 2 * M });
    y += 24;

    const colW = (rightEdge - M) / 3;
    const empLabelW = 90;
    const empValW = colW - empLabelW - 2;
    const leftCol = M;
    const midCol = M + colW;
    const rightCol = M + colW * 2;
    const empRows: [string, string][] = [
      ["Emp Code", employeeNumber || "—"],
      ["Department", department || "—"],
      ["Location", location || "—"],
      ["Date of Birth", formatPayslipDateDDMMYYYY(dateOfBirth)],
      ["Date of Joining", formatPayslipDateDDMMYYYY(dateOfJoining)],
      ["UAN", uan || "—"],
    ];
    const midRows: [string, string][] = [
      ["Emp Name", employeeName || "—"],
      ["Cost Center", "—"],
      ["Designation", designation || "—"],
      ["Bank A/c No", bankAccountNumber || "—"],
      ["Gender", gender || "—"],
      ["", "—"],
    ];
    const rightRows: [string, string][] = [
      ["PF No.", uan || "—"],
      ["ESI No.", "—"],
      ["Pan No.", pan || "—"],
      ["EPS No.", "—"],
      ["Grade", "—"],
      ["", "—"],
    ];
    const empTableH = Math.max(empRows.length, midRows.length, rightRows.length) * rowH;
    for (let i = 0; i < empRows.length; i++) {
      const [lbl, val] = empRows[i];
      drawCell(leftCol, y + i * rowH, empLabelW, rowH, lbl);
      drawCell(leftCol + empLabelW, y + i * rowH, empValW + 2, rowH, val);
    }
    for (let i = 0; i < midRows.length; i++) {
      const [lbl, val] = midRows[i];
      drawCell(midCol, y + i * rowH, empLabelW, rowH, lbl);
      drawCell(midCol + empLabelW, y + i * rowH, empValW + 2, rowH, val);
    }
    for (let i = 0; i < rightRows.length; i++) {
      const [lbl, val] = rightRows[i];
      drawCell(rightCol, y + i * rowH, empLabelW, rowH, lbl);
      drawCell(rightCol + empLabelW, y + i * rowH, empValW + 2, rowH, val);
    }
    y += empTableH + 12;

    const tableLabelW = contentW - 130;
    const amtW = 130;
    const earn = computed.earningsBreakdown;
    const earnRows: [string, number][] = [
      ["Basic", earn.basic],
      ["House Rent Allowance", earn.hra],
      ["Other Allowance", earn.specialAllowance],
      ["Conveyance", earn.conveyance],
      ["Medical", earn.medical],
      ...((earn.extraAllowances || []).map((x) => [x.label, x.amount] as [string, number])),
      ["Incentives", earn.incentives],
    ];
    doc.font("Helvetica-Bold").fontSize(10).text("Earnings", M, y);
    y += rowH + 4;
    doc.rect(M, y, tableLabelW, rowH).stroke("#333");
    doc.rect(M + tableLabelW, y, amtW, rowH).stroke("#333");
    doc.font("Helvetica-Bold").fontSize(smallFont).text("Item Name", M + cellPad, y + cellPad);
    doc.text("Amount", M + tableLabelW + cellPad, y + cellPad, { width: amtW - cellPad * 2, align: "right" });
    y += rowH;
    for (const [lbl, amt] of earnRows) {
      doc.rect(M, y, tableLabelW, rowH).stroke("#333");
      doc.rect(M + tableLabelW, y, amtW, rowH).stroke("#333");
      doc.font("Helvetica").fontSize(smallFont).text(lbl, M + cellPad, y + cellPad);
      doc.text("Rs. " + formatCurrency(amt), M + tableLabelW + cellPad, y + cellPad, { width: amtW - cellPad * 2, align: "right" });
      y += rowH;
    }
    doc.rect(M, y, tableLabelW, rowH).stroke("#333");
    doc.rect(M + tableLabelW, y, amtW, rowH).stroke("#333");
    doc.font("Helvetica-Bold").fontSize(smallFont).text("Total Earnings", M + cellPad, y + cellPad);
    doc.text("Rs. " + formatCurrency(computed.totalEarnings), M + tableLabelW + cellPad, y + cellPad, { width: amtW - cellPad * 2, align: "right" });
    y += rowH + 14;

    doc.font("Helvetica-Bold").fontSize(10).text("Deductions", M, y);
    y += rowH + 4;
    doc.rect(M, y, tableLabelW, rowH).stroke("#333");
    doc.rect(M + tableLabelW, y, amtW, rowH).stroke("#333");
    doc.font("Helvetica-Bold").fontSize(smallFont).text("Item Name", M + cellPad, y + cellPad);
    doc.text("Amount", M + tableLabelW + cellPad, y + cellPad, { width: amtW - cellPad * 2, align: "right" });
    y += rowH;
    const ded = computed.deductionsBreakdown;
    const dedRows: [string, number][] = [
      ["Provident Fund", ded.pf],
      ["Professional Tax", ded.pt],
      ["Income Tax (TDS)", ded.tds],
      ["Other Deductions", ded.other],
    ];
    for (const [lbl, amt] of dedRows) {
      doc.rect(M, y, tableLabelW, rowH).stroke("#333");
      doc.rect(M + tableLabelW, y, amtW, rowH).stroke("#333");
      doc.font("Helvetica").fontSize(smallFont).text(lbl, M + cellPad, y + cellPad);
      doc.text("Rs. " + formatCurrency(amt), M + tableLabelW + cellPad, y + cellPad, { width: amtW - cellPad * 2, align: "right" });
      y += rowH;
    }
    doc.rect(M, y, tableLabelW, rowH).stroke("#333");
    doc.rect(M + tableLabelW, y, amtW, rowH).stroke("#333");
    doc.font("Helvetica-Bold").fontSize(smallFont).text("Total Deductions", M + cellPad, y + cellPad);
    doc.text("Rs. " + formatCurrency(computed.totalDeductions), M + tableLabelW + cellPad, y + cellPad, { width: amtW - cellPad * 2, align: "right" });
    y += rowH + 16;

    doc.font("Helvetica-Bold").fontSize(11).text("Net Pay : Rs. " + formatCurrency(computed.netPay), M, y);
    doc.moveTo(M, y + 14).lineTo(M + 180, y + 14).stroke("#000");
    y += 20;
    doc.font("Helvetica").fontSize(smallFont).text("In Words Rupees " + numberToWordsInRupees(computed.netPay) + ".", M, y);
    y += 20;

    const daysInMonth = calendarDaysInMonth;
    const lopDays = (computed.workingDaysInMonth ?? 22) - (computed.daysPresent ?? 0);
    const netDays = computed.daysPresent ?? 0;
    const attRowH = 16;
    const attW = contentW / 5;
    doc.font("Helvetica-Bold").fontSize(9).text("Attendance / Days Worked", M, y);
    y += attRowH;
    const attHeaders = ["Days (A)", "Arrear (B)", "LOPR (C)", "LOP (D)", "Net Days (E)"];
    attHeaders.forEach((h, i) => {
      doc.rect(M + i * attW, y, attW, attRowH).stroke("#333");
      doc.font("Helvetica").fontSize(smallFont).text(h, M + i * attW + cellPad, y + cellPad, { width: attW - cellPad * 2, align: "center" });
    });
    y += attRowH;
    [String(daysInMonth), "0", "0", String(lopDays), String(netDays)].forEach((val, i) => {
      doc.rect(M + i * attW, y, attW, attRowH).stroke("#333");
      doc.font("Helvetica").fontSize(smallFont).text(val, M + i * attW + cellPad, y + cellPad, { width: attW - cellPad * 2, align: "center" });
    });
    y += attRowH + 14;

    doc.font("Helvetica").fontSize(7).fillColor("#666");
    doc.text("This is a computer-generated payslip. No signature required.", M, y, { align: "center", width: pageW - 2 * M });
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, M, y + 8, { align: "center", width: pageW - 2 * M });
    doc.fillColor("#000");
  }

  app.post("/api/staff/payslips/generate", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const period = (req.body?.period as string)?.trim();
      if (!period || !/^\d{4}-\d{2}$/.test(period))
        return res.status(400).json({ message: "period (YYYY-MM) is required" });
      const [y, m] = period.split("-").map(Number);
      const monthStart = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const monthEnd = new Date(y, m, 0).toISOString().slice(0, 10);
      const periodLabel = new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
      const payslipTitle = "PAYSLIP FOR THE MONTH OF " + periodLabel.toUpperCase();
      const workingDaysInMonth = getWorkingDaysInMonth(y, m);
      const calendarDaysInMonth = new Date(y, m, 0).getDate();
      const employees = await storage.listEmployees();
      const companyName = (req.body?.companyName as string)?.trim() || "Express Financial Services";
      const companyAddress = (req.body?.companyAddress as string)?.trim() || null;
      let generated = 0;
      for (const emp of employees) {
        const structure = await storage.getSalaryStructure(emp.id);
        const entry = await storage.getPayrollEntry(emp.id, period);
        if (!structure) continue;
        const att = await storage.getAttendanceLogsByEmployee(emp.id, monthStart, monthEnd);
        const daysPresent = att.length;
        const entryRow = entry || {
          incentives: "0",
          deductionsOther: "0",
          tdsAmount: null,
          absentDays: 0,
        };
        const proration = workingDaysInMonth > 0 ? { workingDaysInMonth, daysPresent } : undefined;
        const computed = computePayslip(structure as any, entryRow as any, proration);
        const earningsJson = JSON.stringify(computed.earningsBreakdown);
        const deductionsJson = JSON.stringify(computed.deductionsBreakdown);
        const empName = (emp as any).fullName?.trim() || emp.username || "";
        const empNum = (emp as any).employeeNumber ?? "";
        const safeName = emp.id;
        const filename = `payslip_${safeName}_${period}.pdf`;
        const filePath = path.join(PAYSLIPS_DIR, filename);
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        const companyLogoPath = getCompanyLogoPath();
        drawPayslipPDF(doc, {
          employeeName: empName,
          employeeNumber: empNum,
          periodLabel,
          payslipTitle,
          computed,
          companyName,
          companyAddress,
          designation: (emp as any).designation ?? null,
          dateOfJoining: (emp as any).dateOfJoining ?? null,
          dateOfBirth: (emp as any).dateOfBirth ?? null,
          bankAccountNumber: (emp as any).bankAccountNumber ?? null,
          bankIfsc: (emp as any).bankIfsc ?? null,
          pan: (emp as any).pan ?? null,
          uan: (emp as any).uan ?? null,
          department: (emp as any).department ?? null,
          location: (emp as any).location ?? null,
          gender: (emp as any).gender ?? null,
          logoPath: companyLogoPath,
          calendarDaysInMonth,
        });
        doc.end();
        await new Promise<void>((resolve, reject) => {
          stream.on("finish", () => resolve());
          stream.on("error", reject);
        });
        await storage.upsertPayslip({
          employeeId: emp.id,
          period,
          earningsBreakdown: earningsJson,
          deductionsBreakdown: deductionsJson,
          totalEarnings: String(computed.totalEarnings),
          totalDeductions: String(computed.totalDeductions),
          netPay: String(computed.netPay),
          pdfPath: path.join("payslips", filename),
          generatedBy: userId,
        } as any);
        generated++;
      }
      res.json({ message: "Payslips generated", count: generated, period });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/payslips", requireAuth, async (req, res, next) => {
    try {
      const role = (req.user as any).role;
      const employeeId = (req.query.employeeId as string) || undefined;
      const period = (req.query.period as string) || undefined;
      let list: { id: string; employeeId: string; period: string; totalEarnings: number; totalDeductions: number; netPay: number; generatedAt: string }[];
      if (role === "admin") {
        if (employeeId) {
          list = (await storage.getPayslipsByEmployee(employeeId)).map((p) => ({
            id: p.id,
            employeeId: p.employeeId,
            period: p.period,
            totalEarnings: parseFloat(String(p.totalEarnings)) || 0,
            totalDeductions: parseFloat(String(p.totalDeductions)) || 0,
            netPay: parseFloat(String(p.netPay)) || 0,
            generatedAt: String(p.generatedAt ?? ""),
          }));
        } else if (period) {
          list = (await storage.getPayslipsByPeriod(period)).map((p) => ({
            id: p.id,
            employeeId: p.employeeId,
            period: p.period,
            totalEarnings: parseFloat(String(p.totalEarnings)) || 0,
            totalDeductions: parseFloat(String(p.totalDeductions)) || 0,
            netPay: parseFloat(String(p.netPay)) || 0,
            generatedAt: String(p.generatedAt ?? ""),
          }));
        } else {
          list = [];
        }
      } else {
        const myId = (req.user as any).id;
        list = (await storage.getPayslipsByEmployee(myId)).map((p) => ({
          id: p.id,
          employeeId: p.employeeId,
          period: p.period,
          totalEarnings: parseFloat(String(p.totalEarnings)) || 0,
          totalDeductions: parseFloat(String(p.totalDeductions)) || 0,
          netPay: parseFloat(String(p.netPay)) || 0,
          generatedAt: String(p.generatedAt ?? ""),
        }));
      }
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/payslips/:id/file", requireAuth, async (req, res, next) => {
    try {
      const payslip = await storage.getPayslipById(req.params.id);
      if (!payslip) return res.status(404).json({ message: "Payslip not found" });
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      if (role !== "admin" && payslip.employeeId !== userId)
        return res.status(403).json({ message: "Forbidden" });
      if (!payslip.pdfPath) return res.status(404).json({ message: "Payslip PDF not generated" });
      const fullPath = path.join(UPLOADS_DIR, payslip.pdfPath);
      if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "Payslip file not found" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="payslip-${payslip.period}.pdf"`);
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: export monthly data (Excel / PDF) ---
  async function handleStaffMonthlyExport(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const format = (req.query.format as string)?.toLowerCase();
      const monthParam = (req.query.month as string)?.trim();
      const fromParam = (req.query.from as string)?.trim();
      const toParam = (req.query.to as string)?.trim();
      const employeeId = (req.query.employeeId as string) || undefined;
      if (!format || !["xlsx", "pdf"].includes(format)) {
        return res.status(400).json({ message: "Query param format must be xlsx or pdf" });
      }
      let monthStart: string;
      let monthEnd: string;
      let monthLabel: string;
      if (fromParam && toParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam) && fromParam <= toParam) {
        monthStart = fromParam;
        monthEnd = toParam;
        monthLabel = `${fromParam} to ${toParam}`;
      } else if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split("-").map(Number);
        const year = y;
        const month = m - 1;
        monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
        monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);
        monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
        monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);
        monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
      }
      const visibleIds = await getVisibleEmployeeIds(req);
      const role = (req.user as any)?.role;
      let employees: { id: string; username?: string; fullName?: string | null; employeeNumber?: string | null }[] = visibleIds === null
        ? await storage.listEmployees()
        : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      if (role === "team_lead") {
        const me = await storage.getUser((req.user as any).id);
        if (me && !employees.some((u) => u.id === me.id)) {
          employees = [me as any, ...employees];
        }
      }
      const filtered = employeeId && (visibleIds === null || visibleIds.includes(employeeId))
        ? employees.filter((u) => u.id === employeeId)
        : employees;
      const rangeStart = new Date(monthStart).getTime();
      const rangeEnd = new Date(monthEnd).getTime();
      const exportYear = parseInt(monthStart.slice(0, 4), 10);
      const exportMonth = parseInt(monthStart.slice(5, 7), 10);
      let reportBudget = 0;
      if (role === "admin") {
        const companyTarget = await storage.getCompanyMonthlyTarget(exportMonth, exportYear);
        reportBudget = getCompanyBudget(companyTarget);
      } else if (role === "team_lead" && filtered.length > 0) {
        for (const u of filtered) {
          const mt = await storage.getMonthlyTarget(u.id, exportMonth, exportYear);
          reportBudget += getTargetBudget(mt);
        }
      }
      /** Normalize date to YYYY-MM-DD for consistent export and correct range comparison. */
      const toDateStr = (v: unknown): string => {
        if (v == null) return "";
        if (typeof v === "string") return v.slice(0, 10);
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return String(v).slice(0, 10);
      };
      const todayStr = new Date().toISOString().slice(0, 10);
      const roleLabel = (r: string) => (r === "team_lead" ? "Team leader" : r === "admin" ? "Admin" : "Employee");
      const rows: { employeeId: string; employeeNumber: string; name: string; role: string; daysPresent: number; leadsCount: number; insuranceLeadsCount: number; leaveDays: number; disbursedAmount: number; ftdLeads: number; overallLeads: number; loggedCount: number; disbursedCount: number; budget: number; achievement: number; ftdLoansValue: number; mtdLoansValue: number; loggedValue: number; sanctionedValue: number; disbursedValue: number; mtdInsuranceValue: number }[] = [];
      const leadRows: Record<string, string>[] = [];
      const insuranceRows: Record<string, string>[] = [];
      const attendanceRows: { employeeNumber: string; employeeName: string; date: string; loginAt: string; logoutAt: string; status: string; loginLocation: string; logoutLocation: string; leadsCount: number }[] = [];
      const leaveRows: { employeeNumber: string; employeeName: string; leaveType: string; startDate: string; endDate: string; reason: string; status: string }[] = [];
      for (const u of filtered) {
        const uid = u.id;
        const empNum = (u as any).employeeNumber ?? "";
        const empName = (u as any).fullName?.trim() || u.username || "";
        const att = await storage.getAttendanceLogsByEmployee(uid, monthStart, monthEnd);
        const daysPresent = att.length;
        const leadsList = await storage.getLeadsByEmployee(uid, monthStart, monthEnd);
        const insList = await storage.getInsuranceLeadsByEmployee(uid, monthStart, monthEnd);
        const leaveList = await storage.getLeaveRequestsByEmployee(uid, monthStart, monthEnd);
        const approvedLeave = leaveList.filter((l) => (l.status || "").toLowerCase() === "approved");
        let leaveDays = 0;
        for (const lv of approvedLeave) {
          const start = new Date(String(lv.startDate));
          const end = new Date(String(lv.endDate));
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const t = d.getTime();
            if (t >= rangeStart && t <= rangeEnd) leaveDays++;
          }
        }
        const getLeadStatus = (l: { status?: string | null }) => (l.status || "").toLowerCase().trim();
        const loggedCount = leadsList.filter((l) => getLeadStatus(l as any) === "logged").length;
        const disbursedCount = leadsList.filter((l) => getLeadStatus(l as any) === "disbursed").length;
        const ftdLeads = leadsList.length;
        const overallLeads = leadsList.length + insList.length;
        const ftdLoansValue = leadsList
          .filter((l) => toDateStr((l as any).date) === todayStr)
          .reduce((sum, l) => sum + getLeadRequestAmount(l as any), 0);
        const mtdLoansValue = leadsList.reduce((sum, l) => sum + getLeadRequestAmount(l as any), 0);
        const loggedValue = leadsList
          .filter((l) => getLeadStatus(l as any) === "logged")
          .reduce((sum, l) => sum + getLeadRequestAmount(l as any), 0);
        const sanctionedValue = leadsList
          .filter((l) => getLeadStatus(l as any) === "sanctioned")
          .reduce((sum, l) => sum + getLeadRequestAmount(l as any), 0);
        const disbursedValue = leadsList
          .filter((l) => getLeadStatus(l as any) === "disbursed")
          .reduce((sum, l) => sum + getLeadAmount(l as any), 0);
        const disbursedAmount = disbursedValue;
        const mtdInsuranceValue = insList.reduce((sum, i) => {
          const v = (i as any).premiumCollected ?? (i as any).premium_collected ?? (i as any).premiumQuoted ?? (i as any).premium_quoted;
          return sum + parseAmount(v);
        }, 0);
        // Summary row sources (all from DB): budget=company_monthly_target.totalBudget (admin) or sum(monthly_targets.assignedBudget) (team); achievement/disbursedValue=leads.loan_disbursed/amount where status=disbursed; ftdLoansValue=leads.amount where date=today; mtdLoansValue=leads.amount in range; loggedValue/sanctionedValue=leads.amount where status=logged/sanctioned; mtdInsuranceValue=insurance_leads.premium_collected|premium_quoted; overallLeads=count(leads)+count(insurance_leads); daysPresent=attendance_logs count; leaveDays=approved leave_requests in range.
        rows.push({
          employeeId: uid,
          employeeNumber: empNum,
          name: empName,
          role: roleLabel((u as any).role ?? "employee"),
          daysPresent,
          leadsCount: leadsList.length,
          insuranceLeadsCount: insList.length,
          leaveDays,
          disbursedAmount,
          ftdLeads,
          overallLeads,
          loggedCount,
          disbursedCount,
          budget: reportBudget,
          achievement: disbursedValue,
          ftdLoansValue,
          mtdLoansValue,
          loggedValue,
          sanctionedValue,
          disbursedValue,
          mtdInsuranceValue,
        });
        for (const l of leadsList) {
          const lAny = l as Record<string, unknown>;
          leadRows.push({
            employeeNumber: empNum,
            employeeName: empName,
            date: toDateStr(lAny.date ?? l.date),
            customerName: String(lAny.customerName ?? l.customerName ?? ""),
            dateOfBirth: toDateStr(lAny.dateOfBirth ?? l.dateOfBirth),
            customerPhone: String(lAny.customerPhone ?? l.customerPhone ?? ""),
            customerEmail: String(lAny.customerEmail ?? l.customerEmail ?? ""),
            location: String(lAny.location ?? l.location ?? ""),
            loanType: String(lAny.loanType ?? l.loanType ?? ""),
            subLoanType: String(lAny.subLoanType ?? l.subLoanType ?? ""),
            incomeType: String(lAny.incomeType ?? l.incomeType ?? ""),
            incomeComments: String(lAny.incomeComments ?? (l as any).incomeComments ?? ""),
            amount: String(lAny.amount ?? l.amount ?? ""),
            cibil: String(lAny.cibil ?? l.cibil ?? ""),
            docsCollected: String(lAny.docsCollected ?? (l as any).docsCollected ?? ""),
            companyLogged: String(lAny.companyLogged ?? (l as any).companyLogged ?? ""),
            applicationNumber: String(lAny.applicationNumber ?? (l as any).application_number ?? ""),
            tenure: String(lAny.tenure ?? l.tenure ?? ""),
            roi: String(lAny.roi ?? l.roi ?? ""),
            loanDisbursed: String(lAny.loanDisbursed ?? l.loanDisbursed ?? ""),
            loanSanctionedAt: toDateStr(lAny.loanSanctionedAt ?? l.loanSanctionedAt),
            loanDisbursedAt: toDateStr(lAny.loanDisbursedAt ?? l.loanDisbursedAt),
            status: String(lAny.status ?? l.status ?? ""),
            notes: String(lAny.notes ?? l.notes ?? ""),
            formLocation: String(lAny.formLocation ?? (l as any).form_location ?? ""),
            payoutPercent: String(lAny.payoutPercent ?? l.payoutPercent ?? ""),
            payoutAmount: String(lAny.payoutAmount ?? l.payoutAmount ?? ""),
            reconsil: String(lAny.reconsil ?? (l as any).reconsil ?? ""),
            paymentStatus: String(lAny.paymentStatus ?? l.paymentStatus ?? ""),
          });
        }
        for (const i of insList) {
          const iAny = i as Record<string, unknown>;
          insuranceRows.push({
            employeeNumber: empNum,
            employeeName: empName,
            date: toDateStr(iAny.date ?? i.date),
            customerName: String(iAny.customerName ?? i.customerName ?? ""),
            dateOfBirth: toDateStr(iAny.dateOfBirth ?? i.dateOfBirth),
            contactNum: String(iAny.contactNum ?? i.contactNum ?? ""),
            mailId: String(iAny.mailId ?? i.mailId ?? ""),
            location: String(iAny.location ?? i.location ?? ""),
            insuranceType: String(iAny.insuranceType ?? i.insuranceType ?? ""),
            insuranceCategory: String(iAny.insuranceCategory ?? (i as any).insurance_category ?? ""),
            insuranceProductType: String(iAny.insuranceProductType ?? (i as any).insurance_product_type ?? ""),
            insuranceProductTypeOther: String(iAny.insuranceProductTypeOther ?? (i as any).insurance_product_type_other ?? ""),
            vehicleNumber: String(iAny.vehicleNumber ?? (i as any).vehicle_number ?? ""),
            insuranceSubtype: String(iAny.insuranceSubtype ?? i.insuranceSubtype ?? ""),
            insuranceSubtypeOther: String(iAny.insuranceSubtypeOther ?? (i as any).insuranceSubtypeOther ?? ""),
            profileType: String(iAny.profileType ?? (i as any).profileType ?? ""),
            profileComments: String(iAny.profileComments ?? (i as any).profileComments ?? ""),
            businessType: String(iAny.businessType ?? (i as any).businessType ?? ""),
            businessTypeComments: String(iAny.businessTypeComments ?? (i as any).businessTypeComments ?? ""),
            paymentMode: String(iAny.paymentMode ?? (i as any).paymentMode ?? ""),
            paymentModeComments: String(iAny.paymentModeComments ?? (i as any).paymentModeComments ?? ""),
            paymentDoneBy: String(iAny.paymentDoneBy ?? (i as any).paymentDoneBy ?? ""),
            paymentDoneByComments: String(iAny.paymentDoneByComments ?? (i as any).paymentDoneByComments ?? ""),
            incomeType: String(iAny.incomeType ?? (i as any).incomeType ?? ""),
            premiumQuoted: String(iAny.premiumQuoted ?? i.premiumQuoted ?? ""),
            premiumCollected: String(iAny.premiumCollected ?? i.premiumCollected ?? ""),
            netPremium: String(iAny.netPremium ?? (i as any).net_premium ?? ""),
            difference: String(iAny.difference ?? (i as any).difference ?? ""),
            miscellaneousExpenses: String(iAny.miscellaneousExpenses ?? (i as any).miscellaneousExpenses ?? ""),
            status: String(iAny.status ?? i.status ?? ""),
            notes: String(iAny.notes ?? i.notes ?? ""),
            formLocation: String(iAny.formLocation ?? (i as any).form_location ?? ""),
            policyNumber: String(iAny.policyNumber ?? (i as any).policy_number ?? ""),
            policyStartDate: toDateStr(iAny.policyStartDate ?? (i as any).policy_start_date),
            policyEndDate: toDateStr(iAny.policyEndDate ?? (i as any).policy_end_date),
            collectedPremium: String(iAny.collectedPremium ?? (i as any).collectedPremium ?? ""),
            actualPremium: String(iAny.actualPremium ?? (i as any).actualPremium ?? ""),
            finalRemarks: String(iAny.finalRemarks ?? (i as any).finalRemarks ?? ""),
          });
        }
        for (const a of att) {
          const aRow = a as Record<string, unknown>;
          attendanceRows.push({
            employeeNumber: empNum,
            employeeName: empName,
            date: toDateStr(aRow.date ?? a.date),
            loginAt: a.loginAt ? new Date(a.loginAt).toLocaleString() : "",
            logoutAt: a.logoutAt ? new Date(a.logoutAt).toLocaleString() : "",
            status: String(aRow.status ?? a.status ?? ""),
            loginLocation: String(aRow.loginLocation ?? a.loginLocation ?? ""),
            logoutLocation: String(aRow.logoutLocation ?? aRow.logout_location ?? ""),
            leadsCount: Number(aRow.leadsCount ?? a.leadsCount) || 0,
          });
        }
        for (const lv of leaveList) {
          const lvAny = lv as Record<string, unknown>;
          leaveRows.push({
            employeeNumber: empNum,
            employeeName: empName,
            leaveType: String(lvAny.leaveType ?? lv.leaveType ?? ""),
            startDate: toDateStr(lvAny.startDate ?? lv.startDate),
            endDate: toDateStr(lvAny.endDate ?? lv.endDate),
            reason: String(lvAny.reason ?? lv.reason ?? ""),
            status: String(lvAny.status ?? lv.status ?? ""),
          });
        }
      }
      if (format === "xlsx") {
        const workbook = new ExcelJS.Workbook();
        const summarySheet = workbook.addWorksheet("Summary");
        summarySheet.columns = [
          { header: "Employee ID", key: "employeeNumber", width: 14 },
          { header: "Name", key: "name", width: 24 },
          { header: "Role", key: "role", width: 14 },
          { header: "Budget", key: "budget", width: 14 },
          { header: "Achievement", key: "achievement", width: 14 },
          { header: "FTD Loans Value", key: "ftdLoansValue", width: 16 },
          { header: "MTD Loans Value", key: "mtdLoansValue", width: 16 },
          { header: "Logged Value", key: "loggedValue", width: 14 },
          { header: "Sanctioned Value", key: "sanctionedValue", width: 16 },
          { header: "Disbursed Value", key: "disbursedValue", width: 16 },
          { header: "MTD Insurance Value", key: "mtdInsuranceValue", width: 18 },
          { header: "Overall Leads", key: "overallLeads", width: 14 },
          { header: "Days Present", key: "daysPresent", width: 14 },
          { header: "Leave Days", key: "leaveDays", width: 12 },
        ];
        summarySheet.addRows(rows);
        summarySheet.getRow(1).font = { bold: true };
        const leadsSheet = workbook.addWorksheet("Leads");
        const leadCols = [
          { header: "Employee ID", key: "employeeNumber", width: 12 },
          { header: "Employee Name", key: "employeeName", width: 18 },
          { header: "Date", key: "date", width: 12 },
          { header: "Customer Name", key: "customerName", width: 20 },
          { header: "DOB", key: "dateOfBirth", width: 12 },
          { header: "Phone", key: "customerPhone", width: 14 },
          { header: "Email", key: "customerEmail", width: 22 },
          { header: "Location", key: "location", width: 18 },
          { header: "Loan Type", key: "loanType", width: 14 },
          { header: "Sub Type", key: "subLoanType", width: 12 },
          { header: "Income Type", key: "incomeType", width: 14 },
          { header: "Income Comments", key: "incomeComments", width: 20 },
          { header: "Request Amount", key: "amount", width: 14 },
          { header: "CIBIL", key: "cibil", width: 8 },
          { header: "Company Logged", key: "companyLogged", width: 16 },
          { header: "Application No", key: "applicationNumber", width: 18 },
          { header: "Tenure", key: "tenure", width: 8 },
          { header: "ROI", key: "roi", width: 8 },
          { header: "Disbursed Amount", key: "loanDisbursed", width: 16 },
          { header: "Sanctioned At", key: "loanSanctionedAt", width: 12 },
          { header: "Disbursed At", key: "loanDisbursedAt", width: 12 },
          { header: "Status", key: "status", width: 12 },
          { header: "Notes", key: "notes", width: 24 },
          { header: "Form Location", key: "formLocation", width: 28 },
          { header: "Payout %", key: "payoutPercent", width: 10 },
          { header: "Payout Amount", key: "payoutAmount", width: 12 },
          { header: "Reconsil", key: "reconsil", width: 14 },
          { header: "Payment Status", key: "paymentStatus", width: 14 },
        ];
        leadsSheet.columns = leadCols;
        leadsSheet.addRows(leadRows);
        leadsSheet.getRow(1).font = { bold: true };
        const insuranceSheet = workbook.addWorksheet("Insurance Leads");
        const insCols = [
          { header: "Employee ID", key: "employeeNumber", width: 12 },
          { header: "Employee Name", key: "employeeName", width: 18 },
          { header: "Date", key: "date", width: 12 },
          { header: "Customer Name", key: "customerName", width: 20 },
          { header: "DOB", key: "dateOfBirth", width: 12 },
          { header: "Contact", key: "contactNum", width: 14 },
          { header: "Email", key: "mailId", width: 22 },
          { header: "Location", key: "location", width: 18 },
          { header: "Insurance Type", key: "insuranceType", width: 16 },
          { header: "Category", key: "insuranceCategory", width: 12 },
          { header: "Product Type", key: "insuranceProductType", width: 14 },
          { header: "Product Type Other", key: "insuranceProductTypeOther", width: 18 },
          { header: "Vehicle No", key: "vehicleNumber", width: 14 },
          { header: "Subtype", key: "insuranceSubtype", width: 14 },
          { header: "Subtype Other", key: "insuranceSubtypeOther", width: 14 },
          { header: "Profile Type", key: "profileType", width: 12 },
          { header: "Profile Comments", key: "profileComments", width: 20 },
          { header: "Business Type", key: "businessType", width: 14 },
          { header: "Business Comments", key: "businessTypeComments", width: 18 },
          { header: "Payment Mode", key: "paymentMode", width: 12 },
          { header: "Payment Mode Comments", key: "paymentModeComments", width: 20 },
          { header: "Payment Done By", key: "paymentDoneBy", width: 14 },
          { header: "Payment Done By Comments", key: "paymentDoneByComments", width: 22 },
          { header: "Income Type", key: "incomeType", width: 12 },
          { header: "Premium Quoted", key: "premiumQuoted", width: 14 },
          { header: "Premium Collected", key: "premiumCollected", width: 14 },
          { header: "Net Premium", key: "netPremium", width: 14 },
          { header: "Difference", key: "difference", width: 12 },
          { header: "Misc Expenses", key: "miscellaneousExpenses", width: 14 },
          { header: "Status", key: "status", width: 10 },
          { header: "Notes", key: "notes", width: 24 },
          { header: "Form Location", key: "formLocation", width: 28 },
          { header: "Policy Number", key: "policyNumber", width: 16 },
          { header: "Policy Start", key: "policyStartDate", width: 14 },
          { header: "Policy End", key: "policyEndDate", width: 14 },
          { header: "Collected Premium", key: "collectedPremium", width: 14 },
          { header: "Actual Premium", key: "actualPremium", width: 14 },
          { header: "Final Remarks", key: "finalRemarks", width: 24 },
        ];
        insuranceSheet.columns = insCols;
        insuranceSheet.addRows(insuranceRows);
        insuranceSheet.getRow(1).font = { bold: true };
        const attendanceSheet = workbook.addWorksheet("Attendance");
        attendanceSheet.columns = [
          { header: "Employee ID", key: "employeeNumber", width: 12 },
          { header: "Employee Name", key: "employeeName", width: 18 },
          { header: "Date", key: "date", width: 12 },
          { header: "Login At", key: "loginAt", width: 20 },
          { header: "Logout At", key: "logoutAt", width: 20 },
          { header: "Status", key: "status", width: 12 },
          { header: "Login Location", key: "loginLocation", width: 24 },
          { header: "Logout Location", key: "logoutLocation", width: 24 },
          { header: "Leads Count", key: "leadsCount", width: 10 },
        ];
        attendanceSheet.addRows(attendanceRows);
        attendanceSheet.getRow(1).font = { bold: true };
        const leaveSheet = workbook.addWorksheet("Leave");
        leaveSheet.columns = [
          { header: "Employee ID", key: "employeeNumber", width: 12 },
          { header: "Employee Name", key: "employeeName", width: 18 },
          { header: "Leave Type", key: "leaveType", width: 12 },
          { header: "Start Date", key: "startDate", width: 12 },
          { header: "End Date", key: "endDate", width: 12 },
          { header: "Reason", key: "reason", width: 24 },
          { header: "Status", key: "status", width: 10 },
        ];
        leaveSheet.addRows(leaveRows);
        leaveSheet.getRow(1).font = { bold: true };
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${fromParam && toParam ? `${fromParam}-${toParam}` : monthStart}.xlsx"`);
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(Buffer.from(buffer));
        return;
      }
      if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${fromParam && toParam ? `${fromParam}-${toParam}` : monthStart}.pdf"`);
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        doc.pipe(res);
        const MARGIN = 40;
        const LINE_GAP = 1;

        function pageBottom(): number {
          return doc.page.height - doc.page.margins.bottom;
        }

        function normalizePdfCell(raw: unknown): string {
          return String(raw ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+/g, " ")
            .trim();
        }

        /** Distribute `tableW` across columns by relative weights (exact total width, min per column). */
        function pdfWidthsFromWeights(tableW: number, weights: number[]): number[] {
          const sum = weights.reduce((a, b) => a + b, 0);
          const minCol = 8;
          const scaled = weights.map((w) => Math.max(minCol, (tableW * w) / sum));
          const s2 = scaled.reduce((a, b) => a + b, 0);
          return scaled.map((w) => (w * tableW) / s2);
        }

        function pdfColumnLefts(left: number, widths: number[]): number[] {
          const xs: number[] = [];
          let x = left;
          for (let i = 0; i < widths.length; i++) {
            xs.push(x);
            x += widths[i];
          }
          return xs;
        }

        /** Shrink text (with …) until wrapped height fits `maxH`. */
        function fitPdfTextToHeight(
          d: import("pdfkit").PDFDocument,
          raw: string,
          cellW: number,
          maxH: number,
          lineGap: number
        ): string {
          let s = normalizePdfCell(raw).replace(/\n/g, " ");
          if (!s) return "";
          let h = d.heightOfString(s, { width: cellW, lineGap });
          if (h <= maxH) return s;
          const ell = "…";
          let low = 0;
          let high = s.length;
          while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            const cand = s.slice(0, mid) + (mid < s.length ? ell : "");
            h = d.heightOfString(cand, { width: cellW, lineGap });
            if (h <= maxH) low = mid;
            else high = mid - 1;
          }
          return low > 0 ? s.slice(0, low) + ell : ell;
        }

        function measureWrappedRowHeight(
          d: import("pdfkit").PDFDocument,
          cells: string[],
          widths: number[],
          lineGap: number,
          maxCellH: number
        ): number {
          let maxH = 0;
          for (let i = 0; i < cells.length; i++) {
            const fitted = fitPdfTextToHeight(d, cells[i], widths[i], maxCellH, lineGap);
            const h = d.heightOfString(fitted, { width: widths[i], lineGap });
            maxH = Math.max(maxH, h);
          }
          return Math.max(maxH, d.currentLineHeight() + 2);
        }

        doc.fontSize(16).text(`Full Report – ${monthLabel}`, { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).text("Summary", { continued: false });
        const summaryHeaders = ["Emp ID", "Name", "Role", "Budget", "Achieve", "FTD Val", "MTD Val", "Logged", "Sanct", "Disb Val", "MTD Ins", "Overall"];
        const summaryWeights = [1, 2.2, 1.7, 1, 1, 1.05, 1.05, 1, 1, 1.05, 1.05, 1];
        const summaryFont = 9;
        const summaryMaxCellH = 56;
        let y = doc.y + 8;
        const summaryTableW = () => doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const summaryLeft = () => doc.page.margins.left;

        const drawSummaryHeader = () => {
          const left = summaryLeft();
          const tw = summaryTableW();
          const widths = pdfWidthsFromWeights(tw, summaryWeights);
          const xs = pdfColumnLefts(left, widths);
          doc.fontSize(summaryFont).font("Helvetica-Bold");
          const cells = summaryHeaders;
          const rowH = measureWrappedRowHeight(doc, cells, widths, LINE_GAP, summaryMaxCellH);
          if (y + rowH > pageBottom()) {
            doc.addPage({ margin: MARGIN, size: "A4" });
            y = doc.page.margins.top;
          }
          const rowY = y;
          for (let i = 0; i < cells.length; i++) {
            const t = fitPdfTextToHeight(doc, cells[i], widths[i], summaryMaxCellH, LINE_GAP);
            doc.text(t, xs[i], rowY, { width: widths[i], lineGap: LINE_GAP });
          }
          y += rowH + 3;
          doc.font("Helvetica");
        };

        drawSummaryHeader();
        doc.fontSize(summaryFont);
        for (const r of rows) {
          const left = summaryLeft();
          const tw = summaryTableW();
          const widths = pdfWidthsFromWeights(tw, summaryWeights);
          const xs = pdfColumnLefts(left, widths);
          const summaryValues = [
            String(r.employeeNumber ?? ""),
            String(r.name ?? ""),
            String(r.role ?? ""),
            String(r.budget ?? 0),
            String(r.achievement ?? 0),
            String(r.ftdLoansValue ?? 0),
            String(r.mtdLoansValue ?? 0),
            String(r.loggedValue ?? 0),
            String(r.sanctionedValue ?? 0),
            String(r.disbursedValue ?? 0),
            String(r.mtdInsuranceValue ?? 0),
            String(r.overallLeads ?? 0),
          ];
          const rowH = measureWrappedRowHeight(doc, summaryValues, widths, LINE_GAP, summaryMaxCellH);
          if (y + rowH > pageBottom()) {
            doc.addPage({ margin: MARGIN, size: "A4" });
            y = doc.page.margins.top;
            drawSummaryHeader();
          }
          const rowY = y;
          for (let i = 0; i < summaryValues.length; i++) {
            const t = fitPdfTextToHeight(doc, summaryValues[i], widths[i], summaryMaxCellH, LINE_GAP);
            doc.text(t, xs[i], rowY, { width: widths[i], lineGap: LINE_GAP });
          }
          y += rowH + 3;
        }
        doc.moveDown(0.5);
        y = doc.y + 4;

        function drawTable(
          title: string,
          headers: string[],
          dataRows: Record<string, string | number>[],
          keyOrder: string[],
          layout: "portrait" | "landscape",
          forceNewPage: boolean,
          opts: {
            colWeights?: number[];
            fontSize: number;
            maxCellHeight: number;
            /** If set, scale these relative widths to full table width instead of `colWeights`. */
            fixedWidths?: number[];
          }
        ) {
          if (forceNewPage) {
            doc.addPage({ margin: MARGIN, size: "A4", layout });
            y = doc.page.margins.top;
          } else if (y > doc.page.margins.top + 50) {
            doc.addPage({ margin: MARGIN, size: "A4", layout });
            y = doc.page.margins.top;
          }

          const left = doc.page.margins.left;
          const tw = doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const sumFixed = opts.fixedWidths?.reduce((a, b) => a + b, 0) ?? 0;
          const weightsForLayout =
            opts.fixedWidths && sumFixed > 0
              ? opts.fixedWidths.map((w) => w / sumFixed)
              : opts.colWeights;
          if (!weightsForLayout?.length) return;
          const widths = pdfWidthsFromWeights(tw, weightsForLayout);
          const xs = pdfColumnLefts(left, widths);
          const fs = opts.fontSize;
          const maxCellH = opts.maxCellHeight;

          const drawHeaderRow = () => {
            doc.fontSize(fs).font("Helvetica-Bold");
            const rowH = measureWrappedRowHeight(doc, headers, widths, LINE_GAP, maxCellH);
            if (y + rowH > pageBottom()) {
              doc.addPage({ margin: MARGIN, size: "A4", layout });
              y = doc.page.margins.top;
            }
            const rowY = y;
            for (let i = 0; i < headers.length; i++) {
              const t = fitPdfTextToHeight(doc, headers[i], widths[i], maxCellH, LINE_GAP);
              doc.text(t, xs[i], rowY, { width: widths[i], lineGap: LINE_GAP });
            }
            y += rowH + 2;
            doc.font("Helvetica");
          };

          const titleY = y;
          doc.fontSize(10).font("Helvetica").text(title, left, titleY);
          y = titleY + 16;
          drawHeaderRow();

          for (const row of dataRows) {
            const cells = keyOrder.map((k) => {
              const val = row[k];
              return val !== undefined && val !== null ? String(val) : "";
            });
            const rowH = measureWrappedRowHeight(doc, cells, widths, LINE_GAP, maxCellH);
            if (y + rowH > pageBottom()) {
              doc.addPage({ margin: MARGIN, size: "A4", layout });
              y = doc.page.margins.top;
              drawHeaderRow();
            }
            const rowY = y;
            doc.fontSize(fs);
            for (let i = 0; i < cells.length; i++) {
              const t = fitPdfTextToHeight(doc, cells[i], widths[i], maxCellH, LINE_GAP);
              doc.text(t, xs[i], rowY, { width: widths[i], lineGap: LINE_GAP });
            }
            y += rowH + 2;
          }
          doc.y = y;
          doc.moveDown(0.5);
          y = doc.y + 4;
        }

        const leadHeaders = ["Emp ID", "Name", "Date", "Customer", "DOB", "Phone", "Email", "Location", "Loan Type", "Sub", "Income", "Income Cmt", "Request Amt", "CIBIL", "Co Logged", "App No", "Tenure", "ROI", "Disb Amt", "Sanct", "Disb At", "Status", "Notes", "Form Loc", "Payout%", "Payout Amt", "Reconsil", "Pay Status"];
        const leadKeys = ["employeeNumber", "employeeName", "date", "customerName", "dateOfBirth", "customerPhone", "customerEmail", "location", "loanType", "subLoanType", "incomeType", "incomeComments", "amount", "cibil", "companyLogged", "applicationNumber", "tenure", "roi", "loanDisbursed", "loanSanctionedAt", "loanDisbursedAt", "status", "notes", "formLocation", "payoutPercent", "payoutAmount", "reconsil", "paymentStatus"];
        const leadWeights = [1, 1.5, 1, 1.7, 0.95, 1.25, 1.6, 1.35, 0.85, 0.75, 0.85, 1.1, 1, 0.7, 0.85, 1, 0.55, 0.5, 1, 0.95, 0.95, 0.8, 1.9, 1, 0.55, 0.75, 0.65, 0.75];
        doc.addPage({ margin: MARGIN, size: "A4", layout: "landscape" });
        y = doc.page.margins.top;
        drawTable("Leads (full)", leadHeaders, leadRows, leadKeys, "landscape", false, {
          colWeights: leadWeights,
          fontSize: 7,
          maxCellHeight: 42,
        });

        const insHeaders = ["Emp ID", "Name", "Date", "Customer", "DOB", "Contact", "Email", "Loc", "Type", "Cat", "Prod", "Prod Oth", "Vehicle", "Sub", "Sub Oth", "Profile", "Prof Cmt", "Biz", "Biz Cmt", "Pay Mode", "Pay Cmt", "Pay By", "Pay By Cmt", "Income", "Quoted", "Coll", "Net", "Diff", "Misc", "Status", "Notes", "Form Loc", "Pol No", "Pol Start", "Pol End", "Coll Prem", "Actual", "Remarks"];
        const insKeys = ["employeeNumber", "employeeName", "date", "customerName", "dateOfBirth", "contactNum", "mailId", "location", "insuranceType", "insuranceCategory", "insuranceProductType", "insuranceProductTypeOther", "vehicleNumber", "insuranceSubtype", "insuranceSubtypeOther", "profileType", "profileComments", "businessType", "businessTypeComments", "paymentMode", "paymentModeComments", "paymentDoneBy", "paymentDoneByComments", "incomeType", "premiumQuoted", "premiumCollected", "netPremium", "difference", "miscellaneousExpenses", "status", "notes", "formLocation", "policyNumber", "policyStartDate", "policyEndDate", "collectedPremium", "actualPremium", "finalRemarks"];
        const insWeights = [1, 1.45, 0.95, 1.55, 0.9, 1.15, 1.45, 1.2, 0.75, 0.65, 0.85, 0.85, 0.95, 0.65, 0.75, 0.85, 1, 0.8, 0.85, 0.75, 0.75, 0.75, 0.75, 0.75, 0.85, 0.8, 0.75, 0.65, 0.65, 0.75, 1.75, 0.95, 0.95, 0.85, 0.85, 0.85, 0.85, 1.1];
        drawTable("Insurance Leads (full)", insHeaders, insuranceRows, insKeys, "landscape", false, {
          colWeights: insWeights,
          fontSize: 6.5,
          maxCellHeight: 40,
        });

        const attHeaders = ["Emp ID", "Name", "Date", "Login", "Logout", "Login loc", "Logout loc", "Leads"];
        const attKeys = ["employeeNumber", "employeeName", "date", "loginAt", "logoutAt", "loginLocation", "logoutLocation", "leadsCount"];
        const attFixed = [36, 42, 38, 44, 44, 50, 50, 28];
        drawTable("Attendance", attHeaders, attendanceRows, attKeys, "portrait", true, {
          fixedWidths: attFixed,
          fontSize: 8,
          maxCellHeight: 52,
        });

        const leaveHeaders = ["Emp ID", "Name", "Type", "Start", "End", "Reason", "Status"];
        const leaveKeys = ["employeeNumber", "employeeName", "leaveType", "startDate", "endDate", "reason", "status"];
        const leaveFixed = [40, 55, 40, 42, 42, 70, 38];
        drawTable("Leave", leaveHeaders, leaveRows, leaveKeys, "portrait", false, {
          fixedWidths: leaveFixed,
          fontSize: 8,
          maxCellHeight: 64,
        });

        doc.end();
        return;
      }
    } catch (e) {
      next(e);
    }
  }

  app.get("/api/staff/export/monthly", requireAuth, requireAdminOrTeamLead, handleStaffMonthlyExport);

  app.post("/api/staff/export/monthly-native-token", requireAuth, requireAdminOrTeamLead, async (req, res) => {
    try {
      const format = String(req.body?.format ?? "").toLowerCase();
      if (!format || !["xlsx", "pdf"].includes(format)) {
        return res.status(400).json({ message: "format must be xlsx or pdf" });
      }
      const monthParam = (req.body?.month as string)?.trim() || undefined;
      const fromParam = (req.body?.from as string)?.trim() || undefined;
      const toParam = (req.body?.to as string)?.trim() || undefined;
      const employeeId = (req.body?.employeeId as string)?.trim() || undefined;
      const token = randomBytes(24).toString("hex");
      monthlyExportTokenStore.set(token, {
        userId: (req.user as { id: string }).id,
        role: (req.user as { role: string }).role,
        format,
        monthParam,
        fromParam,
        toParam,
        employeeId,
        exp: Date.now() + 5 * 60 * 1000,
      });
      res.json({ token });
    } catch {
      res.status(500).json({ message: "Failed to create download token" });
    }
  });

  app.get("/api/staff/export/monthly-file", async (req, res, next) => {
    try {
      const token = String(req.query.token ?? "").trim();
      if (!token) return res.status(400).json({ message: "token required" });
      const row = monthlyExportTokenStore.get(token);
      if (!row || row.exp < Date.now()) {
        return res.status(401).json({ message: "Invalid or expired download token" });
      }
      monthlyExportTokenStore.delete(token);
      (req as { user?: unknown }).user = { id: row.userId, role: row.role };
      const q = req.query as Record<string, string | string[] | undefined>;
      q.format = row.format;
      if (row.monthParam) q.month = row.monthParam;
      else delete q.month;
      if (row.fromParam) q.from = row.fromParam;
      else delete q.from;
      if (row.toParam) q.to = row.toParam;
      else delete q.to;
      if (row.employeeId) q.employeeId = row.employeeId;
      else delete q.employeeId;
      delete q.token;
      await handleStaffMonthlyExport(req, res, next);
    } catch (e) {
      next(e);
    }
  });

  return httpServer;
}
