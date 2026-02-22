/**
 * Verify that a plain password matches the hash stored in the DB for a user.
 * Run: npx tsx script/verify-password.ts <username> <password>
 * Example: npx tsx script/verify-password.ts Expressadmin YourPassword
 * Requires DATABASE_URL in .env
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, hasDb } from "../server/db";
import { users } from "@shared/schema";
import { verifyPassword } from "../server/lib/password";

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error("Usage: npx tsx script/verify-password.ts <username> <password>");
    process.exit(1);
  }

  if (!hasDb || !db) {
    console.error("DATABASE_URL is required. Set it in .env");
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user) {
    console.error("User not found:", username);
    process.exit(1);
  }

  const stored = user.password;
  if (!stored || !stored.includes(":")) {
    console.error("Stored password does not look like a valid hash (expected format: salt:hash).");
    process.exit(1);
  }

  const matches = verifyPassword(password, stored);
  if (matches) {
    console.log("Password MATCHES. This password will work for login.");
  } else {
    console.log("Password does NOT match. The hash in the DB was not generated from this password.");
    console.log("Either use the correct password, or set a new one (generate hash and UPDATE users).");
  }
  process.exit(matches ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
