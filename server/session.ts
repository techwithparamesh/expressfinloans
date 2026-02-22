import session from "express-session";
import type { Express } from "express";

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
  // Force TCP so MySQL uses 'user'@'127.0.0.1' (localhost often uses socket → 'user'@'localhost')
  const normalizedUrl = connectionString.includes("localhost")
    ? connectionString.replace(/@localhost\b/, "@127.0.0.1")
    : connectionString;
  const expressMysqlSession = await import("express-mysql-session");
  const MySQLStore = (expressMysqlSession.default || expressMysqlSession)(session);
  const u = new URL(normalizedUrl);
  const store = new MySQLStore({
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, "") || "expressfinloans",
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 7 * 24 * 60 * 60 * 1000,
  });
  // Require DB session: if connection fails, throw so we don't fall back to memory
  if (typeof (store as any).onReady === "function") {
    await (store as any).onReady();
  }
  return store;
}
