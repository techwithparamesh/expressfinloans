import {
  date,
  decimal,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const USER_ROLES = ["admin", "team_lead", "employee"] as const;
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
  employeeNumber: varchar("employee_number", { length: 10 }), // 4-digit display ID e.g. 1001
  monthlyLeadTarget: int("monthly_lead_target"), // admin-allocated target; null = use default (20)
  teamLeadId: varchar("team_lead_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // employee's Team Lead (null = unassigned)
  reportingTo: varchar("reporting_to", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // hierarchical: who this user reports to (null for admin)
  isActive: int("is_active").notNull().default(1), // 1 = active, 0 = inactive
  designation: varchar("designation", { length: 100 }), // job title for payslips
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankIfsc: varchar("bank_ifsc", { length: 20 }),
  pan: varchar("pan", { length: 20 }),
  uan: varchar("uan", { length: 30 }), // PF Universal Account Number
  dateOfJoining: date("date_of_joining"),
  department: varchar("department", { length: 100 }),
  location: varchar("location", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  employmentStatus: varchar("employment_status", { length: 20 }).notNull().default("confirmed"), // probation | confirmed | resigned
  probationStartDate: date("probation_start_date"),
  confirmedAt: timestamp("confirmed_at"),
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
  loginLocation: varchar("login_location", { length: 500 }),
  loginIp: varchar("login_ip", { length: 45 }),
  loginLat: decimal("login_lat", { precision: 10, scale: 7 }),
  loginLng: decimal("login_lng", { precision: 10, scale: 7 }),
  logoutLocation: varchar("logout_location", { length: 500 }),
  logoutLat: decimal("logout_lat", { precision: 10, scale: 7 }),
  logoutLng: decimal("logout_lng", { precision: 10, scale: 7 }),
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
  loginLocation: true,
  loginIp: true,
  loginLat: true,
  loginLng: true,
  logoutLocation: true,
  logoutLat: true,
  logoutLng: true,
  leadsCount: true,
  status: true,
});

export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type InsertAttendanceLog = z.infer<typeof insertAttendanceLogSchema>;

// --- Holiday calendar (admin-managed) ---
export const holidayCalendar = mysqlTable("holiday_calendar", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: date("date").notNull(),
  occasion: varchar("occasion", { length: 255 }).notNull(),
  holidayType: varchar("holiday_type", { length: 20 }).notNull().default("full_day"), // full_day | half_day
  isActive: int("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertHolidayCalendarSchema = createInsertSchema(holidayCalendar).pick({
  date: true,
  occasion: true,
  holidayType: true,
  isActive: true,
});

export type HolidayCalendar = typeof holidayCalendar.$inferSelect;
export type InsertHolidayCalendar = z.infer<typeof insertHolidayCalendarSchema>;

export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  dateOfBirth: date("date_of_birth"),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  location: varchar("location", { length: 255 }),
  loanType: varchar("loan_type", { length: 100 }),
  subLoanType: varchar("sub_loan_type", { length: 100 }),
  incomeType: varchar("income_type", { length: 100 }),
  incomeComments: text("income_comments"),
  amount: varchar("amount", { length: 50 }),
  cibil: varchar("cibil", { length: 20 }),
  docsCollected: varchar("docs_collected", { length: 255 }),
  companyLogged: varchar("company_logged", { length: 255 }),
  applicationNumber: varchar("application_number", { length: 100 }),
  tenure: varchar("tenure", { length: 50 }),
  roi: varchar("roi", { length: 50 }),
  loanDisbursed: varchar("loan_disbursed", { length: 50 }),
  loanSanctionedAt: date("loan_sanctioned_at"),
  loanDisbursedAt: date("loan_disbursed_at"),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  notes: text("notes"),
  closedAt: timestamp("closed_at"),
  formLocation: varchar("form_location", { length: 500 }),
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
  dateOfBirth: true,
  customerPhone: true,
  customerEmail: true,
  location: true,
  loanType: true,
  subLoanType: true,
  incomeType: true,
  incomeComments: true,
  amount: true,
  cibil: true,
  docsCollected: true,
  companyLogged: true,
  applicationNumber: true,
  tenure: true,
  roi: true,
  loanDisbursed: true,
  loanSanctionedAt: true,
  loanDisbursedAt: true,
  status: true,
  notes: true,
  formLocation: true,
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
  dateOfBirth: date("date_of_birth"),
  contactNum: varchar("contact_num", { length: 50 }),
  mailId: varchar("mail_id", { length: 255 }),
  location: varchar("location", { length: 255 }),
  insuranceType: varchar("insurance_type", { length: 100 }),
  insuranceCategory: varchar("insurance_category", { length: 100 }),
  insuranceProductType: varchar("insurance_product_type", { length: 100 }),
  insuranceProductTypeOther: varchar("insurance_product_type_other", { length: 255 }),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  insuranceSubtype: varchar("insurance_subtype", { length: 100 }),
  insuranceSubtypeOther: varchar("insurance_subtype_other", { length: 255 }),
  profileType: varchar("profile_type", { length: 100 }),
  profileComments: text("profile_comments"),
  businessType: varchar("business_type", { length: 100 }),
  businessTypeComments: text("business_type_comments"),
  paymentMode: varchar("payment_mode", { length: 100 }),
  paymentModeComments: text("payment_mode_comments"),
  paymentDoneBy: varchar("payment_done_by", { length: 100 }),
  paymentDoneByComments: text("payment_done_by_comments"),
  incomeType: varchar("income_type", { length: 50 }),
  premiumQuoted: varchar("premium_quoted", { length: 50 }),
  premiumCollected: varchar("premium_collected", { length: 50 }),
  netPremium: varchar("net_premium", { length: 50 }),
  difference: varchar("difference", { length: 50 }),
  miscellaneousExpenses: varchar("miscellaneous_expenses", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  notes: text("notes"),
  formLocation: varchar("form_location", { length: 500 }),
  // Policy details (for renewal reminder)
  policyNumber: varchar("policy_number", { length: 100 }),
  policyStartDate: date("policy_start_date"),
  policyEndDate: date("policy_end_date"),
  renewedAt: timestamp("renewed_at"), // when set, policy is treated as renewed; no longer shown in expiring reminder
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
  dateOfBirth: true,
  contactNum: true,
  mailId: true,
  location: true,
  insuranceType: true,
  insuranceCategory: true,
  insuranceProductType: true,
  insuranceProductTypeOther: true,
  vehicleNumber: true,
  insuranceSubtype: true,
  insuranceSubtypeOther: true,
  profileType: true,
  profileComments: true,
  businessType: true,
  businessTypeComments: true,
  paymentMode: true,
  paymentModeComments: true,
  paymentDoneBy: true,
  paymentDoneByComments: true,
  incomeType: true,
  premiumQuoted: true,
  premiumCollected: true,
  netPremium: true,
  difference: true,
  miscellaneousExpenses: true,
  status: true,
  notes: true,
  formLocation: true,
  policyNumber: true,
  policyStartDate: true,
  policyEndDate: true,
  renewedAt: true,
  collectedPremium: true,
  actualPremium: true,
  finalRemarks: true,
});

export type InsuranceLead = typeof insuranceLeads.$inferSelect;
export type InsertInsuranceLead = z.infer<typeof insertInsuranceLeadSchema>;

// Leave types for dropdown (attendance/leave options)
export const LEAVE_TYPES = [
  "on_duty",
  "missed_punch",
  "on_leave",
  "loss_of_pay",
  "personal",
  "sick",
  "casual",
  "emergency",
  "other",
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const leaveRequests = mysqlTable("leave_requests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  leaveType: varchar("leave_type", { length: 50 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected
  approvedById: varchar("approved_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).pick({
  employeeId: true,
  leaveType: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

// --- Employee resignation workflow (employee -> team lead -> admin) ---
export const resignationRequests = mysqlTable("resignation_requests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  requestedLastWorkingDay: date("requested_last_working_day"),
  effectiveLastWorkingDay: date("effective_last_working_day"),
  noticeDays: int("notice_days").notNull().default(30), // 30 (probation) | 90 (confirmed)
  status: varchar("status", { length: 30 }).notNull().default("pending_team_lead"),
  teamLeadDecision: varchar("team_lead_decision", { length: 20 }), // approved | rejected
  teamLeadDecisionBy: varchar("team_lead_decision_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  teamLeadDecisionAt: timestamp("team_lead_decision_at"),
  teamLeadRemarks: text("team_lead_remarks"),
  adminDecision: varchar("admin_decision", { length: 20 }), // approved | rejected
  adminDecisionBy: varchar("admin_decision_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  adminDecisionAt: timestamp("admin_decision_at"),
  adminRemarks: text("admin_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertResignationRequestSchema = createInsertSchema(resignationRequests).pick({
  employeeId: true,
  reason: true,
  requestedLastWorkingDay: true,
  effectiveLastWorkingDay: true,
  noticeDays: true,
  status: true,
  teamLeadDecision: true,
  teamLeadDecisionBy: true,
  teamLeadDecisionAt: true,
  teamLeadRemarks: true,
  adminDecision: true,
  adminDecisionBy: true,
  adminDecisionAt: true,
  adminRemarks: true,
});

export type ResignationRequest = typeof resignationRequests.$inferSelect;
export type InsertResignationRequest = z.infer<typeof insertResignationRequestSchema>;

// --- Employee probation confirmation workflow (team lead -> admin) ---
export const probationConfirmations = mysqlTable("probation_confirmations", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  probationStartDate: date("probation_start_date"),
  probationCompletedOn: date("probation_completed_on").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending_team_lead"),
  teamLeadDecision: varchar("team_lead_decision", { length: 20 }), // approved | rejected
  teamLeadDecisionBy: varchar("team_lead_decision_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  teamLeadDecisionAt: timestamp("team_lead_decision_at"),
  teamLeadRemarks: text("team_lead_remarks"),
  adminDecision: varchar("admin_decision", { length: 20 }), // approved | rejected
  adminDecisionBy: varchar("admin_decision_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  adminDecisionAt: timestamp("admin_decision_at"),
  adminRemarks: text("admin_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertProbationConfirmationSchema = createInsertSchema(probationConfirmations).pick({
  employeeId: true,
  probationStartDate: true,
  probationCompletedOn: true,
  status: true,
  teamLeadDecision: true,
  teamLeadDecisionBy: true,
  teamLeadDecisionAt: true,
  teamLeadRemarks: true,
  adminDecision: true,
  adminDecisionBy: true,
  adminDecisionAt: true,
  adminRemarks: true,
});

export type ProbationConfirmation = typeof probationConfirmations.$inferSelect;
export type InsertProbationConfirmation = z.infer<typeof insertProbationConfirmationSchema>;

// --- Payroll & Payslips (Option B: rules + inputs, app calculates) ---
export const salaryStructures = mysqlTable("salary_structures", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  basic: decimal("basic", { precision: 12, scale: 2 }).notNull().default("0"),
  hraPercent: decimal("hra_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  specialAllowance: decimal("special_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  conveyance: decimal("conveyance", { precision: 12, scale: 2 }).notNull().default("0"),
  medical: decimal("medical", { precision: 12, scale: 2 }).notNull().default("0"),
  employeePfPercent: decimal("employee_pf_percent", { precision: 5, scale: 2 }).notNull().default("12"),
  ptAmount: decimal("pt_amount", { precision: 10, scale: 2 }).notNull().default("0"), // Professional tax
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertSalaryStructureSchema = createInsertSchema(salaryStructures).pick({
  employeeId: true,
  basic: true,
  hraPercent: true,
  specialAllowance: true,
  conveyance: true,
  medical: true,
  employeePfPercent: true,
  ptAmount: true,
});

export type SalaryStructure = typeof salaryStructures.$inferSelect;
export type InsertSalaryStructure = z.infer<typeof insertSalaryStructureSchema>;

export const payrollEntries = mysqlTable("payroll_entries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  incentives: decimal("incentives", { precision: 12, scale: 2 }).notNull().default("0"),
  deductionsOther: decimal("deductions_other", { precision: 12, scale: 2 }).notNull().default("0"),
  tdsAmount: decimal("tds_amount", { precision: 12, scale: 2 }), // optional; if null we could calculate later
  absentDays: int("absent_days").notNull().default(0),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertPayrollEntrySchema = createInsertSchema(payrollEntries).pick({
  employeeId: true,
  period: true,
  incentives: true,
  deductionsOther: true,
  tdsAmount: true,
  absentDays: true,
  notes: true,
  createdBy: true,
});

export type PayrollEntry = typeof payrollEntries.$inferSelect;
export type InsertPayrollEntry = z.infer<typeof insertPayrollEntrySchema>;

export const payslips = mysqlTable("payslips", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 7 }).notNull(),
  earningsBreakdown: text("earnings_breakdown"), // JSON
  deductionsBreakdown: text("deductions_breakdown"), // JSON
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }).notNull().default("0"),
  netPay: decimal("net_pay", { precision: 12, scale: 2 }).notNull().default("0"),
  pdfPath: varchar("pdf_path", { length: 512 }),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: varchar("generated_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPayslipSchema = createInsertSchema(payslips).pick({
  employeeId: true,
  period: true,
  earningsBreakdown: true,
  deductionsBreakdown: true,
  totalEarnings: true,
  totalDeductions: true,
  netPay: true,
  pdfPath: true,
  generatedBy: true,
});

export type Payslip = typeof payslips.$inferSelect;
export type InsertPayslip = z.infer<typeof insertPayslipSchema>;

// --- Offer Letters (template + generated letter workflow) ---
export const offerLetterTemplates = mysqlTable("offer_letter_templates", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  templatePath: varchar("template_path", { length: 512 }),
  templateBody: text("template_body").notNull(),
  placeholdersJson: text("placeholders_json"),
  isActive: int("is_active").notNull().default(1),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertOfferLetterTemplateSchema = createInsertSchema(offerLetterTemplates).pick({
  name: true,
  templatePath: true,
  templateBody: true,
  placeholdersJson: true,
  isActive: true,
  createdBy: true,
});

export type OfferLetterTemplate = typeof offerLetterTemplates.$inferSelect;
export type InsertOfferLetterTemplate = z.infer<typeof insertOfferLetterTemplateSchema>;

export const offerLetters = mysqlTable("offer_letters", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: varchar("template_id", { length: 36 }).references(() => offerLetterTemplates.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull().default("Offer Letter"),
  status: varchar("status", { length: 30 }).notNull().default("generated"), // generated | published | accepted | rejected
  payloadJson: text("payload_json"),
  letterBody: text("letter_body").notNull(),
  pdfPath: varchar("pdf_path", { length: 512 }),
  generatedBy: varchar("generated_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  publishedBy: varchar("published_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  decisionRemarks: text("decision_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertOfferLetterSchema = createInsertSchema(offerLetters).pick({
  employeeId: true,
  templateId: true,
  title: true,
  status: true,
  payloadJson: true,
  letterBody: true,
  pdfPath: true,
  generatedBy: true,
  publishedBy: true,
  publishedAt: true,
  acceptedAt: true,
  rejectedAt: true,
  decisionRemarks: true,
});

export type OfferLetter = typeof offerLetters.$inferSelect;
export type InsertOfferLetter = z.infer<typeof insertOfferLetterSchema>;

// --- Admin Expenses (office/admin ledger: Rent, Electricity, Water, Other) ---
export const ADMIN_EXPENSE_PURPOSES = ["Rent", "Electricity Bill", "Water Bill", "Other"] as const;
export type AdminExpensePurpose = (typeof ADMIN_EXPENSE_PURPOSES)[number];

export const adminExpenses = mysqlTable("admin_expenses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  purpose: varchar("purpose", { length: 100 }).notNull(),
  purposeOther: varchar("purpose_other", { length: 255 }),
  address: varchar("address", { length: 500 }),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  amount: varchar("amount", { length: 50 }),
  paymentDate: date("payment_date"),
  transactionDetail: varchar("transaction_detail", { length: 500 }),
  bankName: varchar("bank_name", { length: 255 }),
  remarks: text("remarks"),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertAdminExpenseSchema = createInsertSchema(adminExpenses).pick({
  purpose: true,
  purposeOther: true,
  address: true,
  month: true,
  amount: true,
  paymentDate: true,
  transactionDetail: true,
  bankName: true,
  remarks: true,
  createdBy: true,
});

export type AdminExpense = typeof adminExpenses.$inferSelect;
export type InsertAdminExpense = z.infer<typeof insertAdminExpenseSchema>;

// --- Leader Expense Requests (raised by team leaders, approved by admin) ---
export const leaderExpenseRequests = mysqlTable("leader_expense_requests", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  purpose: varchar("purpose", { length: 100 }).notNull(),
  purposeOther: varchar("purpose_other", { length: 255 }),
  address: varchar("address", { length: 500 }),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  amount: varchar("amount", { length: 50 }),
  paymentDate: date("payment_date"),
  transactionDetail: varchar("transaction_detail", { length: 500 }),
  bankName: varchar("bank_name", { length: 255 }),
  remarks: text("remarks"),
  requestedBy: varchar("requested_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const insertLeaderExpenseRequestSchema = createInsertSchema(leaderExpenseRequests).pick({
  purpose: true,
  purposeOther: true,
  address: true,
  month: true,
  amount: true,
  paymentDate: true,
  transactionDetail: true,
  bankName: true,
  remarks: true,
  requestedBy: true,
  status: true,
});

export type LeaderExpenseRequest = typeof leaderExpenseRequests.$inferSelect;
export type InsertLeaderExpenseRequest = z.infer<typeof insertLeaderExpenseRequestSchema>;

// --- Hierarchical Monthly Target Allocation ---
// Budget in rupees (e.g. 5 crore = 50000000). Leads = count.
// Admin sets overall for the company (one row per month).
export const companyMonthlyTarget = mysqlTable("company_monthly_target", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  month: int("month").notNull(),
  year: int("year").notNull(),
  totalBudget: decimal("total_budget", { precision: 15, scale: 2 }).notNull().default("0"),
  totalLeads: int("total_leads").notNull().default(0),
  isLocked: int("is_locked").notNull().default(0),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CompanyMonthlyTarget = typeof companyMonthlyTarget.$inferSelect;

export const monthlyTargets = mysqlTable("monthly_targets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  assignedBudget: decimal("assigned_budget", { precision: 15, scale: 2 }).notNull().default("0"),
  assignedLeads: int("assigned_leads").notNull().default(0),
  isLocked: int("is_locked").notNull().default(0), // 0 = false, 1 = true
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type MonthlyTarget = typeof monthlyTargets.$inferSelect;
export type InsertMonthlyTarget = Omit<MonthlyTarget, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date };

export const monthlyPerformance = mysqlTable("monthly_performance", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: int("month").notNull(),
  year: int("year").notNull(),
  achievedBudget: decimal("achieved_budget", { precision: 15, scale: 2 }).notNull().default("0"),
  achievedLeads: int("achieved_leads").notNull().default(0),
  achievementPercentage: decimal("achievement_percentage", { precision: 8, scale: 2 }).notNull().default("0"),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

export type MonthlyPerformance = typeof monthlyPerformance.$inferSelect;
export type InsertMonthlyPerformance = Omit<MonthlyPerformance, "id" | "calculatedAt"> & { id?: string; calculatedAt?: Date };

export const targetAuditLog = mysqlTable("target_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  monthlyTargetId: varchar("monthly_target_id", { length: 36 }).references(() => monthlyTargets.id, { onDelete: "set null" }),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  month: int("month").notNull(),
  year: int("year").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // created | updated | locked | unlocked
  changedBy: varchar("changed_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  oldValue: text("old_value"), // JSON
  newValue: text("new_value"), // JSON
});

export type TargetAuditLog = typeof targetAuditLog.$inferSelect;
export type InsertTargetAuditLog = Omit<TargetAuditLog, "id" | "changedAt"> & { id?: string; changedAt?: Date };
