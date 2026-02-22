import session from "express-session";
import type { Express } from "express";
import mysql from "mysql2/promise";

const isProd = process.env.NODE_ENV === "production";
const secret = process.env.SESSION_SECRET || "express-finloans-staff-secret-change-in-production";

export async function setupSession(app: Express): Promise<void> {
  const store = await getSessionStore();
  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      store,
      name: "express.staff.sid",
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );
}

async function getSessionStore(): Promise<session.Store> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.startsWith("mysql")) {
    throw new Error(
      "DATABASE_URL (mysql://...) is required for staff portal. Sessions and user data are stored in the database."
    );
  }
  // Force TCP so MySQL uses 'user'@'127.0.0.1' (localhost → socket → 'user'@'localhost' causes Access denied)
  const normalizedUrl = connectionString.includes("localhost")
    ? connectionString.replace(/@localhost\b/, "@127.0.0.1")
    : connectionString;
  const u = new URL(normalizedUrl);
  const host = u.hostname === "localhost" ? "127.0.0.1" : u.hostname;
  const port = u.port ? parseInt(u.port, 10) : 3306;
  const database = u.pathname.replace(/^\//, "") || "expressfinloans";

  // Create our own pool with explicit 127.0.0.1 so express-mysql-session doesn't use localhost/socket
  const sessionPool = mysql.createPool({
    host,
    port,
    user: u.username,
    password: u.password,
    database,
  });

  const expressMysqlSession = await import("express-mysql-session");
  const MySQLStore = (expressMysqlSession.default || expressMysqlSession)(session);
  // Pass our pool so the store uses TCP (127.0.0.1), not its own connection that may default to localhost
  const store = new MySQLStore(
    {
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 7 * 24 * 60 * 60 * 1000,
    },
    sessionPool as any
  );
  // Require DB session: if connection fails, throw
  if (typeof (store as any).onReady === "function") {
    await (store as any).onReady();
  }
  return store;
}
