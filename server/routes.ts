import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import passport from "passport";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./auth";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const AVATARS_DIR = path.join(UPLOADS_DIR, "avatars");

const LEAD_MIN_FOR_PRESENT = 2;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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

  app.get("/api/staff/attendance", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const from = (req.query.from as string) || undefined;
      const to = (req.query.to as string) || undefined;
      const logs = await storage.getAllAttendanceLogs(from, to);
      const employees = await storage.listEmployees();
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      res.json(
        logs.map((l) => ({
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
      const lead = await storage.createLead({
        employeeId: userId,
        date: dateStr,
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone ?? null,
        customerEmail: body.customerEmail ?? null,
        location: body.location ?? null,
        loanType: body.loanType ?? null,
        incomeType: body.incomeType ?? null,
        amount: body.amount ?? null,
        cibil: body.cibil ?? null,
        docsCollected: body.docsCollected ?? null,
        companyLogged: body.companyLogged ?? null,
        roi: body.roi ?? null,
        loanDisbursed: body.loanDisbursed ?? null,
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

  app.get("/api/staff/leads", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const employeeId = (req.query.employeeId as string) || undefined;
      const fromDate = (req.query.from as string) || undefined;
      const toDate = (req.query.to as string) || undefined;
      const status = (req.query.status as string) || undefined;
      const list = await storage.getAllLeads({ employeeId, fromDate, toDate, status });
      const employees = await storage.listEmployees();
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

  app.get("/api/staff/leads/:id", requireAuth, async (req, res, next) => {
    try {
      const id = req.params.id;
      const lead = await storage.getLead(id);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === "admin";
      if (!isAdmin && lead.employeeId !== userId) return res.status(404).json({ message: "Lead not found" });
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
      const isAdmin = (req.user as any).role === "admin";
      if (!isAdmin && lead.employeeId !== userId) return res.status(403).json({ message: "Forbidden" });
      const body = req.body || {};
      const data: Record<string, unknown> = {};
      if (body.customerName !== undefined) data.customerName = body.customerName;
      if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone;
      if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail;
      if (body.location !== undefined) data.location = body.location;
      if (body.loanType !== undefined) data.loanType = body.loanType;
      if (body.incomeType !== undefined) data.incomeType = body.incomeType;
      if (body.amount !== undefined) data.amount = body.amount;
      if (body.cibil !== undefined) data.cibil = body.cibil;
      if (body.docsCollected !== undefined) data.docsCollected = body.docsCollected;
      if (body.companyLogged !== undefined) data.companyLogged = body.companyLogged;
      if (body.roi !== undefined) data.roi = body.roi;
      if (body.loanDisbursed !== undefined) data.loanDisbursed = body.loanDisbursed;
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
        contactNum: body.contactNum ?? null,
        mailId: body.mailId ?? null,
        location: body.location ?? null,
        insuranceType: body.insuranceType ?? null,
        incomeType: body.incomeType ?? null,
        premiumQuoted: body.premiumQuoted ?? null,
        premiumCollected: body.premiumCollected ?? null,
        status: body.status ?? "open",
        notes: body.notes ?? null,
      });
      res.status(201).json(lead);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/staff/insurance-leads", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const employeeId = (req.query.employeeId as string) || undefined;
      const fromDate = (req.query.from as string) || undefined;
      const toDate = (req.query.to as string) || undefined;
      const list = await storage.getAllInsuranceLeads({ employeeId, fromDate, toDate });
      const employees = await storage.listEmployees();
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

  // --- Staff: monthly target (for employees, popup on login) ---
  const MONTHLY_TARGET_LEADS = 20;
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
      const monthTarget = MONTHLY_TARGET_LEADS;
      const achievement = overallLeadsGenerated;
      const achievementPct = monthTarget > 0 ? Math.round((achievement / monthTarget) * 100) : 0;
      let conveyancePct = 0;
      if (overallLeadsGenerated >= 20) {
        if (achievementPct >= 100) conveyancePct = 120;
        else if (leadsConverted > 2) conveyancePct = 100;
        else if (leadsConverted >= 2) conveyancePct = 50;
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
        monthLabel: now.toLocaleString("default", { month: "long", year: "numeric" }),
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

  // --- Staff: employees (admin only) ---
  app.get("/api/staff/employees", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const list = await storage.listEmployees();
      res.json(
        list.map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          fullName: u.fullName ?? null,
          email: u.email ?? null,
          phone: u.phone ?? null,
          employeeNumber: (u as any).employeeNumber ?? null,
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
      const user = await storage.createUser({
        username,
        password,
        role: "employee",
        fullName,
        email,
        phone,
      });
      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  // --- Staff: dashboard summary (admin only) ---
  app.get("/api/staff/dashboard", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const today = todayStr();
      const employees = await storage.listEmployees();
      const allAttendance = await storage.getAllAttendanceLogs(today, today);
      const allLeads = await storage.getAllLeads({ fromDate: today, toDate: today });
      const closures = await storage.getAllLeads({ status: "closed_won" });
      const byId: Record<string, { name: string; number: string }> = {};
      for (const u of employees) {
        byId[u.id] = {
          name: (u as any).fullName?.trim() || u.username || u.id,
          number: (u as any).employeeNumber ?? "",
        };
      }
      res.json({
        today,
        employeeCount: employees.length,
        attendanceToday: allAttendance.map((a) => ({
          ...a,
          employeeName: byId[a.employeeId]?.name ?? a.employeeId,
          employeeNumber: byId[a.employeeId]?.number ?? "",
        })),
        leadsToday: allLeads.map((l) => ({
          ...l,
          employeeName: byId[l.employeeId]?.name ?? l.employeeId,
          employeeNumber: byId[l.employeeId]?.number ?? "",
        })),
        totalClosures: closures.length,
      });
    } catch (e) {
      next(e);
    }
  });

  return httpServer;
}
