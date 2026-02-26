import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import passport from "passport";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireAdminOrTeamLead } from "./auth";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const AVATARS_DIR = path.join(UPLOADS_DIR, "avatars");

const LEAD_MIN_FOR_PRESENT = 2;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
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
      const log = await storage.setAttendanceLogin(userId, dateStr);
      res.json(log);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/staff/attendance/logout", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const dateStr = (req.body?.date as string) || todayStr();
      const log = await storage.setAttendanceLogout(userId, dateStr);
      res.json(log);
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
      res.json(logs);
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
      res.json(
        filteredLogs.map((l) => ({
          ...l,
          employeeName: byId[l.employeeId]?.name ?? l.employeeId,
          employeeNumber: byId[l.employeeId]?.number ?? "",
        }))
      );
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
      const lead = await storage.createLead({
        employeeId: userId,
        date: dateStr,
        customerName: body.customerName ?? null,
        dateOfBirth: body.dateOfBirth && String(body.dateOfBirth).trim() ? String(body.dateOfBirth).trim().slice(0, 10) : null,
        customerPhone: body.customerPhone ?? null,
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
        tenure: body.tenure ?? null,
        roi: body.roi ?? null,
        loanDisbursed: body.loanDisbursed ?? null,
        loanSanctionedAt: body.loanSanctionedAt && String(body.loanSanctionedAt).trim() ? String(body.loanSanctionedAt).trim().slice(0, 10) : null,
        loanDisbursedAt: body.loanDisbursedAt && String(body.loanDisbursedAt).trim() ? String(body.loanDisbursedAt).trim().slice(0, 10) : null,
        status: body.status ?? "open",
        notes: body.notes ?? null,
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
      if (body.tenure !== undefined) data.tenure = body.tenure;
      if (body.roi !== undefined) data.roi = body.roi;
      if (body.loanDisbursed !== undefined) data.loanDisbursed = body.loanDisbursed;
      if (body.loanSanctionedAt !== undefined) data.loanSanctionedAt = body.loanSanctionedAt && String(body.loanSanctionedAt).trim() ? String(body.loanSanctionedAt).trim().slice(0, 10) : null;
      if (body.loanDisbursedAt !== undefined) data.loanDisbursedAt = body.loanDisbursedAt && String(body.loanDisbursedAt).trim() ? String(body.loanDisbursedAt).trim().slice(0, 10) : null;
      if (body.status !== undefined) data.status = body.status;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.date !== undefined) data.date = body.date;
      // Admin-only fields: only admins can set these
      if (isAdmin) {
        if (body.payoutPercent !== undefined) data.payoutPercent = body.payoutPercent;
        if (body.payoutAmount !== undefined) data.payoutAmount = body.payoutAmount;
        if (body.reconsil !== undefined) data.reconsil = body.reconsil;
        if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus;
      }
      const updated = await storage.updateLead(id, data);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      const dateStr = (updated.date as unknown as string).slice?.(0, 10) ?? String(updated.date);
      const count = await storage.getLeadsCountForEmployeeOnDate(updated.employeeId, dateStr);
      await storage.updateAttendanceFromLeadsCount(updated.employeeId, dateStr, count);
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
      const lead = await storage.createInsuranceLead({
        employeeId: userId,
        date: dateStr,
        customerName: body.customerName ?? null,
        dateOfBirth: body.dateOfBirth && String(body.dateOfBirth).trim() ? String(body.dateOfBirth).trim().slice(0, 10) : null,
        contactNum: body.contactNum ?? null,
        mailId: body.mailId ?? null,
        location: body.location ?? null,
        insuranceType: body.insuranceType ?? null,
        insuranceSubtype: body.insuranceSubtype ?? null,
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
        difference: body.difference ?? null,
        status: body.status ?? "open",
        notes: body.notes ?? null,
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

  app.patch("/api/staff/insurance-leads/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getInsuranceLead(id);
      if (!lead) return res.status(404).json({ message: "Insurance lead not found" });
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (body.collectedPremium !== undefined) data.collectedPremium = body.collectedPremium;
      if (body.actualPremium !== undefined) data.actualPremium = body.actualPremium;
      if (body.finalRemarks !== undefined) data.finalRemarks = body.finalRemarks;
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

  // --- Staff: leave requests ---
  app.post("/api/staff/leave", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const body = req.body || {};
      const leaveType = (body.leaveType as string)?.trim() || "personal";
      const startDate = (body.startDate as string)?.trim();
      const endDate = (body.endDate as string)?.trim();
      const reason = (body.reason as string)?.trim() || null;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      if (startDate > endDate) {
        return res.status(400).json({ message: "Start date must be before or equal to end date" });
      }
      const validTypes = ["personal", "sick", "casual", "emergency", "other"];
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

  app.patch("/api/staff/leave/:id", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const id = req.params.id;
      const leave = await storage.getLeaveRequest(id);
      if (!leave) return res.status(404).json({ message: "Leave request not found" });
      if (leave.status !== "pending") {
        return res.status(400).json({ message: "Leave request already processed" });
      }
      const userId = (req.user as any).id;
      const visibleIds = await getVisibleEmployeeIds(req);
      if (visibleIds !== null && !visibleIds.includes(leave.employeeId)) {
        return res.status(403).json({ message: "You can only approve/reject leave for your team members" });
      }
      const status = (req.body?.status as string) === "rejected" ? "rejected" : "approved";
      const updated = await storage.updateLeaveRequest(id, {
        status,
        approvedById: userId,
        approvedAt: new Date(),
      });
      if (!updated) return res.status(500).json({ message: "Update failed" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: monthly target (for employees + team_lead popup on login) ---
  const DEFAULT_MONTHLY_TARGET_LEADS = 20;
  app.get("/api/staff/monthly-target", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const role = (req.user as any).role;
      if (role === "admin") {
        return res.json({ forStaffOnly: true });
      }
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

      if (role === "team_lead") {
        const employees = await storage.listEmployees({ teamLeadId: userId });
        let overallTarget = 0;
        let teamLeadsThisMonth = 0;
        let teamLeadsConverted = 0;
        let teamLeadsOpen = 0;
        let teamSanctionAmount = 0;
        for (const emp of employees) {
          const target = (emp as any).monthlyLeadTarget != null && !Number.isNaN(Number((emp as any).monthlyLeadTarget))
            ? Number((emp as any).monthlyLeadTarget)
            : DEFAULT_MONTHLY_TARGET_LEADS;
          overallTarget += target;
          const empLeads = await storage.getLeadsByEmployee(emp.id, from, to);
          teamLeadsThisMonth += empLeads.length;
          const converted = empLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
          teamLeadsConverted += converted;
          teamLeadsOpen += empLeads.filter((l) => (l.status || "").toLowerCase() === "open").length;
          empLeads.forEach((l) => {
            if ((l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned") {
              const amt = (l as any).loanDisbursed || (l as any).amount;
              if (amt) {
                const n = parseFloat(String(amt).replace(/,/g, ""));
                if (!Number.isNaN(n)) teamSanctionAmount += n;
              }
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

      const user = await storage.getUser(userId);
      const monthTargetFromDb = user && (user as any).monthlyLeadTarget != null ? Number((user as any).monthlyLeadTarget) : null;
      const monthTarget = (monthTargetFromDb != null && !Number.isNaN(monthTargetFromDb)) ? monthTargetFromDb : DEFAULT_MONTHLY_TARGET_LEADS;
      const leads = await storage.getLeadsByEmployee(userId, from, to);
      const overallLeadsGenerated = leads.length;
      const leadsConverted = leads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
      const leadsOpen = leads.filter((l) => (l.status || "").toLowerCase() === "open").length;
      let sanctionAmount = 0;
      leads.forEach((l) => {
        if ((l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned") {
          const amt = l.loanDisbursed || l.amount;
          if (amt) {
            const n = parseFloat(String(amt).replace(/,/g, ""));
            if (!Number.isNaN(n)) sanctionAmount += n;
          }
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
          assignedBudget: t ? String(t.assignedBudget) : "0",
          assignedLeads: t?.assignedLeads ?? 0,
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
      if (company && company.isLocked === 1) {
        return res.status(400).json({ message: "Targets are locked for this month" });
      }
      const totalBudget = company ? parseFloat(String(company.totalBudget)) : 0;
      const totalLeads = company?.totalLeads ?? 0;
      const leaderTargets = Array.isArray(body.leaderTargets) ? body.leaderTargets : [];
      let sumBudget = 0;
      let sumLeads = 0;
      for (const lt of leaderTargets) {
        const b = parseFloat(String(lt.assignedBudget));
        const l = Number(lt.assignedLeads) || 0;
        if (!Number.isNaN(b)) sumBudget += b;
        sumLeads += l;
      }
      const budgetMatch = Math.abs(sumBudget - totalBudget) < 0.01;
      if (!budgetMatch || sumLeads !== totalLeads) {
        return res.status(400).json({
          message: "Sum of leader budgets must equal company budget and sum of leader leads must equal company leads",
          totalBudget,
          totalLeads,
          sumBudget,
          sumLeads,
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
          assignedBudget: t ? String(t.assignedBudget) : "0",
          assignedLeads: t?.assignedLeads ?? 0,
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
      const leaderBudget = leaderTarget ? parseFloat(String(leaderTarget.assignedBudget)) : 0;
      const leaderLeads = leaderTarget?.assignedLeads ?? 0;
      const company = await storage.getCompanyMonthlyTarget(month, year);
      if (company && company.isLocked === 1) {
        return res.status(400).json({ message: "Targets are locked for this month" });
      }
      const employeeTargets = Array.isArray(body.employeeTargets) ? body.employeeTargets : [];
      let sumBudget = 0;
      let sumLeads = 0;
      for (const et of employeeTargets) {
        const b = parseFloat(String(et.assignedBudget));
        if (!Number.isNaN(b)) sumBudget += b;
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
      const assignedBudget = target ? parseFloat(String(target.assignedBudget)) : 0;
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
        assignedBudget: target ? String(target.assignedBudget) : "0",
        assignedLeads: target?.assignedLeads ?? 0,
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
      const user = await storage.getUser(userId);
      const monthTargetFromDb = user && (user as any).monthlyLeadTarget != null ? Number((user as any).monthlyLeadTarget) : null;
      const monthTarget = (monthTargetFromDb != null && !Number.isNaN(monthTargetFromDb)) ? monthTargetFromDb : DEFAULT_MONTHLY_TARGET_LEADS;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const leadsThisMonth = await storage.getLeadsByEmployee(userId, monthStart, monthEnd);
      const achievement = leadsThisMonth.length;
      const achievementPct = monthTarget > 0 ? Math.round((achievement / monthTarget) * 100) : 0;
      const attendanceLogs = await storage.getAttendanceLogsByEmployee(userId, monthStart, monthEnd);
      const daysPresent = attendanceLogs.filter((a) => (a.status || "").toLowerCase() === "present").length;
      const daysLogged = attendanceLogs.length;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const from7 = sevenDaysAgo.toISOString().slice(0, 10);
      const today = todayStr();
      const leadsLast7 = await storage.getLeadsByEmployee(userId, from7, today);
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
      const leadsLast7Days = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
      res.json({
        monthLabel: now.toLocaleString("default", { month: "long", year: "numeric" }),
        leadsThisMonth: achievement,
        monthTarget,
        achievementPct,
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
      let list;
      if (role === "admin") {
        list = await storage.listEmployees();
      } else if (role === "team_lead") {
        list = unassignedOnly
          ? await storage.listEmployees({ unassignedOnly: true })
          : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      } else {
        list = [];
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
      const user = await storage.createUser({
        username,
        password,
        role,
        fullName,
        email,
        phone,
        ...(monthlyLeadTarget != null && !Number.isNaN(monthlyLeadTarget) ? { monthlyLeadTarget } : {}),
        ...(teamLeadId && role === "employee" ? { teamLeadId } : {}),
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
      if (role === "team_lead") {
        const DEFAULT_MONTHLY_TARGET_LEADS = 20;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        let overallTarget = 0;
        const teamMembersSummary: { employeeId: string; employeeName: string; employeeNumber: string; monthlyTarget: number; leadsThisMonth: number; achievementPct: number; leadsConverted: number }[] = [];
        let teamLeadsThisMonth = 0;
        let teamLeadsConverted = 0;
        for (const emp of employees) {
          const target = (emp as any).monthlyLeadTarget != null && !Number.isNaN(Number((emp as any).monthlyLeadTarget))
            ? Number((emp as any).monthlyLeadTarget)
            : DEFAULT_MONTHLY_TARGET_LEADS;
          overallTarget += target;
          const empLeads = await storage.getLeadsByEmployee(emp.id, monthStart, monthEnd);
          const converted = empLeads.filter((l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned").length;
          teamLeadsThisMonth += empLeads.length;
          teamLeadsConverted += converted;
          const achievementPct = target > 0 ? Math.round((empLeads.length / target) * 100) : 0;
          teamMembersSummary.push({
            employeeId: emp.id,
            employeeName: byId[emp.id]?.name ?? emp.id,
            employeeNumber: byId[emp.id]?.number ?? "",
            monthlyTarget: target,
            leadsThisMonth: empLeads.length,
            achievementPct,
            leadsConverted: converted,
          });
        }
        const achievementPct = overallTarget > 0 ? Math.round((teamLeadsThisMonth / overallTarget) * 100) : 0;
        const jointVisits = await storage.getJointVisitsCount((req.user as any).id, monthStart, monthEnd);
        let conveyancePct = 0;
        if (jointVisits >= 4 && teamLeadsThisMonth >= 10) {
          if (achievementPct >= 100) conveyancePct = 120;
          else if (achievementPct >= 80) conveyancePct = 50;
        }
        payload.overallTarget = overallTarget;
        payload.teamLeadsThisMonth = teamLeadsThisMonth;
        payload.achievementPct = achievementPct;
        payload.conveyancePct = conveyancePct;
        payload.teamMembersSummary = teamMembersSummary;
        payload.monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
      }
      res.json(payload);
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: export monthly data (Excel / PDF) ---
  app.get("/api/staff/export/monthly", requireAuth, requireAdminOrTeamLead, async (req, res, next) => {
    try {
      const format = (req.query.format as string)?.toLowerCase();
      const monthParam = (req.query.month as string)?.trim();
      const employeeId = (req.query.employeeId as string) || undefined;
      if (!format || !["xlsx", "pdf"].includes(format)) {
        return res.status(400).json({ message: "Query param format must be xlsx or pdf" });
      }
      let year: number; let month: number;
      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split("-").map(Number);
        year = y; month = m - 1;
      } else {
        const now = new Date();
        year = now.getFullYear(); month = now.getMonth();
      }
      const monthStart = new Date(year, month, 1).toISOString().slice(0, 10);
      const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      const visibleIds = await getVisibleEmployeeIds(req);
      const employees = visibleIds === null
        ? await storage.listEmployees()
        : await storage.listEmployees({ teamLeadId: (req.user as any).id });
      const filtered = employeeId && (visibleIds === null || visibleIds.includes(employeeId))
        ? employees.filter((u) => u.id === employeeId)
        : employees;
      const monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
      const rows: { employeeId: string; employeeNumber: string; name: string; daysPresent: number; leadsCount: number; insuranceLeadsCount: number; leaveDays: number }[] = [];
      for (const u of filtered) {
        const uid = u.id;
        const att = await storage.getAttendanceLogsByEmployee(uid, monthStart, monthEnd);
        const daysPresent = att.filter((a) => (a.status || "").toLowerCase() === "present").length;
        const leadsList = await storage.getLeadsByEmployee(uid, monthStart, monthEnd);
        const insList = await storage.getInsuranceLeadsByEmployee(uid, monthStart, monthEnd);
        const leaveList = await storage.getLeaveRequestsByEmployee(uid, monthStart, monthEnd);
        const approvedLeave = leaveList.filter((l) => (l.status || "").toLowerCase() === "approved");
        let leaveDays = 0;
        for (const lv of approvedLeave) {
          const start = new Date(String(lv.startDate));
          const end = new Date(String(lv.endDate));
          const msStart = new Date(year, month, 1).getTime();
          const msEnd = new Date(year, month + 1, 0).getTime();
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const t = d.getTime();
            if (t >= msStart && t <= msEnd) leaveDays++;
          }
        }
        rows.push({
          employeeId: uid,
          employeeNumber: (u as any).employeeNumber ?? "",
          name: (u as any).fullName?.trim() || u.username || "",
          daysPresent,
          leadsCount: leadsList.length,
          insuranceLeadsCount: insList.length,
          leaveDays,
        });
      }
      if (format === "xlsx") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Monthly Report");
        sheet.columns = [
          { header: "Employee ID", key: "employeeNumber", width: 14 },
          { header: "Name", key: "name", width: 24 },
          { header: "Days Present", key: "daysPresent", width: 14 },
          { header: "Loan Leads", key: "leadsCount", width: 12 },
          { header: "Insurance Leads", key: "insuranceLeadsCount", width: 16 },
          { header: "Leave Days", key: "leaveDays", width: 12 },
        ];
        sheet.addRows(rows);
        sheet.getRow(1).font = { bold: true };
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${monthParam || `${year}-${String(month + 1).padStart(2, "0")}`}.xlsx"`);
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(Buffer.from(buffer));
        return;
      }
      if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${monthParam || `${year}-${String(month + 1).padStart(2, "0")}`}.pdf"`);
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        doc.fontSize(16).text(`Monthly Report – ${monthLabel}`, { align: "center" });
        doc.moveDown();
        doc.fontSize(10);
        const tableTop = doc.y;
        doc.text("Employee ID", 50, tableTop);
        doc.text("Name", 120, tableTop);
        doc.text("Present", 260, tableTop);
        doc.text("Leads", 320, tableTop);
        doc.text("Ins. Leads", 380, tableTop);
        doc.text("Leave", 450, tableTop);
        doc.moveDown(0.5);
        let y = doc.y;
        for (const r of rows) {
          doc.text(r.employeeNumber, 50, y);
          doc.text(r.name.slice(0, 22), 120, y);
          doc.text(String(r.daysPresent), 260, y);
          doc.text(String(r.leadsCount), 320, y);
          doc.text(String(r.insuranceLeadsCount), 380, y);
          doc.text(String(r.leaveDays), 450, y);
          y += 20;
        }
        doc.end();
        return;
      }
    } catch (e) {
      next(e);
    }
  });

  return httpServer;
}
