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

-- Leads
CREATE TABLE leads (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  loan_type VARCHAR(100) NULL,
  amount VARCHAR(50) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  notes TEXT NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Session store (for express-mysql-session)
CREATE TABLE sessions (
  session_id VARCHAR(128) NOT NULL PRIMARY KEY,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT NULL
);
```

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

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Log in: `mysql -u root -p` |
| 2 | Create DB + user + grant (see step 2 above) |
| 3a | From app dir: `export DATABASE_URL=...` then `npm run db:push` and `npm run seed` |
| or 3b | Run the CREATE TABLE (and sessions) SQL in step 4, then from app dir run `npm run seed` |
| 5 | Set `DATABASE_URL` in your app’s environment |

Default admin login after seed: **username** `admin`, **password** `Admin@123`. Change the password after first login at `/staff/profile`.
