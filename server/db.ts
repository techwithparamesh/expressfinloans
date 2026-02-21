import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

function createDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for staff portal. Set it in .env or environment.");
  }
  const pool = mysql.createPool(connectionString);
  return drizzle(pool, { schema, mode: "default" });
}

export const db = connectionString ? createDb() : (null as ReturnType<typeof createDb> | null);
export const hasDb = !!connectionString;
