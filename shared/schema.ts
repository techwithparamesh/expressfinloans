import {
  date,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const USER_ROLES = ["admin", "employee"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("employee"),
  fullName: varchar("full_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  fullName: true,
  email: true,
  phone: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const attendanceLogs = mysqlTable("attendance_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  loginAt: timestamp("login_at"),
  logoutAt: timestamp("logout_at"),
  leadsCount: int("leads_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("incomplete"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertAttendanceLogSchema = createInsertSchema(attendanceLogs).pick({
  employeeId: true,
  date: true,
  loginAt: true,
  logoutAt: true,
  leadsCount: true,
  status: true,
});

export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;

export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  location: varchar("location", { length: 255 }),
  loanType: varchar("loan_type", { length: 100 }),
  incomeType: varchar("income_type", { length: 50 }),
  amount: varchar("amount", { length: 50 }),
  cibil: varchar("cibil", { length: 20 }),
  docsCollected: varchar("docs_collected", { length: 255 }),
  companyLogged: varchar("company_logged", { length: 255 }),
  roi: varchar("roi", { length: 50 }),
  loanDisbursed: varchar("loan_disbursed", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  notes: text("notes"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  // Admin-only: payout and payment received from bank
  payoutPercent: varchar("payout_percent", { length: 20 }),
  payoutAmount: varchar("payout_amount", { length: 50 }),
  reconsil: varchar("reconsil", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 50 }),
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  employeeId: true,
  date: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  location: true,
  loanType: true,
  incomeType: true,
  amount: true,
  cibil: true,
  docsCollected: true,
  companyLogged: true,
  roi: true,
  loanDisbursed: true,
  status: true,
  notes: true,
  payoutPercent: true,
  payoutAmount: true,
  reconsil: true,
  paymentStatus: true,
});

export const updateLeadSchema = insertLeadSchema.partial();

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export const insuranceLeads = mysqlTable("insurance_leads", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  contactNum: varchar("contact_num", { length: 50 }),
  mailId: varchar("mail_id", { length: 255 }),
  location: varchar("location", { length: 255 }),
  insuranceType: varchar("insurance_type", { length: 100 }),
  incomeType: varchar("income_type", { length: 50 }),
  premiumQuoted: varchar("premium_quoted", { length: 50 }),
  premiumCollected: varchar("premium_collected", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  // Admin-only: collected/actual premium and remarks
  collectedPremium: varchar("collected_premium", { length: 50 }),
  actualPremium: varchar("actual_premium", { length: 50 }),
  finalRemarks: varchar("final_remarks", { length: 500 }),
});

export const insertInsuranceLeadSchema = createInsertSchema(insuranceLeads).pick({
  employeeId: true,
  date: true,
  customerName: true,
  contactNum: true,
  mailId: true,
  location: true,
  insuranceType: true,
  incomeType: true,
  premiumQuoted: true,
  premiumCollected: true,
  status: true,
  notes: true,
  collectedPremium: true,
  actualPremium: true,
  finalRemarks: true,
});

export type InsuranceLead = typeof insuranceLeads.$inferSelect;
export type InsertInsuranceLead = z.infer<typeof insertInsuranceLeadSchema>;
