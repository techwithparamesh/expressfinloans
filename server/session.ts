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
  // Force TCP: replace localhost with 127.0.0.1 in the URL so mysql2 doesn't use Unix socket.
  // (Socket connections are seen by MySQL as 'user'@'localhost'; TCP as 'user'@'127.0.0.1'.)
  const normalizedUrl = connectionString.includes("localhost")
    ? connectionString.replace(/@localhost\b/, "@127.0.0.1")
    : connectionString;

  // Single connection string for the pool so the host is unambiguous
  const sessionPool = mysql.createPool(normalizedUrl);

  const expressMysqlSession = await import("express-mysql-session");
  const MySQLStore = (expressMysqlSession.default || expressMysqlSession)(session);
  const store = new MySQLStore(
    {
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 7 * 24 * 60 * 60 * 1000,
    },
    sessionPool as any
  );
  if (typeof (store as any).onReady === "function") {
    await (store as any).onReady();
  }
  return store;
}
