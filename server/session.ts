import { createRequire } from "node:module";
import session from "express-session";
import type { Express } from "express";

const require = createRequire(import.meta.url);

const isProd = process.env.NODE_ENV === "production";
const secret = process.env.SESSION_SECRET || "express-finloans-staff-secret-change-in-production";

export function setupSession(app: Express) {
  const store = getSessionStore();
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

function getSessionStore(): session.Store {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && connectionString.startsWith("mysql")) {
    try {
      const MySQLStore = require("express-mysql-session")(session);
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
  const MemoryStore = require("memorystore")(session);
  return new MemoryStore({ checkPeriod: 86400000 });
}
