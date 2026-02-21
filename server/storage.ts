import {
  type User,
  type InsertUser,
  type AttendanceLog,
  type InsertAttendanceLog,
  type Lead,
  type InsertLead,
  users,
  attendanceLogs,
  leads,
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db, hasDb } from "./db";
import { hashPassword } from "./lib/password";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, "fullName" | "email" | "phone" | "password">>): Promise<User | undefined>;

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
  listEmployees(): Promise<User[]>;
  getLeadsCountForEmployeeOnDate(employeeId: string, dateStr: string): Promise<number>;
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

  async createUser(data: InsertUser & { password: string }): Promise<User> {
    await guardDb();
    const hashed = hashPassword(data.password);
    const [u] = await db
      .insert(users)
      .values({
        username: data.username,
        password: hashed,
        role: (data as any).role ?? "employee",
        fullName: (data as any).fullName ?? null,
        email: (data as any).email ?? null,
        phone: (data as any).phone ?? null,
      })
      .returning();
    if (!u) throw new Error("Failed to create user");
    return u;
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, "fullName" | "email" | "phone" | "password">>
  ): Promise<User | undefined> {
    await guardDb();
    const payload: Record<string, unknown> = { ...data };
    if (payload.password) {
      payload.password = hashPassword(payload.password as string);
    }
    const [u] = await db.update(users).set(payload).where(eq(users.id, id)).returning();
    return u;
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
      const [updated] = await db
        .update(attendanceLogs)
        .set({
          loginAt: data.loginAt ?? existing.loginAt,
          logoutAt: data.logoutAt ?? existing.logoutAt,
          leadsCount: data.leadsCount ?? existing.leadsCount,
          status: data.status ?? existing.status,
          updatedAt: new Date(),
        })
        .where(eq(attendanceLogs.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update attendance");
      return updated;
    }
    const [created] = await db.insert(attendanceLogs).values(data).returning();
    if (!created) throw new Error("Failed to create attendance");
    return created;
  }

  async setAttendanceLogin(employeeId: string, dateStr: string): Promise<AttendanceLog> {
    await guardDb();
    const existing = await this.getAttendanceLog(employeeId, dateStr);
    const now = new Date();
    if (existing) {
      const [updated] = await db
        .update(attendanceLogs)
        .set({ loginAt: now, updatedAt: now })
        .where(eq(attendanceLogs.id, existing.id))
        .returning();
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
      const [updated] = await db
        .update(attendanceLogs)
        .set({ logoutAt: now, updatedAt: now })
        .where(eq(attendanceLogs.id, existing.id))
        .returning();
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
    const [lead] = await db.insert(leads).values(data).returning();
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
    const [updated] = await db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
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
  async listEmployees() {
    this.guard();
    return [];
  }
  async getLeadsCountForEmployeeOnDate() {
    this.guard();
    return 0;
  }
}

export const storage: IStorage = hasDb ? new DrizzleStorage() : new NoDbStorage();
