/**
 * Seed an admin user. Run with: npm run seed (or npx tsx script/seed-admin.ts)
 * Requires DATABASE_URL (set in .env or environment). Creates user admin / Admin@123 if not exists.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, hasDb } from "../server/db";
import { users } from "@shared/schema";
import { hashPassword } from "../server/lib/password";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "Admin@123";

async function seed() {
  if (!hasDb || !db) {
    console.error("DATABASE_URL is required. Set it in .env");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.username, DEFAULT_USERNAME));
  if (existing.length > 0) {
    console.log("Admin user already exists:", DEFAULT_USERNAME);
    process.exit(0);
  }

  const hashed = hashPassword(DEFAULT_PASSWORD);
  await db.insert(users).values({
    username: DEFAULT_USERNAME,
    password: hashed,
    role: "admin",
    fullName: "Administrator",
    email: null,
    phone: null,
  });

  console.log("Admin user created.");
  console.log("  Username:", DEFAULT_USERNAME);
  console.log("  Password:", DEFAULT_PASSWORD);
  console.log("  Log in at: /staff/login");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
