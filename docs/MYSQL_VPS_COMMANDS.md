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

-- Users (staff + admin)
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
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

(Skip any column that already exists, or run one `ADD COLUMN` per line if your MySQL reports "Duplicate column".)

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

This error appears on the **staff login page** when the app cannot connect to MySQL. It is **not** about the staff username/password you type in the form — it is about the **database credentials** used by the app.

**Cause:** The app reads `DATABASE_URL` (e.g. `mysql://expressfin:PASSWORD@localhost:3306/expressfinloans`). MySQL is rejecting that user/password or the user does not exist for `localhost`.

**Fix (on the VPS where the app runs):**

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

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Log in: `mysql -u root -p` |
| 2 | Create DB + user + grant (see step 2 above) |
| 3a | From app dir: `export DATABASE_URL=...` then `npm run db:push` and `npm run seed` |
| or 3b | Run the CREATE TABLE (and sessions) SQL in step 4, then from app dir run `npm run seed` |
| 5 | Set `DATABASE_URL` in your app’s environment |

Default admin login after seed: **username** `admin`, **password** `Admin@123`. Change the password after first login at `/staff/profile`.
