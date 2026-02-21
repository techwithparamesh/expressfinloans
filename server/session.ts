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
  if (connectionString && connectionString.startsWith("mysql")) {
    try {
      const expressMysqlSession = await import("express-mysql-session");
      const MySQLStore = (expressMysqlSession.default || expressMysqlSession)(session);
      const u = new URL(connectionString);
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
      return store;
    } catch {
      // fallback to memory if express-mysql-session fails
    }
  }
  const memorystore = await import("memorystore");
  const MemoryStore = (memorystore.default || memorystore)(session);
  return new MemoryStore({ checkPeriod: 86400000 });
}
