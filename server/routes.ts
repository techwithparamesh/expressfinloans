import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./auth";

const LEAD_MIN_FOR_PRESENT = 2;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      res.json(logs);
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
        loanType: body.loanType ?? null,
        amount: body.amount ?? null,
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
      res.json(list);
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
      if (body.loanType !== undefined) data.loanType = body.loanType;
      if (body.amount !== undefined) data.amount = body.amount;
      if (body.status !== undefined) data.status = body.status;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.date !== undefined) data.date = body.date;
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
      });
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
      const updated = await storage.updateUser(userId, data);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      res.json({
        id: updated.id,
        username: updated.username,
        role: updated.role,
        fullName: updated.fullName ?? null,
        email: updated.email ?? null,
        phone: updated.phone ?? null,
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
        }))
      );
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
      res.json({
        today,
        employeeCount: employees.length,
        attendanceToday: allAttendance,
        leadsToday: allLeads,
        totalClosures: closures.length,
      });
    } catch (e) {
      next(e);
    }
  });

  return httpServer;
}
