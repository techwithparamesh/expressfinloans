import {
  type User,
  type InsertUser,
  type AttendanceLog,
  type InsertAttendanceLog,
  type Lead,
  type InsertLead,
  type InsuranceLead,
  type InsertInsuranceLead,
  type LeaveRequest,
  type InsertLeaveRequest,
  type AdminExpense,
  type InsertAdminExpense,
  type LeaderExpenseRequest,
  type InsertLeaderExpenseRequest,
  type SalaryStructure,
  type InsertSalaryStructure,
  type PayrollEntry,
  type InsertPayrollEntry,
  type Payslip,
  type InsertPayslip,
  type CompanyMonthlyTarget,
  type MonthlyTarget,
  type MonthlyPerformance,
  type TargetAuditLog,
  users,
  attendanceLogs,
  leads,
  insuranceLeads,
  leaveRequests,
  adminExpenses,
  leaderExpenseRequests,
  salaryStructures,
  payrollEntries,
  payslips,
  companyMonthlyTarget,
  monthlyTargets,
  monthlyPerformance,
  targetAuditLog,
} from "@shared/schema";
import { eq, and, desc, gte, lte, isNull, isNotNull, inArray } from "drizzle-orm";
import { db, hasDb } from "./db";
import { hashPassword } from "./lib/password";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, "fullName" | "email" | "phone" | "password" | "avatarUrl" | "monthlyLeadTarget" | "teamLeadId" | "designation" | "bankAccountNumber" | "bankIfsc" | "pan" | "uan" | "dateOfJoining" | "department" | "location" | "dateOfBirth" | "gender">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getNextEmployeeNumber(): Promise<string>;
  backfillEmployeeNumbers(): Promise<void>;
  listEmployees(filters?: { teamLeadId?: string; unassignedOnly?: boolean }): Promise<User[]>;

  getAttendanceLog(employeeId: string, date: string): Promise<AttendanceLog | undefined>;
  getAttendanceLogsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<AttendanceLog[]>;
  getAllAttendanceLogs(fromDate?: string, toDate?: string): Promise<AttendanceLog[]>;
  upsertAttendanceLog(data: InsertAttendanceLog): Promise<AttendanceLog>;
  setAttendanceLogin(
    employeeId: string,
    dateStr: string,
    options?: { loginLocation?: string | null; loginIp?: string | null; loginLat?: string | null; loginLng?: string | null }
  ): Promise<AttendanceLog>;
  setAttendanceLogout(
    employeeId: string,
    dateStr: string,
    options?: { logoutLocation?: string | null; logoutLat?: string | null; logoutLng?: string | null }
  ): Promise<AttendanceLog>;
  updateAttendanceFromLeadsCount(employeeId: string, dateStr: string, count: number): Promise<void>;

  createLead(data: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<Lead[]>;
  getAllLeads(filters?: { employeeId?: string; fromDate?: string; toDate?: string; status?: string }): Promise<Lead[]>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;
  listEmployees(filters?: { teamLeadId?: string; unassignedOnly?: boolean }): Promise<User[]>;
  listTeamLeads(): Promise<User[]>;
  getLeadsCountForEmployeeOnDate(employeeId: string, dateStr: string): Promise<number>;

  createInsuranceLead(data: InsertInsuranceLead): Promise<InsuranceLead>;
  getInsuranceLead(id: string): Promise<InsuranceLead | undefined>;
  getInsuranceLeadsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<InsuranceLead[]>;
  getAllInsuranceLeads(filters?: { employeeId?: string; fromDate?: string; toDate?: string }): Promise<InsuranceLead[]>;
  getInsuranceLeadsExpiringSoon(employeeIds: string[], withinDays: number): Promise<InsuranceLead[]>;
  updateInsuranceLead(id: string, data: Partial<InsertInsuranceLead>): Promise<InsuranceLead | undefined>;
  deleteInsuranceLead(id: string): Promise<void>;

  createLeaveRequest(data: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<LeaveRequest[]>;
  getLeaveRequestsForApproval(employeeIds: string[], filters?: { status?: string; fromDate?: string; toDate?: string }): Promise<LeaveRequest[]>;
  updateLeaveRequest(id: string, data: Partial<Pick<LeaveRequest, "status" | "approvedById" | "approvedAt" | "leaveType" | "startDate" | "endDate" | "reason">>): Promise<LeaveRequest | undefined>;

  getAdminExpenses(filters?: { month?: string; purpose?: string }): Promise<AdminExpense[]>;
  getAdminExpense(id: string): Promise<AdminExpense | undefined>;
  createAdminExpense(data: InsertAdminExpense): Promise<AdminExpense>;
  updateAdminExpense(id: string, data: Partial<InsertAdminExpense>): Promise<AdminExpense | undefined>;
  deleteAdminExpense(id: string): Promise<void>;

  getLeaderExpenseRequests(filters?: { month?: string; status?: string; requestedBy?: string }): Promise<LeaderExpenseRequest[]>;
  getLeaderExpenseRequest(id: string): Promise<LeaderExpenseRequest | undefined>;
  createLeaderExpenseRequest(data: InsertLeaderExpenseRequest): Promise<LeaderExpenseRequest>;
  updateLeaderExpenseRequest(id: string, data: Partial<InsertLeaderExpenseRequest>): Promise<LeaderExpenseRequest | undefined>;
  deleteLeaderExpenseRequest(id: string): Promise<void>;

  getSalaryStructure(employeeId: string): Promise<SalaryStructure | undefined>;
  upsertSalaryStructure(data: InsertSalaryStructure): Promise<SalaryStructure>;
  getPayrollEntry(employeeId: string, period: string): Promise<PayrollEntry | undefined>;
  getPayrollEntriesByPeriod(period: string): Promise<PayrollEntry[]>;
  upsertPayrollEntry(data: InsertPayrollEntry): Promise<PayrollEntry>;
  getPayslip(employeeId: string, period: string): Promise<Payslip | undefined>;
  getPayslipById(id: string): Promise<Payslip | undefined>;
  getPayslipsByEmployee(employeeId: string): Promise<Payslip[]>;
  getPayslipsByPeriod(period: string): Promise<Payslip[]>;
  upsertPayslip(data: InsertPayslip): Promise<Payslip>;

  /** Joint visits count for team lead in date range (for conveyance). Returns 0 until joint visits are logged in CRM. */
  getJointVisitsCount(teamLeadId: string, fromDate: string, toDate: string): Promise<number>;

  getCompanyMonthlyTarget(month: number, year: number): Promise<CompanyMonthlyTarget | undefined>;
  upsertCompanyMonthlyTarget(data: { month: number; year: number; totalBudget: string | number; totalLeads: number; isLocked?: number; createdBy?: string | null }): Promise<CompanyMonthlyTarget>;
  getMonthlyTarget(userId: string, month: number, year: number): Promise<MonthlyTarget | undefined>;
  getMonthlyTargetsByMonth(month: number, year: number): Promise<MonthlyTarget[]>;
  upsertMonthlyTarget(data: { userId: string; month: number; year: number; assignedBudget: string | number; assignedLeads: number; isLocked?: number; createdBy?: string | null }): Promise<MonthlyTarget>;
  setMonthlyTargetsLocked(month: number, year: number, isLocked: boolean, changedBy: string): Promise<void>;
  getAchievedBudgetAndLeads(userId: string, month: number, year: number): Promise<{ achievedBudget: number; achievedLeads: number }>;
  insertTargetAuditLog(entry: { monthlyTargetId?: string | null; userId?: string | null; month: number; year: number; action: string; changedBy?: string | null; oldValue?: string | null; newValue?: string | null }): Promise<TargetAuditLog>;
  upsertMonthlyPerformance(data: { userId: string; month: number; year: number; achievedBudget: number; achievedLeads: number; achievementPercentage: number }): Promise<MonthlyPerformance>;
  getMonthlyPerformance(userId: string, month: number, year: number): Promise<MonthlyPerformance | undefined>;
}

async function guardDb() {
  if (!hasDb || !db) throw new Error("Database not configured (DATABASE_URL required for staff portal).");
}

/** Parse amount from string (handles currency symbols, commas). Returns 0 if invalid. Do not strip decimal point. */
function parseLeadAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const s = String(value)
    .replace(/[\s₹Rs$]/gi, "")
    .replace(/,/g, "")
    .trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    await guardDb();
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return u;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await guardDb();
    const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return u;
  }

  async getNextEmployeeNumber(): Promise<string> {
    await guardDb();
    const staff = await db
      .select({ employeeNumber: users.employeeNumber })
      .from(users)
      .where(inArray(users.role, ["employee", "team_lead"]));
    let max = 1000;
    for (const row of staff) {
      const n = row.employeeNumber ? parseInt(String(row.employeeNumber), 10) : NaN;
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return String(max + 1);
  }

  async backfillEmployeeNumbers(): Promise<void> {
    await guardDb();
    const staff = await db
      .select()
      .from(users)
      .where(inArray(users.role, ["employee", "team_lead"]))
      .orderBy(users.createdAt);
    let next = 1001;
    for (const u of staff) {
      if (!(u as any).employeeNumber) {
        await db.update(users).set({ employeeNumber: String(next) }).where(eq(users.id, u.id));
        next += 1;
      }
    }
  }

  async createUser(data: InsertUser & { password: string }): Promise<User> {
    await guardDb();
    const hashed = hashPassword(data.password);
    const role = (data as any).role ?? "employee";
    const values: Record<string, unknown> = {
      username: data.username,
      password: hashed,
      role,
      fullName: (data as any).fullName ?? null,
      email: (data as any).email ?? null,
      phone: (data as any).phone ?? null,
    };
    if (role === "employee" || role === "team_lead") {
      values.employeeNumber = await this.getNextEmployeeNumber();
    }
    if (role === "employee") {
      const target = (data as any).monthlyLeadTarget;
      if (target !== undefined && target !== null) values.monthlyLeadTarget = Number(target);
      const tlId = (data as any).teamLeadId;
      if (tlId !== undefined && tlId !== null) values.teamLeadId = tlId;
    }
    await db.insert(users).values(values as any);
    const [u] = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
    if (!u) throw new Error("Failed to create user");
    return u;
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, "fullName" | "email" | "phone" | "password" | "avatarUrl" | "monthlyLeadTarget" | "teamLeadId" | "designation" | "bankAccountNumber" | "bankIfsc" | "pan" | "uan" | "dateOfJoining" | "department" | "location" | "dateOfBirth" | "gender">>
  ): Promise<User | undefined> {
    await guardDb();
    const payload: Record<string, unknown> = { ...data };
    if (payload.password) {
      payload.password = hashPassword(payload.password as string);
    }
    await db.update(users).set(payload).where(eq(users.id, id));
    return this.getUser(id);
  }

  async getAttendanceLog(employeeId: string, dateStr: string): Promise<AttendanceLog | undefined> {
    await guardDb();
    const [a] = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, dateStr)))
      .limit(1);
    return a;
  }

  async getAttendanceLogsByEmployee(
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AttendanceLog[]> {
    await guardDb();
    const conditions = [eq(attendanceLogs.employeeId, employeeId)];
    if (fromDate) conditions.push(gte(attendanceLogs.date, fromDate));
    if (toDate) conditions.push(lte(attendanceLogs.date, toDate));
    const rows = await db
      .select()
      .from(attendanceLogs)
      .where(and(...conditions))
      .orderBy(desc(attendanceLogs.date));
    return rows;
  }

  async getAllAttendanceLogs(fromDate?: string, toDate?: string): Promise<AttendanceLog[]> {
    await guardDb();
    const conditions = [];
    if (fromDate) conditions.push(gte(attendanceLogs.date, fromDate));
    if (toDate) conditions.push(lte(attendanceLogs.date, toDate));
    const rows = await db
      .select()
      .from(attendanceLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(attendanceLogs.date), desc(attendanceLogs.employeeId));
    return rows;
  }

  async upsertAttendanceLog(data: InsertAttendanceLog): Promise<AttendanceLog> {
    await guardDb();
    const existing = await this.getAttendanceLog(data.employeeId, data.date as unknown as string);
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({
          loginAt: data.loginAt ?? existing.loginAt,
          logoutAt: data.logoutAt ?? existing.logoutAt,
          loginLocation: data.loginLocation ?? existing.loginLocation,
          loginIp: data.loginIp ?? existing.loginIp,
          loginLat: data.loginLat ?? existing.loginLat,
          loginLng: data.loginLng ?? existing.loginLng,
          logoutLocation: (data as any).logoutLocation ?? (existing as any).logoutLocation,
          logoutLat: (data as any).logoutLat ?? (existing as any).logoutLat,
          logoutLng: (data as any).logoutLng ?? (existing as any).logoutLng,
          leadsCount: data.leadsCount ?? existing.leadsCount,
          status: data.status ?? existing.status,
          updatedAt: new Date(),
        })
        .where(eq(attendanceLogs.id, existing.id));
      const [updated] = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, existing.id)).limit(1);
      if (!updated) throw new Error("Failed to update attendance");
      return updated;
    }
    await db.insert(attendanceLogs).values(data);
    const created = await this.getAttendanceLog(data.employeeId, data.date as string);
    if (!created) throw new Error("Failed to create attendance");
    return created;
  }

  async setAttendanceLogin(
    employeeId: string,
    dateStr: string,
    options?: { loginLocation?: string | null; loginIp?: string | null; loginLat?: string | null; loginLng?: string | null }
  ): Promise<AttendanceLog> {
    await guardDb();
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    const now = new Date();
    const locationFields = {
      loginLocation: options?.loginLocation !== undefined ? options.loginLocation : undefined,
      loginIp: options?.loginIp !== undefined ? options.loginIp : undefined,
      loginLat: options?.loginLat !== undefined ? options.loginLat : undefined,
      loginLng: options?.loginLng !== undefined ? options.loginLng : undefined,
    };
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({ loginAt: now, status: "present", updatedAt: now, ...locationFields })
        .where(eq(attendanceLogs.id, existing.id));
      const [updated] = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, existing.id)).limit(1);
      if (!updated) throw new Error("Failed to update login");
      return updated;
    }
    return this.upsertAttendanceLog({
      employeeId,
      date: dateStr as any,
      loginAt: now,
      leadsCount: 0,
      status: "present",
      ...locationFields,
    });
  }

  async setAttendanceLogout(
    employeeId: string,
    dateStr: string,
    options?: { logoutLocation?: string | null; logoutLat?: string | null; logoutLng?: string | null }
  ): Promise<AttendanceLog> {
    await guardDb();
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    const now = new Date();
    const logoutFields = {
      logoutLocation: options?.logoutLocation !== undefined ? options.logoutLocation : undefined,
      logoutLat: options?.logoutLat !== undefined ? options.logoutLat : undefined,
      logoutLng: options?.logoutLng !== undefined ? options.logoutLng : undefined,
    };
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({ logoutAt: now, status: "present", updatedAt: now, ...logoutFields })
        .where(eq(attendanceLogs.id, existing.id));
      const [updated] = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, existing.id)).limit(1);
      if (!updated) throw new Error("Failed to update logout");
      return updated;
    }
    return this.upsertAttendanceLog({
      employeeId,
      date: dateStr as any,
      logoutAt: now,
      leadsCount: 0,
      status: "present",
      ...logoutFields,
    });
  }

  async updateAttendanceFromLeadsCount(employeeId: string, dateStr: string, count: number): Promise<void> {
    await guardDb();
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({ leadsCount: count, updatedAt: new Date() })
        .where(eq(attendanceLogs.id, existing.id));
    } else {
      await db.insert(attendanceLogs).values({
        employeeId,
        date: dateStr as any,
        leadsCount: count,
        status: "present",
      });
    }
  }

  async createLead(data: InsertLead): Promise<Lead> {
    await guardDb();
    const id = crypto.randomUUID();
    await db.insert(leads).values({ ...data, id } as any);
    const lead = await this.getLead(id);
    if (!lead) throw new Error("Failed to create lead");
    return lead;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    await guardDb();
    const [l] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return l;
  }

  async getLeadsByEmployee(
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Lead[]> {
    await guardDb();
    const conditions = [eq(leads.employeeId, employeeId)];
    if (fromDate) conditions.push(gte(leads.date, fromDate));
    if (toDate) conditions.push(lte(leads.date, toDate));
    return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.date), desc(leads.createdAt));
  }

  async getAllLeads(filters?: {
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
  }): Promise<Lead[]> {
    await guardDb();
    const conditions = [];
    if (filters?.employeeId) conditions.push(eq(leads.employeeId, filters.employeeId));
    if (filters?.fromDate) conditions.push(gte(leads.date, filters.fromDate));
    if (filters?.toDate) conditions.push(lte(leads.date, filters.toDate));
    if (filters?.status) conditions.push(eq(leads.status, filters.status as any));
    if (conditions.length === 0) {
      return db.select().from(leads).orderBy(desc(leads.date), desc(leads.createdAt));
    }
    return db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.date), desc(leads.createdAt));
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    await guardDb();
    await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id));
    return this.getLead(id);
  }

  async deleteLead(id: string): Promise<void> {
    await guardDb();
    const lead = await this.getLead(id);
    if (lead) {
      await db.delete(leads).where(eq(leads.id, id));
      const dateStr = (lead.date as unknown as string).slice?.(0, 10) ?? String(lead.date);
      const count = await this.getLeadsCountForEmployeeOnDate(lead.employeeId, dateStr);
      await this.updateAttendanceFromLeadsCount(lead.employeeId, dateStr, count);
    }
  }

  async deleteUser(id: string): Promise<void> {
    await guardDb();
    await db.delete(leaveRequests).where(eq(leaveRequests.employeeId, id));
    await db.delete(leads).where(eq(leads.employeeId, id));
    await db.delete(insuranceLeads).where(eq(insuranceLeads.employeeId, id));
    await db.delete(attendanceLogs).where(eq(attendanceLogs.employeeId, id));
    await db.delete(monthlyTargets).where(eq(monthlyTargets.userId, id));
    await db.delete(monthlyPerformance).where(eq(monthlyPerformance.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async listEmployees(filters?: { teamLeadId?: string; unassignedOnly?: boolean }): Promise<User[]> {
    await guardDb();
    // With filters: only direct-report employees (for team lead's team or unassigned list)
    const employeeOnly = eq(users.role, "employee");
    if (filters?.unassignedOnly) {
      return db.select().from(users).where(and(employeeOnly, isNull(users.teamLeadId))).orderBy(users.fullName, users.username);
    }
    if (filters?.teamLeadId) {
      return db.select().from(users).where(and(employeeOnly, eq(users.teamLeadId, filters.teamLeadId))).orderBy(users.fullName, users.username);
    }
    // No filters (admin "all employees"): include both employees and team leaders (leaders are staff too)
    const staffRoles = inArray(users.role, ["employee", "team_lead"]);
    return db.select().from(users).where(staffRoles).orderBy(users.fullName, users.username);
  }

  async listTeamLeads(): Promise<User[]> {
    await guardDb();
    return db.select().from(users).where(eq(users.role, "team_lead")).orderBy(users.fullName, users.username);
  }

  async getLeadsCountForEmployeeOnDate(employeeId: string, dateStr: string): Promise<number> {
    await guardDb();
    const rows = await db
      .select()
      .from(leads)
      .where(and(eq(leads.employeeId, employeeId), eq(leads.date, dateStr)));
    return rows.length;
  }

  async createInsuranceLead(data: InsertInsuranceLead): Promise<InsuranceLead> {
    await guardDb();
    const id = crypto.randomUUID();
    await db.insert(insuranceLeads).values({ ...data, id } as any);
    const row = await this.getInsuranceLead(id);
    if (!row) throw new Error("Failed to create insurance lead");
    return row;
  }

  async getInsuranceLead(id: string): Promise<InsuranceLead | undefined> {
    await guardDb();
    const [row] = await db.select().from(insuranceLeads).where(eq(insuranceLeads.id, id)).limit(1);
    return row;
  }

  async getInsuranceLeadsByEmployee(
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<InsuranceLead[]> {
    await guardDb();
    const conditions = [eq(insuranceLeads.employeeId, employeeId)];
    if (fromDate) conditions.push(gte(insuranceLeads.date, fromDate));
    if (toDate) conditions.push(lte(insuranceLeads.date, toDate));
    return db
      .select()
      .from(insuranceLeads)
      .where(and(...conditions))
      .orderBy(desc(insuranceLeads.date), desc(insuranceLeads.createdAt));
  }

  async getAllInsuranceLeads(filters?: {
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<InsuranceLead[]> {
    await guardDb();
    const conditions = [];
    if (filters?.employeeId) conditions.push(eq(insuranceLeads.employeeId, filters.employeeId));
    if (filters?.fromDate) conditions.push(gte(insuranceLeads.date, filters.fromDate));
    if (filters?.toDate) conditions.push(lte(insuranceLeads.date, filters.toDate));
    if (conditions.length === 0) {
      return db
        .select()
        .from(insuranceLeads)
        .orderBy(desc(insuranceLeads.date), desc(insuranceLeads.createdAt));
    }
    return db
      .select()
      .from(insuranceLeads)
      .where(and(...conditions))
      .orderBy(desc(insuranceLeads.date), desc(insuranceLeads.createdAt));
  }

  async getInsuranceLeadsExpiringSoon(employeeIds: string[], withinDays: number): Promise<InsuranceLead[]> {
    await guardDb();
    if (employeeIds.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startStr = today.toISOString().slice(0, 10);
    const end = new Date(today);
    end.setDate(end.getDate() + withinDays);
    const endStr = end.toISOString().slice(0, 10);
    return db
      .select()
      .from(insuranceLeads)
      .where(
        and(
          inArray(insuranceLeads.employeeId, employeeIds),
          isNotNull(insuranceLeads.policyEndDate),
          gte(insuranceLeads.policyEndDate, startStr),
          lte(insuranceLeads.policyEndDate, endStr),
          isNull(insuranceLeads.renewedAt)
        )
      )
      .orderBy(insuranceLeads.policyEndDate, desc(insuranceLeads.createdAt));
  }

  async updateInsuranceLead(id: string, data: Partial<InsertInsuranceLead>): Promise<InsuranceLead | undefined> {
    await guardDb();
    await db.update(insuranceLeads).set({ ...data, updatedAt: new Date() }).where(eq(insuranceLeads.id, id));
    return this.getInsuranceLead(id);
  }

  async deleteInsuranceLead(id: string): Promise<void> {
    await guardDb();
    await db.delete(insuranceLeads).where(eq(insuranceLeads.id, id));
  }

  async getAdminExpenses(filters?: { month?: string; purpose?: string }): Promise<AdminExpense[]> {
    await guardDb();
    const conditions = [];
    if (filters?.month) conditions.push(eq(adminExpenses.month, filters.month));
    if (filters?.purpose) conditions.push(eq(adminExpenses.purpose, filters.purpose));
    const query = conditions.length
      ? db.select().from(adminExpenses).where(and(...conditions)).orderBy(desc(adminExpenses.month), desc(adminExpenses.createdAt))
      : db.select().from(adminExpenses).orderBy(desc(adminExpenses.month), desc(adminExpenses.createdAt));
    return query;
  }

  async getAdminExpense(id: string): Promise<AdminExpense | undefined> {
    await guardDb();
    const [r] = await db.select().from(adminExpenses).where(eq(adminExpenses.id, id)).limit(1);
    return r;
  }

  async createAdminExpense(data: InsertAdminExpense): Promise<AdminExpense> {
    await guardDb();
    const id = crypto.randomUUID();
    await db.insert(adminExpenses).values({ ...data, id } as any);
    const row = await this.getAdminExpense(id);
    if (!row) throw new Error("Failed to create admin expense");
    return row;
  }

  async updateAdminExpense(id: string, data: Partial<InsertAdminExpense>): Promise<AdminExpense | undefined> {
    await guardDb();
    await db.update(adminExpenses).set({ ...data, updatedAt: new Date() }).where(eq(adminExpenses.id, id));
    return this.getAdminExpense(id);
  }

  async deleteAdminExpense(id: string): Promise<void> {
    await guardDb();
    await db.delete(adminExpenses).where(eq(adminExpenses.id, id));
  }

  async getLeaderExpenseRequests(filters?: { month?: string; status?: string; requestedBy?: string }): Promise<LeaderExpenseRequest[]> {
    await guardDb();
    const conditions = [];
    if (filters?.month) conditions.push(eq(leaderExpenseRequests.month, filters.month));
    if (filters?.status) conditions.push(eq(leaderExpenseRequests.status, filters.status));
    if (filters?.requestedBy) conditions.push(eq(leaderExpenseRequests.requestedBy, filters.requestedBy));
    const query = conditions.length
      ? db.select().from(leaderExpenseRequests).where(and(...conditions)).orderBy(desc(leaderExpenseRequests.month), desc(leaderExpenseRequests.createdAt))
      : db.select().from(leaderExpenseRequests).orderBy(desc(leaderExpenseRequests.month), desc(leaderExpenseRequests.createdAt));
    return query;
  }

  async getLeaderExpenseRequest(id: string): Promise<LeaderExpenseRequest | undefined> {
    await guardDb();
    const [r] = await db.select().from(leaderExpenseRequests).where(eq(leaderExpenseRequests.id, id)).limit(1);
    return r;
  }

  async createLeaderExpenseRequest(data: InsertLeaderExpenseRequest): Promise<LeaderExpenseRequest> {
    await guardDb();
    const id = crypto.randomUUID();
    await db.insert(leaderExpenseRequests).values({ ...data, id } as any);
    const row = await this.getLeaderExpenseRequest(id);
    if (!row) throw new Error("Failed to create leader expense request");
    return row;
  }

  async updateLeaderExpenseRequest(id: string, data: Partial<InsertLeaderExpenseRequest>): Promise<LeaderExpenseRequest | undefined> {
    await guardDb();
    await db.update(leaderExpenseRequests).set({ ...data, updatedAt: new Date() }).where(eq(leaderExpenseRequests.id, id));
    return this.getLeaderExpenseRequest(id);
  }

  async deleteLeaderExpenseRequest(id: string): Promise<void> {
    await guardDb();
    await db.delete(leaderExpenseRequests).where(eq(leaderExpenseRequests.id, id));
  }

  async getSalaryStructure(employeeId: string): Promise<SalaryStructure | undefined> {
    await guardDb();
    const [r] = await db.select().from(salaryStructures).where(eq(salaryStructures.employeeId, employeeId)).limit(1);
    return r;
  }

  async upsertSalaryStructure(data: InsertSalaryStructure): Promise<SalaryStructure> {
    await guardDb();
    const existing = await this.getSalaryStructure(data.employeeId);
    const payload = { ...data, updatedAt: new Date() } as any;
    if (existing) {
      await db.update(salaryStructures).set(payload).where(eq(salaryStructures.id, existing.id));
      const out = await this.getSalaryStructure(data.employeeId);
      if (!out) throw new Error("Failed to update salary structure");
      return out;
    }
    const id = crypto.randomUUID();
    await db.insert(salaryStructures).values({ ...data, id } as any);
    const row = await this.getSalaryStructure(data.employeeId);
    if (!row) throw new Error("Failed to create salary structure");
    return row;
  }

  async getPayrollEntry(employeeId: string, period: string): Promise<PayrollEntry | undefined> {
    await guardDb();
    const [r] = await db
      .select()
      .from(payrollEntries)
      .where(and(eq(payrollEntries.employeeId, employeeId), eq(payrollEntries.period, period)))
      .limit(1);
    return r;
  }

  async getPayrollEntriesByPeriod(period: string): Promise<PayrollEntry[]> {
    await guardDb();
    return db.select().from(payrollEntries).where(eq(payrollEntries.period, period)).orderBy(payrollEntries.employeeId);
  }

  async upsertPayrollEntry(data: InsertPayrollEntry): Promise<PayrollEntry> {
    await guardDb();
    const existing = await this.getPayrollEntry(data.employeeId, data.period);
    const payload = { ...data, updatedAt: new Date() } as any;
    if (existing) {
      await db.update(payrollEntries).set(payload).where(eq(payrollEntries.id, existing.id));
      const out = await this.getPayrollEntry(data.employeeId, data.period);
      if (!out) throw new Error("Failed to update payroll entry");
      return out;
    }
    const id = crypto.randomUUID();
    await db.insert(payrollEntries).values({ ...data, id } as any);
    const row = await this.getPayrollEntry(data.employeeId, data.period);
    if (!row) throw new Error("Failed to create payroll entry");
    return row;
  }

  async getPayslip(employeeId: string, period: string): Promise<Payslip | undefined> {
    await guardDb();
    const [r] = await db
      .select()
      .from(payslips)
      .where(and(eq(payslips.employeeId, employeeId), eq(payslips.period, period)))
      .limit(1);
    return r;
  }

  async getPayslipById(id: string): Promise<Payslip | undefined> {
    await guardDb();
    const [r] = await db.select().from(payslips).where(eq(payslips.id, id)).limit(1);
    return r;
  }

  async getPayslipsByEmployee(employeeId: string): Promise<Payslip[]> {
    await guardDb();
    return db.select().from(payslips).where(eq(payslips.employeeId, employeeId)).orderBy(desc(payslips.period));
  }

  async getPayslipsByPeriod(period: string): Promise<Payslip[]> {
    await guardDb();
    return db.select().from(payslips).where(eq(payslips.period, period)).orderBy(payslips.employeeId);
  }

  async upsertPayslip(data: InsertPayslip): Promise<Payslip> {
    await guardDb();
    const existing = await this.getPayslip(data.employeeId, data.period);
    const payload = { ...data } as any;
    if (existing) {
      await db.update(payslips).set(payload).where(eq(payslips.id, existing.id));
      const out = await this.getPayslip(data.employeeId, data.period);
      if (!out) throw new Error("Failed to update payslip");
      return out;
    }
    const id = crypto.randomUUID();
    await db.insert(payslips).values({ ...data, id } as any);
    const row = await this.getPayslip(data.employeeId, data.period);
    if (!row) throw new Error("Failed to create payslip");
    return row;
  }

  async createLeaveRequest(data: InsertLeaveRequest): Promise<LeaveRequest> {
    await guardDb();
    const id = crypto.randomUUID();
    await db.insert(leaveRequests).values({ ...data, id } as any);
    const row = await this.getLeaveRequest(id);
    if (!row) throw new Error("Failed to create leave request");
    return row;
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    await guardDb();
    const [r] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
    return r;
  }

  async getLeaveRequestsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<LeaveRequest[]> {
    await guardDb();
    const conditions = [eq(leaveRequests.employeeId, employeeId)];
    if (fromDate && toDate) {
      conditions.push(lte(leaveRequests.startDate, toDate));
      conditions.push(gte(leaveRequests.endDate, fromDate));
    } else {
      if (fromDate) conditions.push(gte(leaveRequests.startDate, fromDate));
      if (toDate) conditions.push(lte(leaveRequests.endDate, toDate));
    }
    return db
      .select()
      .from(leaveRequests)
      .where(and(...conditions))
      .orderBy(desc(leaveRequests.startDate), desc(leaveRequests.createdAt));
  }

  async getLeaveRequestsForApproval(
    employeeIds: string[],
    filters?: { status?: string; fromDate?: string; toDate?: string }
  ): Promise<LeaveRequest[]> {
    await guardDb();
    if (employeeIds.length === 0) return [];
    const conditions = [inArray(leaveRequests.employeeId, employeeIds)];
    if (filters?.status) conditions.push(eq(leaveRequests.status, filters.status as any));
    if (filters?.fromDate) conditions.push(gte(leaveRequests.endDate, filters.fromDate));
    if (filters?.toDate) conditions.push(lte(leaveRequests.startDate, filters.toDate));
    return db
      .select()
      .from(leaveRequests)
      .where(and(...conditions))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async updateLeaveRequest(
    id: string,
    data: Partial<Pick<LeaveRequest, "status" | "approvedById" | "approvedAt" | "leaveType" | "startDate" | "endDate" | "reason">>
  ): Promise<LeaveRequest | undefined> {
    await guardDb();
    await db.update(leaveRequests).set({ ...data, updatedAt: new Date() }).where(eq(leaveRequests.id, id));
    return this.getLeaveRequest(id);
  }

  async getJointVisitsCount(_teamLeadId: string, _fromDate: string, _toDate: string): Promise<number> {
    await guardDb();
    // Placeholder: joint visits not yet logged in CRM. When implemented, query joint_visits (or equivalent) table.
    return 0;
  }

  async getCompanyMonthlyTarget(month: number, year: number): Promise<CompanyMonthlyTarget | undefined> {
    await guardDb();
    const [row] = await db
      .select()
      .from(companyMonthlyTarget)
      .where(and(eq(companyMonthlyTarget.month, month), eq(companyMonthlyTarget.year, year)))
      .limit(1);
    return row;
  }

  async upsertCompanyMonthlyTarget(data: {
    month: number;
    year: number;
    totalBudget: string | number;
    totalLeads: number;
    isLocked?: number;
    createdBy?: string | null;
  }): Promise<CompanyMonthlyTarget> {
    await guardDb();
    const budget = typeof data.totalBudget === "number" ? String(data.totalBudget) : data.totalBudget;
    const existing = await this.getCompanyMonthlyTarget(data.month, data.year);
    if (existing) {
      await db
        .update(companyMonthlyTarget)
        .set({
          totalBudget: budget,
          totalLeads: data.totalLeads,
          isLocked: data.isLocked ?? existing.isLocked,
          updatedAt: new Date(),
        })
        .where(eq(companyMonthlyTarget.id, existing.id));
      const [updated] = await db.select().from(companyMonthlyTarget).where(eq(companyMonthlyTarget.id, existing.id)).limit(1);
      return updated!;
    }
    await db.insert(companyMonthlyTarget).values({
      month: data.month,
      year: data.year,
      totalBudget: budget,
      totalLeads: data.totalLeads,
      isLocked: data.isLocked ?? 0,
      createdBy: data.createdBy ?? null,
    });
    const row = await this.getCompanyMonthlyTarget(data.month, data.year);
    return row!;
  }

  async getMonthlyTarget(userId: string, month: number, year: number): Promise<MonthlyTarget | undefined> {
    await guardDb();
    const [row] = await db
      .select()
      .from(monthlyTargets)
      .where(and(eq(monthlyTargets.userId, userId), eq(monthlyTargets.month, month), eq(monthlyTargets.year, year)))
      .limit(1);
    return row;
  }

  async getMonthlyTargetsByMonth(month: number, year: number): Promise<MonthlyTarget[]> {
    await guardDb();
    return db
      .select()
      .from(monthlyTargets)
      .where(and(eq(monthlyTargets.month, month), eq(monthlyTargets.year, year)));
  }

  async upsertMonthlyTarget(data: {
    userId: string;
    month: number;
    year: number;
    assignedBudget: string | number;
    assignedLeads: number;
    isLocked?: number;
    createdBy?: string | null;
  }): Promise<MonthlyTarget> {
    await guardDb();
    const budget = typeof data.assignedBudget === "number" ? String(data.assignedBudget) : data.assignedBudget;
    const existing = await this.getMonthlyTarget(data.userId, data.month, data.year);
    if (existing) {
      await db
        .update(monthlyTargets)
        .set({
          assignedBudget: budget,
          assignedLeads: data.assignedLeads,
          isLocked: data.isLocked ?? existing.isLocked,
          updatedAt: new Date(),
        })
        .where(eq(monthlyTargets.id, existing.id));
      const [updated] = await db.select().from(monthlyTargets).where(eq(monthlyTargets.id, existing.id)).limit(1);
      return updated!;
    }
    await db.insert(monthlyTargets).values({
      userId: data.userId,
      month: data.month,
      year: data.year,
      assignedBudget: budget,
      assignedLeads: data.assignedLeads,
      isLocked: data.isLocked ?? 0,
      createdBy: data.createdBy ?? null,
    });
    const [row] = await db
      .select()
      .from(monthlyTargets)
      .where(and(eq(monthlyTargets.userId, data.userId), eq(monthlyTargets.month, data.month), eq(monthlyTargets.year, data.year)))
      .limit(1);
    return row!;
  }

  async setMonthlyTargetsLocked(month: number, year: number, isLocked: boolean, _changedBy: string): Promise<void> {
    await guardDb();
    const val = isLocked ? 1 : 0;
    await db.update(companyMonthlyTarget).set({ isLocked: val, updatedAt: new Date() }).where(and(eq(companyMonthlyTarget.month, month), eq(companyMonthlyTarget.year, year)));
    await db.update(monthlyTargets).set({ isLocked: val, updatedAt: new Date() }).where(and(eq(monthlyTargets.month, month), eq(monthlyTargets.year, year)));
  }

  async getAchievedBudgetAndLeads(userId: string, month: number, year: number): Promise<{ achievedBudget: number; achievedLeads: number }> {
    await guardDb();
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const list = await this.getLeadsByEmployee(userId, monthStart, monthEnd);
    let achievedBudget = 0;
    const disbursedOrSanctioned = list.filter(
      (l) => (l.status || "").toLowerCase() === "disbursed" || (l.status || "").toLowerCase() === "sanctioned"
    );
    for (const l of disbursedOrSanctioned) {
      const amt =
        (l as { loanDisbursed?: string | null }).loanDisbursed ??
        (l as { loan_disbursed?: string | null }).loan_disbursed ??
        (l as Lead).amount;
      achievedBudget += parseLeadAmount(amt);
    }
    return { achievedBudget, achievedLeads: list.length };
  }

  async insertTargetAuditLog(entry: {
    monthlyTargetId?: string | null;
    userId?: string | null;
    month: number;
    year: number;
    action: string;
    changedBy?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
  }): Promise<TargetAuditLog> {
    await guardDb();
    const id = crypto.randomUUID();
    await db.insert(targetAuditLog).values({
      id,
      monthlyTargetId: entry.monthlyTargetId ?? null,
      userId: entry.userId ?? null,
      month: entry.month,
      year: entry.year,
      action: entry.action,
      changedBy: entry.changedBy ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
    });
    const [log] = await db.select().from(targetAuditLog).where(eq(targetAuditLog.id, id)).limit(1);
    return log!;
  }

  async upsertMonthlyPerformance(data: {
    userId: string;
    month: number;
    year: number;
    achievedBudget: number;
    achievedLeads: number;
    achievementPercentage: number;
  }): Promise<MonthlyPerformance> {
    await guardDb();
    const existing = await db
      .select()
      .from(monthlyPerformance)
      .where(and(eq(monthlyPerformance.userId, data.userId), eq(monthlyPerformance.month, data.month), eq(monthlyPerformance.year, data.year)))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(monthlyPerformance)
        .set({
          achievedBudget: String(data.achievedBudget),
          achievedLeads: data.achievedLeads,
          achievementPercentage: String(data.achievementPercentage),
          calculatedAt: new Date(),
        })
        .where(eq(monthlyPerformance.id, existing[0].id));
      const [row] = await db.select().from(monthlyPerformance).where(eq(monthlyPerformance.id, existing[0].id)).limit(1);
      return row!;
    }
    await db.insert(monthlyPerformance).values({
      userId: data.userId,
      month: data.month,
      year: data.year,
      achievedBudget: String(data.achievedBudget),
      achievedLeads: data.achievedLeads,
      achievementPercentage: String(data.achievementPercentage),
    });
    const row = await this.getMonthlyPerformance(data.userId, data.month, data.year);
    return row!;
  }

  async getMonthlyPerformance(userId: string, month: number, year: number): Promise<MonthlyPerformance | undefined> {
    await guardDb();
    const [row] = await db
      .select()
      .from(monthlyPerformance)
      .where(and(eq(monthlyPerformance.userId, userId), eq(monthlyPerformance.month, month), eq(monthlyPerformance.year, year)))
      .limit(1);
    return row;
  }
}

// When DB is not configured, use a no-op storage that throws on staff-specific methods
class NoDbStorage implements IStorage {
  private guard() {
    if (!hasDb) throw new Error("DATABASE_URL is required for staff portal.");
  }
  async getUser(id: string) {
    this.guard();
    return undefined;
  }
  async getUserByUsername(username: string) {
    this.guard();
    return undefined;
  }
  async createUser() {
    this.guard();
    throw new Error("Not implemented");
  }
  async updateUser() {
    this.guard();
    return undefined;
  }
  async deleteUser() {
    this.guard();
  }
  async getNextEmployeeNumber() {
    this.guard();
    return "1001";
  }
  async backfillEmployeeNumbers() {
    this.guard();
  }
  async getAttendanceLog() {
    this.guard();
    return undefined;
  }
  async getAttendanceLogsByEmployee() {
    this.guard();
    return [];
  }
  async getAllAttendanceLogs() {
    this.guard();
    return [];
  }
  async upsertAttendanceLog() {
    this.guard();
    throw new Error("Not implemented");
  }
  async setAttendanceLogin() {
    this.guard();
    throw new Error("Not implemented");
  }
  async setAttendanceLogout() {
    this.guard();
    throw new Error("Not implemented");
  }
  async updateAttendanceFromLeadsCount() {
    this.guard();
  }
  async createLead() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getLead() {
    this.guard();
    return undefined;
  }
  async getLeadsByEmployee() {
    this.guard();
    return [];
  }
  async getAllLeads() {
    this.guard();
    return [];
  }
  async updateLead() {
    this.guard();
    return undefined;
  }
  async deleteLead() {
    this.guard();
  }
  async listEmployees() {
    this.guard();
    return [];
  }
  async listTeamLeads() {
    this.guard();
    return [];
  }
  async createLeaveRequest() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getLeaveRequest() {
    this.guard();
    return undefined;
  }
  async getLeaveRequestsByEmployee() {
    this.guard();
    return [];
  }
  async getLeaveRequestsForApproval() {
    this.guard();
    return [];
  }
  async updateLeaveRequest() {
    this.guard();
    return undefined;
  }
  async getLeadsCountForEmployeeOnDate() {
    this.guard();
    return 0;
  }
  async createInsuranceLead() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getInsuranceLead() {
    this.guard();
    return undefined;
  }
  async getInsuranceLeadsByEmployee() {
    this.guard();
    return [];
  }
  async getAllInsuranceLeads() {
    this.guard();
    return [];
  }
  async getInsuranceLeadsExpiringSoon() {
    this.guard();
    return [];
  }
  async updateInsuranceLead() {
    this.guard();
    return undefined;
  }
  async deleteInsuranceLead() {
    this.guard();
  }
  async getAdminExpenses() {
    this.guard();
    return [];
  }
  async getAdminExpense() {
    this.guard();
    return undefined;
  }
  async createAdminExpense() {
    this.guard();
    throw new Error("Not implemented");
  }
  async updateAdminExpense() {
    this.guard();
    return undefined;
  }
  async deleteAdminExpense() {
    this.guard();
  }
  async getLeaderExpenseRequests() {
    this.guard();
    return [];
  }
  async getLeaderExpenseRequest() {
    this.guard();
    return undefined;
  }
  async createLeaderExpenseRequest() {
    this.guard();
    throw new Error("Not implemented");
  }
  async updateLeaderExpenseRequest() {
    this.guard();
    return undefined;
  }
  async deleteLeaderExpenseRequest() {
    this.guard();
  }
  async getSalaryStructure() {
    this.guard();
    return undefined;
  }
  async upsertSalaryStructure() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getPayrollEntry() {
    this.guard();
    return undefined;
  }
  async getPayrollEntriesByPeriod() {
    this.guard();
    return [];
  }
  async upsertPayrollEntry() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getPayslip() {
    this.guard();
    return undefined;
  }
  async getPayslipById() {
    this.guard();
    return undefined;
  }
  async getPayslipsByEmployee() {
    this.guard();
    return [];
  }
  async getPayslipsByPeriod() {
    this.guard();
    return [];
  }
  async upsertPayslip() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getJointVisitsCount() {
    this.guard();
    return 0;
  }
  async getCompanyMonthlyTarget() {
    this.guard();
    return undefined;
  }
  async upsertCompanyMonthlyTarget() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getMonthlyTarget() {
    this.guard();
    return undefined;
  }
  async getMonthlyTargetsByMonth() {
    this.guard();
    return [];
  }
  async upsertMonthlyTarget() {
    this.guard();
    throw new Error("Not implemented");
  }
  async setMonthlyTargetsLocked() {
    this.guard();
  }
  async getAchievedBudgetAndLeads() {
    this.guard();
    return { achievedBudget: 0, achievedLeads: 0 };
  }
  async insertTargetAuditLog() {
    this.guard();
    throw new Error("Not implemented");
  }
  async upsertMonthlyPerformance() {
    this.guard();
    throw new Error("Not implemented");
  }
  async getMonthlyPerformance() {
    this.guard();
    return undefined;
  }
}

export const storage: IStorage = hasDb ? new DrizzleStorage() : new NoDbStorage();
