# MySQL setup on VPS – commands to run

Run these on your VPS (MySQL client or shell). Replace `YOUR_SECURE_PASSWORD` and `expressfinloans` if you use different names.

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

(Skip any column that already exists, or run one `ADD COLUMN` per line if your MySQL reports "Duplicate column".)

**Quick reference – what you might be missing**

| If you need … | Run this (see block above) |
|---------------|----------------------------|
| Full loan form (email, location, income_type, cibil, docs_collected, company_logged, roi, loan_disbursed) | First **ALTER TABLE leads** block in "If you already have the old leads table" |
| Admin loan fields (payout_percent, payout_amount, reconsil, payment_status) | **Admin-only loan fields** ALTER block |
| Profile photo (avatar) on users | In **CREATE TABLE users**: column `avatar_url`; or `ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL;` |
| Employee ID (4-digit) on users | **Employee number** ALTER above; then run `npm run seed` to backfill |
| Monthly lead target (admin-allocated) | **Monthly lead target** ALTER above |
| Insurance leads table | **CREATE TABLE insurance_leads** in "If you already have the old leads table" |
| Admin insurance fields (collected_premium, actual_premium, final_remarks) | **Admin-only insurance lead fields** ALTER block |

Use `DESCRIBE table_name;` (see **Common database commands** below) to see which columns you already have.

If you use **option A** (`npm run db:push`), Drizzle will apply these schema changes automatically.

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
