# MySQL setup on VPS – commands to run

Run these on your VPS (MySQL client or shell). Replace `YOUR_SECURE_PASSWORD` and `expressfinloans` if you use different names.

**If you see `Unknown column 'tenure' in 'field list'`:** Your `leads` table is missing the tenure column. Run: `ALTER TABLE leads ADD COLUMN tenure VARCHAR(50) NULL AFTER company_logged;` (see “Tenure column” section below for full block.)

---

## 1. Log in to MySQL as root

```bash
mysql -u root -p
```

---

## 2. Create database and user

Run inside the MySQL shell (`mysql>`) or as one-liners with `-e`.

```sql
CREATE DATABASE expressfinloans CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'expressfin'@'localhost' IDENTIFIED BY 'Express#Fin321';

GRANT ALL PRIVILEGES ON expressfinloans.* TO 'expressfin'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

One-liner from shell (replace password):

```bash
mysql -u root -p -e "CREATE DATABASE expressfinloans CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER 'expressfin'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD'; GRANT ALL PRIVILEGES ON expressfinloans.* TO 'expressfin'@'localhost'; FLUSH PRIVILEGES;"
```

---

## 3. Create tables (option A – let the app do it)

From your **project directory on the VPS** (where the app code is), set `DATABASE_URL` and run:

```bash
export DATABASE_URL="mysql://expressfin:YOUR_SECURE_PASSWORD@localhost:3306/expressfinloans"
npm run db:push
npm run seed
```

Use the same password as in step 2. Tables will be created by Drizzle; the seed creates the default admin user.

---

## 4. Create tables manually (option B – run SQL yourself)

If you prefer to create tables in MySQL yourself, run the following (after creating the database and user in step 2).

**If `leads` already exists** (e.g. you created it earlier), do **not** run the full `CREATE TABLE leads` below — you will get “Table 'leads' already exists”. Use the **ALTER block** further down in this section instead.

```sql
USE expressfinloans;

-- Users (staff + admin). If the table already exists, add missing columns with ALTER (see blocks below).
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  avatar_url VARCHAR(512) NULL,
  employee_number VARCHAR(10) NULL,
  monthly_lead_target INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance (login/logout + leads count per day)
