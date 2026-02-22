import {
  type User,
  type InsertUser,
  type AttendanceLog,
  type InsertAttendanceLog,
  type Lead,
  type InsertLead,
  type InsuranceLead,
  type InsertInsuranceLead,
  users,
  attendanceLogs,
  leads,
  insuranceLeads,
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db, hasDb } from "./db";
import { hashPassword } from "./lib/password";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, "fullName" | "email" | "phone" | "password" | "avatarUrl">>): Promise<User | undefined>;
  getNextEmployeeNumber(): Promise<string>;
  backfillEmployeeNumbers(): Promise<void>;

  getAttendanceLog(employeeId: string, date: string): Promise<AttendanceLog | undefined>;
  getAttendanceLogsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<AttendanceLog[]>;
  getAllAttendanceLogs(fromDate?: string, toDate?: string): Promise<AttendanceLog[]>;
  upsertAttendanceLog(data: InsertAttendanceLog): Promise<AttendanceLog>;
  setAttendanceLogin(employeeId: string, dateStr: string): Promise<AttendanceLog>;
  setAttendanceLogout(employeeId: string, dateStr: string): Promise<AttendanceLog>;
  updateAttendanceFromLeadsCount(employeeId: string, dateStr: string, count: number): Promise<void>;

  createLead(data: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<Lead[]>;
  getAllLeads(filters?: { employeeId?: string; fromDate?: string; toDate?: string; status?: string }): Promise<Lead[]>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;
  listEmployees(): Promise<User[]>;
  getLeadsCountForEmployeeOnDate(employeeId: string, dateStr: string): Promise<number>;

  createInsuranceLead(data: InsertInsuranceLead): Promise<InsuranceLead>;
  getInsuranceLead(id: string): Promise<InsuranceLead | undefined>;
  getInsuranceLeadsByEmployee(employeeId: string, fromDate?: string, toDate?: string): Promise<InsuranceLead[]>;
  getAllInsuranceLeads(filters?: { employeeId?: string; fromDate?: string; toDate?: string }): Promise<InsuranceLead[]>;
  updateInsuranceLead(id: string, data: Partial<InsertInsuranceLead>): Promise<InsuranceLead | undefined>;
  deleteInsuranceLead(id: string): Promise<void>;
}

async function guardDb() {
  if (!hasDb || !db) throw new Error("Database not configured (DATABASE_URL required for staff portal).");
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
    const employees = await db.select({ employeeNumber: users.employeeNumber }).from(users).where(eq(users.role, "employee"));
    let max = 1000;
    for (const row of employees) {
      const n = row.employeeNumber ? parseInt(String(row.employeeNumber), 10) : NaN;
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return String(max + 1);
  }

  async backfillEmployeeNumbers(): Promise<void> {
    await guardDb();
    const employees = await db.select().from(users).where(eq(users.role, "employee")).orderBy(users.createdAt);
    let next = 1001;
    for (const u of employees) {
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
    if (role === "employee") {
      values.employeeNumber = await this.getNextEmployeeNumber();
    }
    await db.insert(users).values(values as any);
    const [u] = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
    if (!u) throw new Error("Failed to create user");
    return u;
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, "fullName" | "email" | "phone" | "password" | "avatarUrl">>
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

  async setAttendanceLogin(employeeId: string, dateStr: string): Promise<AttendanceLog> {
    await guardDb();
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    const now = new Date();
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({ loginAt: now, updatedAt: now })
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
      status: "incomplete",
    });
  }

  async setAttendanceLogout(employeeId: string, dateStr: string): Promise<AttendanceLog> {
    await guardDb();
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    const now = new Date();
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({ logoutAt: now, updatedAt: now })
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
      status: "incomplete",
    });
  }

  async updateAttendanceFromLeadsCount(employeeId: string, dateStr: string, count: number): Promise<void> {
    await guardDb();
    const status = count >= 2 ? "present" : "incomplete";
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    if (existing) {
      await db
        .update(attendanceLogs)
        .set({ leadsCount: count, status, updatedAt: new Date() })
        .where(eq(attendanceLogs.id, existing.id));
    } else {
      await db.insert(attendanceLogs).values({
        employeeId,
        date: dateStr as any,
        leadsCount: count,
        status,
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

  async listEmployees(): Promise<User[]> {
    await guardDb();
    return db.select().from(users).where(eq(users.role, "employee")).orderBy(users.fullName, users.username);
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

  async updateInsuranceLead(id: string, data: Partial<InsertInsuranceLead>): Promise<InsuranceLead | undefined> {
    await guardDb();
    await db.update(insuranceLeads).set({ ...data, updatedAt: new Date() }).where(eq(insuranceLeads.id, id));
    return this.getInsuranceLead(id);
  }

  async deleteInsuranceLead(id: string): Promise<void> {
    await guardDb();
    await db.delete(insuranceLeads).where(eq(insuranceLeads.id, id));
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
  async updateInsuranceLead() {
    this.guard();
    return undefined;
  }
  async deleteInsuranceLead() {
    this.guard();
  }
}

export const storage: IStorage = hasDb ? new DrizzleStorage() : new NoDbStorage();
