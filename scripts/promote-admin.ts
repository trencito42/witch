import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run promote-admin -- user@example.com");
  process.exit(1);
}

await db.update(users).set({ isAdmin: true, updatedAt: new Date() }).where(eq(users.email, email));
console.log(`promoted ${email} to admin`);
process.exit(0);