CREATE TABLE attendance_logs (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  login_at TIMESTAMP NULL,
  logout_at TIMESTAMP NULL,
  leads_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'incomplete',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leads (loan leads with full form fields)
CREATE TABLE leads (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  customer_email VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  loan_type VARCHAR(100) NULL,
  income_type VARCHAR(50) NULL,
  amount VARCHAR(50) NULL,
  cibil VARCHAR(20) NULL,
  docs_collected VARCHAR(255) NULL,
  company_logged VARCHAR(255) NULL,
  roi VARCHAR(50) NULL,
  loan_disbursed VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  notes TEXT NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  payout_percent VARCHAR(20) NULL,
  payout_amount VARCHAR(50) NULL,
  reconsil VARCHAR(50) NULL,
  payment_status VARCHAR(50) NULL
);

-- Insurance leads
CREATE TABLE insurance_leads (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  customer_name VARCHAR(255) NULL,
  contact_num VARCHAR(50) NULL,
  mail_id VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  insurance_type VARCHAR(100) NULL,
  income_type VARCHAR(50) NULL,
  premium_quoted VARCHAR(50) NULL,
  premium_collected VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  collected_premium VARCHAR(50) NULL,
  actual_premium VARCHAR(50) NULL,
  final_remarks VARCHAR(500) NULL
);

-- Session store (for express-mysql-session)
CREATE TABLE sessions (
  session_id VARCHAR(128) NOT NULL PRIMARY KEY,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT NULL
);
```

---

## Fix: "Failed to load dashboard" / "Failed to load leads" on all pages

If staff pages show **"Failed to load dashboard"** or **"Failed to load leads"** (and other pages fail to load data), the app code is newer than your database schema. The `leads` table is missing columns that the app now expects.

**Run the following on your MySQL server** (skip any line that returns `Duplicate column name`):

```sql
USE expressfinloans;

-- Loan form columns (add if missing)
ALTER TABLE leads ADD COLUMN date_of_birth DATE NULL AFTER customer_name;
ALTER TABLE leads ADD COLUMN sub_loan_type VARCHAR(100) NULL AFTER loan_type;
ALTER TABLE leads ADD COLUMN income_comments TEXT NULL AFTER income_type;
ALTER TABLE leads ADD COLUMN tenure VARCHAR(50) NULL AFTER company_logged;
ALTER TABLE leads ADD COLUMN loan_sanctioned_at DATE NULL;
ALTER TABLE leads ADD COLUMN loan_disbursed_at DATE NULL;
ALTER TABLE leads MODIFY COLUMN income_type VARCHAR(100) NULL;
```

Run each line separately if your MySQL client stops on error; or run as a block and ignore "Duplicate column" for columns you already have. Then **restart your app** (e.g. `pm2 restart all` or restart the Node process).

---

**If you already have the old `leads` table**, run this once to add loan-form columns and the insurance_leads table:

```sql
USE expressfinloans;

ALTER TABLE leads
  ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_phone,
  ADD COLUMN location VARCHAR(255) NULL AFTER customer_email,
  ADD COLUMN income_type VARCHAR(50) NULL AFTER loan_type,
  ADD COLUMN cibil VARCHAR(20) NULL AFTER amount,
  ADD COLUMN docs_collected VARCHAR(255) NULL AFTER cibil,
  ADD COLUMN company_logged VARCHAR(255) NULL AFTER docs_collected,
  ADD COLUMN roi VARCHAR(50) NULL AFTER company_logged,
  ADD COLUMN loan_disbursed VARCHAR(50) NULL AFTER roi;
ALTER TABLE leads MODIFY status VARCHAR(50) NOT NULL DEFAULT 'open';

CREATE TABLE insurance_leads (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  customer_name VARCHAR(255) NULL,
  contact_num VARCHAR(50) NULL,
  mail_id VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  insurance_type VARCHAR(100) NULL,
  income_type VARCHAR(50) NULL,
  premium_quoted VARCHAR(50) NULL,
  premium_collected VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Loan application form update (DOB, sub loan type, income comments):** To support the updated loan lead form (Date of Birth, Sub Loan Type, Income Comments, and longer Income Type), run:

```sql
USE expressfinloans;

-- Add new columns (skip any that already exist)
ALTER TABLE leads ADD COLUMN date_of_birth DATE NULL AFTER customer_name;
ALTER TABLE leads ADD COLUMN sub_loan_type VARCHAR(100) NULL AFTER loan_type;
ALTER TABLE leads ADD COLUMN income_comments TEXT NULL AFTER income_type;
ALTER TABLE leads MODIFY COLUMN income_type VARCHAR(100) NULL;
```

**Tenure column (loan form):** To add the Tenure field for loan leads, run:

```sql
USE expressfinloans;

ALTER TABLE leads ADD COLUMN tenure VARCHAR(50) NULL AFTER company_logged;
```

**Loan Sanctioned / Disbursed dates (TAT in loan form):** To add the Loan Sanctioned date and Loan Disbursed date used for TAT (turnaround time) in the loan lead form, run:

```sql
USE expressfinloans;

ALTER TABLE leads ADD COLUMN loan_sanctioned_at DATE NULL;
ALTER TABLE leads ADD COLUMN loan_disbursed_at DATE NULL;
```

If you get "Duplicate column name", that column already exists—omit that line.

**Admin-only loan fields (payout, reconsil, payment status):** If you already have the `leads` table and want to add admin-editable columns, run:

```sql
USE expressfinloans;

ALTER TABLE leads
  ADD COLUMN payout_percent VARCHAR(20) NULL,
  ADD COLUMN payout_amount VARCHAR(50) NULL,
  ADD COLUMN reconsil VARCHAR(50) NULL,
  ADD COLUMN payment_status VARCHAR(50) NULL;
```

**Admin-only insurance lead fields (collected premium, actual premium, final remarks):** To add admin-editable columns to `insurance_leads`, run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads
  ADD COLUMN collected_premium VARCHAR(50) NULL,
  ADD COLUMN actual_premium VARCHAR(50) NULL,
  ADD COLUMN final_remarks VARCHAR(500) NULL;
```

**Insurance lead form (date of birth, insurance subtype):** To add Date of Birth and Insurance Subtype (provider per type) to the insurance lead form, run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads
  ADD COLUMN date_of_birth DATE NULL,
  ADD COLUMN insurance_subtype VARCHAR(100) NULL;
```

**Insurance lead form (profile type, profile comments):** To add Profile Type and Profile Comments to the insurance lead form, run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads
  ADD COLUMN profile_type VARCHAR(100) NULL,
  ADD COLUMN profile_comments TEXT NULL;
```

**Insurance lead form (business type, payment mode, payment done by and comments):** To add Business Type, Payment Mode, Payment done by and their comment fields, run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads
  ADD COLUMN business_type VARCHAR(100) NULL,
  ADD COLUMN business_type_comments TEXT NULL,
  ADD COLUMN payment_mode VARCHAR(100) NULL,
  ADD COLUMN payment_mode_comments TEXT NULL,
  ADD COLUMN payment_done_by VARCHAR(100) NULL,
  ADD COLUMN payment_done_by_comments TEXT NULL;
```

**Insurance lead form (Difference – auto-calculated):** To store the auto-calculated difference (Premium quoted − Premium collected), run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads ADD COLUMN difference VARCHAR(50) NULL;
```

**Insurance lead form (subtype “Other” – manual entry):** When subtype is “Other” or “Others”, employees can specify the subtype manually. Run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads ADD COLUMN insurance_subtype_other VARCHAR(255) NULL;
```

**Insurance lead form (Miscellaneous Expenses):** To add the manually editable Miscellaneous Expenses column, run:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads ADD COLUMN miscellaneous_expenses VARCHAR(100) NULL;
```

**Attendance login location (hybrid: browser geolocation + IP fallback):** To store where the employee logged in (check-in location), run:

```sql
USE expressfinloans;

ALTER TABLE attendance_logs
  ADD COLUMN login_location VARCHAR(500) NULL,
  ADD COLUMN login_ip VARCHAR(45) NULL,
  ADD COLUMN login_lat DECIMAL(10,7) NULL,
  ADD COLUMN login_lng DECIMAL(10,7) NULL;
```

**Attendance logout location (capture location when employee logs out):** To store where the employee logged out, run:

```sql
USE expressfinloans;

ALTER TABLE attendance_logs
  ADD COLUMN logout_location VARCHAR(500) NULL,
  ADD COLUMN logout_lat DECIMAL(10,7) NULL,
  ADD COLUMN logout_lng DECIMAL(10,7) NULL;
```

(Skip any column that already exists. If you get "Duplicate column", run one `ADD COLUMN` per line.)

**Employee number (4-digit ID for staff):** To add the employee ID column used in attendance/leads (e.g. 1001, 1002), run:

```sql
USE expressfinloans;

ALTER TABLE users ADD COLUMN employee_number VARCHAR(10) NULL;
```

Then run the app seed so existing employees get numbers assigned: `npm run seed` (from project dir with `DATABASE_URL` set). **If Employee ID still shows "—" in the admin dashboard**, the `employee_number` column was added but backfill was not run—run `npm run seed` once to assign 1001, 1002, … to all existing employees.

**Monthly lead target (admin-allocated):** To let admins set a monthly lead target per employee (shown in the employee popup and on My dashboard), run:

```sql
USE expressfinloans;

ALTER TABLE users ADD COLUMN monthly_lead_target INT NULL;
```

If omitted, the app uses a default of 20. Admins can set it when creating or editing an employee (Employees → Edit).

**Team Lead role and team assignment:** To add the Team Lead role and assign employees to a team lead, run:

```sql
USE expressfinloans;

ALTER TABLE users ADD COLUMN team_lead_id VARCHAR(36) NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_team_lead FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL;
```

(If you use `npm run db:push`, Drizzle will add the column. You can skip the constraint if Drizzle manages it.)

**Leave requests table:** For leave request and approval (employee applies, team lead approves), create the table:

```sql
USE expressfinloans;

CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by_id VARCHAR(36) NULL,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_approved_by FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL
);
```

(Skip if you use `npm run db:push`; Drizzle will create the table from the schema.)

(Skip any column that already exists, or run one `ADD COLUMN` per line if your MySQL reports "Duplicate column".)

**Quick reference – what you might be missing**

| If you need … | Run this (see block above) |
|---------------|----------------------------|
| Full loan form (email, location, income_type, cibil, docs_collected, company_logged, roi, loan_disbursed) | First **ALTER TABLE leads** block in "If you already have the old leads table" |
| Loan form update (date_of_birth, sub_loan_type, income_comments, income_type length) | **Loan application form update** ALTER block |
| Tenure column (loan form) | **Tenure column** ALTER above |
| Loan Sanctioned / Disbursed dates (TAT) | **Loan Sanctioned / Disbursed dates** ALTER above |
| Admin loan fields (payout_percent, payout_amount, reconsil, payment_status) | **Admin-only loan fields** ALTER block |
| Profile photo (avatar) on users | In **CREATE TABLE users**: column `avatar_url`; or `ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL;` |
| Employee ID (4-digit) on users | **Employee number** ALTER above; then run `npm run seed` to backfill |
| Monthly lead target (admin-allocated) | **Monthly lead target** ALTER above |
| Payslip / HR (designation, bank, PAN, UAN, DOJ) | **Users: payslip / HR fields** ALTER block above |
| Insurance leads table | **CREATE TABLE insurance_leads** in "If you already have the old leads table" |
| Admin insurance fields (collected_premium, actual_premium, final_remarks) | **Admin-only insurance lead fields** ALTER block |
| Insurance lead form (date_of_birth, insurance_subtype) | **Insurance lead form** ALTER block above |
| Insurance lead form (profile_type, profile_comments) | **Insurance lead form (profile type, profile comments)** ALTER block above |
| Insurance lead form (business_type, payment_mode, payment_done_by + comments) | **Insurance lead form (business type, payment mode, payment done by and comments)** ALTER block above |
| Insurance lead form (difference – auto-calculated) | **Insurance lead form (Difference – auto-calculated)** ALTER block above |
| Insurance subtype “Other” manual entry (insurance_subtype_other) | **Insurance lead form (subtype “Other” – manual entry)** ALTER block above |
| Miscellaneous Expenses (insurance lead) | **Insurance lead form (Miscellaneous Expenses)** ALTER block above |
| Attendance login location (login_location, login_ip, login_lat, login_lng) | **Attendance login location** ALTER block above |
| Attendance logout location (logout_location, logout_lat, logout_lng) | **Attendance logout location** ALTER block above |
| Lead form location (where employee generated the lead – form_location on leads and insurance_leads) | **Lead form location** ALTER block below |
| Insurance product type (Motor/Non-Motor: Car, Two Wheeler, Fire, Health, etc.) | **Product type (Motor/Non-Motor options)** ALTER block below |
| Vehicle number (Motor insurance) | **Vehicle number (Motor insurance)** ALTER block below |
| Admin expenses (office ledger) | **Admin Expenses** CREATE TABLE block below |

**Lead form location (where lead was generated):** To store the address/location where the employee opened the lead form (e.g. "Hyderabad, Telangana, India"):

```sql
USE expressfinloans;

ALTER TABLE leads ADD COLUMN form_location VARCHAR(500) NULL;
ALTER TABLE insurance_leads ADD COLUMN form_location VARCHAR(500) NULL;
```

**Insurance Subtype (General Insurance: Motor / Non-Motor):** To store the category when insurance type is General Insurance:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads ADD COLUMN insurance_category VARCHAR(100) NULL;
```

**Product type (Motor/Non-Motor options – Car, Two Wheeler, Fire, Health, etc.):** To store the selected product type when General Insurance + Motor or Non-Motor is chosen:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads ADD COLUMN insurance_product_type VARCHAR(100) NULL AFTER insurance_category;
ALTER TABLE insurance_leads ADD COLUMN insurance_product_type_other VARCHAR(255) NULL AFTER insurance_product_type;
```

**Vehicle number (Motor insurance):** To store vehicle registration number when General Insurance + Motor is selected:

```sql
USE expressfinloans;

ALTER TABLE insurance_leads ADD COLUMN vehicle_number VARCHAR(50) NULL AFTER insurance_product_type_other;
```

**Admin Expenses (office ledger – Rent, Electricity, Water, Other):** To track admin expenses with purpose, address, month, amount, payment date, transaction detail, bank name, and remarks:

```sql
USE expressfinloans;

CREATE TABLE IF NOT EXISTS admin_expenses (
  id VARCHAR(36) PRIMARY KEY,
  purpose VARCHAR(100) NOT NULL,
  purpose_other VARCHAR(255) NULL,
  address VARCHAR(500) NULL,
  month VARCHAR(7) NOT NULL,
  amount VARCHAR(50) NULL,
  payment_date DATE NULL,
  transaction_detail VARCHAR(500) NULL,
  bank_name VARCHAR(255) NULL,
  remarks TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

If the table already exists without `purpose_other`, add it:

```sql
ALTER TABLE admin_expenses ADD COLUMN purpose_other VARCHAR(255) NULL AFTER purpose;
```

---

**Payroll & Payslips (salary structure, payroll entries, payslips – Option B: app calculates):** For payslip generation with stored rules and monthly inputs:

```sql
USE expressfinloans;

CREATE TABLE IF NOT EXISTS salary_structures (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL UNIQUE,
  basic DECIMAL(12,2) NOT NULL DEFAULT 0,
  hra_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  special_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
  conveyance DECIMAL(12,2) NOT NULL DEFAULT 0,
  medical DECIMAL(12,2) NOT NULL DEFAULT 0,
  employee_pf_percent DECIMAL(5,2) NOT NULL DEFAULT 12,
  pt_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  period VARCHAR(7) NOT NULL,
  incentives DECIMAL(12,2) NOT NULL DEFAULT 0,
  deductions_other DECIMAL(12,2) NOT NULL DEFAULT 0,
  tds_amount DECIMAL(12,2) NULL,
  absent_days INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payslips (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  period VARCHAR(7) NOT NULL,
  earnings_breakdown TEXT NULL,
  deductions_breakdown TEXT NULL,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
  pdf_path VARCHAR(512) NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);
```

Use `DESCRIBE table_name;` (see **Common database commands** below) to see which columns you already have.

If you use **option A** (`npm run db:push`), Drizzle will apply these schema changes automatically.

---

**Hierarchical Monthly Target Allocation (company target, monthly_targets, monthly_performance, audit):** For the target allocation and performance tracking system (Admin → Leader → Sales Manager), run:

```sql
USE expressfinloans;

-- Users: reporting_to and is_active (optional; app works without these)
-- If you get "Duplicate column", the column already exists; skip that line.
ALTER TABLE users ADD COLUMN reporting_to VARCHAR(36) NULL;
ALTER TABLE users ADD COLUMN is_active INT NOT NULL DEFAULT 1;

-- Users: payslip / HR fields (designation, bank, PAN, UAN, DOJ)
ALTER TABLE users ADD COLUMN designation VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN bank_account_number VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN bank_ifsc VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN pan VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN uan VARCHAR(30) NULL;
ALTER TABLE users ADD COLUMN date_of_joining DATE NULL;

-- Company overall target (one row per month; admin sets total budget & leads)
CREATE TABLE IF NOT EXISTS company_monthly_target (
  id VARCHAR(36) PRIMARY KEY,
  month INT NOT NULL,
  year INT NOT NULL,
  total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_leads INT NOT NULL DEFAULT 0,
  is_locked INT NOT NULL DEFAULT 0,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_month (month, year)
);

-- Per-user monthly targets (leaders and employees)
CREATE TABLE IF NOT EXISTS monthly_targets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  assigned_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  assigned_leads INT NOT NULL DEFAULT 0,
  is_locked INT NOT NULL DEFAULT 0,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month_year (user_id, month, year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Calculated performance (achieved budget/leads, achievement %)
CREATE TABLE IF NOT EXISTS monthly_performance (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  achieved_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  achieved_leads INT NOT NULL DEFAULT 0,
  achievement_percentage DECIMAL(8,2) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log for target changes (lock/unlock, allocation edits)
CREATE TABLE IF NOT EXISTS target_audit_log (
  id VARCHAR(36) PRIMARY KEY,
  monthly_target_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_by VARCHAR(36) NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  old_value TEXT NULL,
  new_value TEXT NULL
);
```

(Skip if you use `npm run db:push`; Drizzle will create/alter from the schema.)

---

If you use option B, you still need to create the **admin user** by running the app seed from the project directory:

```bash
export DATABASE_URL="mysql://expressfin:YOUR_SECURE_PASSWORD@localhost:3306/expressfinloans"
npm run seed
```

---

## 5. App environment on the VPS

Set `DATABASE_URL` where your app runs (e.g. `.env` or process manager):

```bash
DATABASE_URL="mysql://expressfin:YOUR_SECURE_PASSWORD@localhost:3306/expressfinloans"
```

If MySQL is on another host, use that host and port instead of `localhost:3306`.

---

## Troubleshooting: "Access denied for user 'expressfin'@'localhost'"

This error appears on the **staff login page** (or in PM2 logs) when the app cannot connect to MySQL. It often comes from **express-mysql-session** (the session store), not the main app pool. It is **not** about the staff username/password you type in the form — it is about the **database credentials** used by the app.

**Cause:** The app reads `DATABASE_URL` (e.g. `mysql://expressfin:PASSWORD@localhost:3306/expressfinloans`). MySQL is rejecting that user/password, or the user exists only for one host (e.g. `localhost`) while the Node driver connects via another (e.g. `127.0.0.1`).

**Fix (on the VPS where the app runs):**

0. **Create the same user for `127.0.0.1` (do this first)**  
   The `mysql` CLI often connects via Unix socket (host = `localhost`), but Node’s mysql2 driver often connects via **TCP** to `127.0.0.1`. In MySQL, `'user'@'localhost'` and `'user'@'127.0.0.1'` are different. If you only have `'expressfin'@'localhost'`, the app can get "Access denied" when it connects to `127.0.0.1`. Create the TCP user (use the same password as in `DATABASE_URL`, e.g. `Express#Fin321`):

   ```bash
   mysql -u root -p
   ```

   ```sql
   CREATE USER 'expressfin'@'127.0.0.1' IDENTIFIED BY 'Express#Fin321';
   GRANT ALL PRIVILEGES ON expressfinloans.* TO 'expressfin'@'127.0.0.1';
   FLUSH PRIVILEGES;
   EXIT;
   ```

   Then restart the app (`pm2 restart expressfinloans-app` or equivalent).

   **If the error still says 'expressfin'@'localhost':** On some systems the driver may still connect via Unix socket (reported as `localhost` by MySQL). Set the **same password for both** users so either connection method works:

   ```sql
   ALTER USER 'expressfin'@'localhost' IDENTIFIED BY 'Express#Fin321';
   ALTER USER 'expressfin'@'127.0.0.1' IDENTIFIED BY 'Express#Fin321';
   FLUSH PRIVILEGES;
   EXIT;
   ```

   Use your actual DB password (the one in `DATABASE_URL`; if it contains `#`, in the URL it is `%23`). After that, restart the app again.

1. **Check what password the MySQL user has**  
   Log in as root and see if the user exists and reset its password to match what you use in `DATABASE_URL`:

   ```bash
   mysql -u root -p
   ```

   ```sql
   -- See if user exists
   SELECT user, host FROM mysql.user WHERE user = 'expressfin';

   -- Set password to match the one in your DATABASE_URL (replace NEW_PASSWORD with the actual password)
   ALTER USER 'expressfin'@'localhost' IDENTIFIED BY 'NEW_PASSWORD';
   FLUSH PRIVILEGES;
   EXIT;
   ```

2. **If the user does not exist**, create it (use the same password you will put in `DATABASE_URL`):

   ```sql
   CREATE USER 'expressfin'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
   GRANT ALL PRIVILEGES ON expressfinloans.* TO 'expressfin'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Make sure `DATABASE_URL` matches**  
   In the app’s environment (e.g. `.env` or PM2/systemd env), set:

   ```bash
   DATABASE_URL="mysql://expressfin:YOUR_SECURE_PASSWORD@localhost:3306/expressfinloans"
   ```

   Use the **exact same** password as in the `IDENTIFIED BY` / `ALTER USER` step. If the password contains special characters (`#`, `@`, `%`, etc.), they must be [URL-encoded](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) in `DATABASE_URL` (e.g. `#` → `%23`).

4. **Restart the app** after changing `.env` or environment variables so it picks up the new `DATABASE_URL`.

**If you still see the error after fixing MySQL:**

5. **Test MySQL from the server** with the exact same credentials as in `.env` (password `Express#Fin321`):

   ```bash
   mysql -u expressfin -p'Express#Fin321' -h localhost expressfinloans -e "SELECT 1"
   ```

   If this fails, MySQL is still rejecting the user/password — fix with `ALTER USER` (step 1) and try again. If this **succeeds**, the app is not using the same credentials (see step 6).

6. **Ensure the app sees `DATABASE_URL`.** The app loads `.env` from the **current working directory** when it starts. If you use PM2 or systemd, the process may start from a different directory and never load `.env`.

   - **Option A:** Start the app from the project directory, e.g. `cd /root/expressfinloans` then start your server (or in PM2: use `--cwd /root/expressfinloans` or set `cwd` in ecosystem file).
   - **Option B:** Set `DATABASE_URL` in the process environment so it doesn’t depend on `.env`. For PM2: in `ecosystem.config.js` add `env: { DATABASE_URL: "mysql://expressfin:Express%23Fin321@localhost:3306/expressfinloans" }`, or run `DATABASE_URL="mysql://..." pm2 start ...`. For systemd: add `Environment=DATABASE_URL=mysql://...` in the service file.

7. **Restart the app** after any change (and reload the browser or try in a private window).

**Why might “my other app” connect to MySQL but this one doesn’t?**

- **Working directory (cwd):** This app loads `.env` via `dotenv/config` from `process.cwd()` when it starts. If PM2 (or systemd) starts the process from a different directory, `.env` is not found and `DATABASE_URL` is missing or wrong. Your other app may be started from its project directory or have `DATABASE_URL` set in the process environment.
- **Fix:** Start this app from the project directory so `.env` is loaded, or set `DATABASE_URL` in the process env (PM2 `env`, or `Environment=` in systemd). In PM2: use `--cwd /root/expressfinloans` when starting, or in `ecosystem.config.js` set `cwd: "/root/expressfinloans"`.
- **See what the app sees:** After restarting, run `pm2 logs expressfinloans-app --lines 20`. You should see a line like `DATABASE_URL seen: mysql://expressfin:***@127.0.0.1:3306/expressfinloans`. If you see `DATABASE_URL not set` or a different host/user, the process is not getting the correct env.

---

## Check or reset staff portal login password

If you created an admin user (e.g. `Expressadmin`) with a hashed password and login fails with “Invalid username or password”, the hash in the DB might not match the password you think you set.

**1. Verify whether a password matches the DB**

From the project directory (with `DATABASE_URL` in `.env`):

```bash
npx tsx script/verify-password.ts Expressadmin YourSuspectPassword
```

- If it prints **Password MATCHES**, use that password to log in.
- If it prints **Password does NOT match**, the stored hash was not made from that password (wrong password or hash was generated differently). Set a new password (step 2).

**2. Set a new password for the user**

Generate a hash for the new password:

```bash
npx tsx script/hash-password.ts MyNewPassword
```

Copy the full output, then in MySQL:

```sql
UPDATE users SET password = 'PASTE_THE_HASH_HERE' WHERE username = 'Expressadmin';
```

Log in with username `Expressadmin` and password `MyNewPassword`.

---

## Common database commands (inspect, backup, restore)

**Connect and select database**

```bash
mysql -u expressfin -p expressfinloans
```

Or as root then switch:

```bash
mysql -u root -p
```

```sql
USE expressfinloans;
```

**List tables**

```sql
SHOW TABLES;
```

**Describe a table (see columns)**

```sql
DESCRIBE users;
DESCRIBE leads;
DESCRIBE attendance_logs;
DESCRIBE insurance_leads;
DESCRIBE sessions;
```

**Quick data checks**

```sql
SELECT id, username, role, full_name FROM users;
SELECT id, employee_id, date, login_at, logout_at, leads_count, status FROM attendance_logs ORDER BY date DESC LIMIT 10;
SELECT id, employee_id, date, customer_name, status FROM leads ORDER BY date DESC LIMIT 10;
```

**Backup database (from shell, not inside MySQL)**

```bash
mysqldump -u expressfin -p expressfinloans > backup_expressfinloans_$(date +%Y%m%d).sql
```

**Restore from backup**

```bash
mysql -u expressfin -p expressfinloans < backup_expressfinloans_20260220.sql
```

**Create user for TCP (127.0.0.1) – if app gets "Access denied"**

Run as root, then:

```sql
CREATE USER 'expressfin'@'127.0.0.1' IDENTIFIED BY 'Express#Fin321';
GRANT ALL PRIVILEGES ON expressfinloans.* TO 'expressfin'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

(Use the same password as in your `DATABASE_URL`.)

---

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Log in: `mysql -u root -p` |
| 2 | Create DB + user + grant (see step 2 above) |
| 3a | From app dir: `export DATABASE_URL=...` then `npm run db:push` and `npm run seed` |
| or 3b | Run the CREATE TABLE (and sessions) SQL in step 4, then from app dir run `npm run seed` |
| 5 | Set `DATABASE_URL` in your app’s environment |

Default admin login after seed: **username** `admin`, **password** `Admin@123`. Change the password after first login at `/staff/profile`.
