import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

const rawUrl = process.env.DATABASE_URL;
// Use 127.0.0.1 instead of localhost so the driver connects via TCP and MySQL uses 'user'@'127.0.0.1'
const connectionString =
  rawUrl && rawUrl.includes("localhost") ? rawUrl.replace(/@localhost\b/, "@127.0.0.1") : rawUrl;

function createDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for staff portal. Set it in .env or environment.");
  }
  const pool = mysql.createPool(connectionString);
  return drizzle(pool, { schema, mode: "default" });
}

export const db = connectionString ? createDb() : (null as ReturnType<typeof createDb> | null);
export const hasDb = !!connectionString;
