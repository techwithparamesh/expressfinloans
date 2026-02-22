/**
 * Generate a password hash for use in MySQL (e.g. when setting admin password manually).
 * Run: npx tsx script/hash-password.ts <password>
 * Example: npx tsx script/hash-password.ts MySecurePass123
 * Or set ADMIN_PASSWORD in env and run without args.
 */
import { hashPassword } from "../server/lib/password";

const password = process.argv[2] || process.env.ADMIN_PASSWORD || "Admin@123";
console.log(hashPassword(password));
