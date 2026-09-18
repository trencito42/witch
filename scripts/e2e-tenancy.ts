import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { monitors, organizations, users, visualSnapshots } from "@/db/schema";
import { createSite } from "@/features/sites/service";
import { getPlanLimits } from "@/lib/plans";
import { findMembership, findOrganizationsForUser } from "@/server/organizations";
import { getStorage } from "@/storage";
import { newId } from "@/lib/ids";

const password = "E2ePassw0rd!";

async function signup(name: string) {
  const email = `e2e-tenancy-${name}-${Date.now()}@witch.test`;
  await auth.api.signUpEmail({ body: { email, password, name } });
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error(`missing user ${email}`);
  const orgs = await findOrganizationsForUser(user.id);
  if (!orgs[0]) throw new Error("missing org");
  return { user, org: orgs[0], email, password };
}

async function main() {
  const a = await signup("A");
  const b = await signup("B");
  const ctx = {
    userId: a.user.id,
    userEmail: a.user.email,
    userName: a.user.name,
    isAdmin: false,
    organizationId: a.org.id,
    organizationName: a.org.name,
    role: "OWNER" as const,
    plan: getPlanLimits("free"),
    subscriptionStatus: "active",
  };
  const siteId = await createSite(ctx, "https://example.com", "Tenant A site");
  const [monitor] = await db.select().from(monitors).where(eq(monitors.siteId, siteId)).limit(1);
  if (!monitor) throw new Error("missing monitor");
  const snapshotId = newId();
  const key = `${a.org.id}/${snapshotId}.webp`;
  await getStorage().put(key, Buffer.from("RIFF....WEBP"), "image/webp");
  await db.insert(visualSnapshots).values({
    id: snapshotId,
    organizationId: a.org.id,
    siteId,
    monitorId: monitor.id,
    checkId: null,
    viewport: "desktop",
    storageKey: key,
    contentType: "image/webp",
    byteSize: 12,
    width: 10,
    height: 10,
    isBaseline: true,
    createdAt: new Date(),
  });

  const aCan = await findMembership(a.user.id, a.org.id);
  const bCan = await findMembership(b.user.id, a.org.id);
  if (!aCan) throw new Error("owner A cannot see own org");
  if (bCan) throw new Error("user B leaked membership into org A");

  const base = process.env.PLAYWRIGHT_BASE_URL ?? "";
  const http: Record<string, number> = {};
  if (base) {
    const anon = await fetch(`${base}/api/media/snapshot/${snapshotId}`);
    http.anon = anon.status;
    const origin = process.env.BETTER_AUTH_URL || process.env.APP_URL || base;
    const signIn = await fetch(`${base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
        referer: `${origin}/login`,
      },
      body: JSON.stringify({ email: b.email, password }),
    });
    const cookieHeader = (signIn.headers.getSetCookie?.() ?? [])
      .map((part) => part.split(";")[0])
      .filter(Boolean)
      .join("; ");
    const denied = await fetch(`${base}/api/media/snapshot/${snapshotId}`, {
      headers: { cookie: cookieHeader },
    });
    http.signIn = signIn.status;
    http.crossTenant = denied.status;
    if (anon.status === 200 || denied.status === 200) {
      throw new Error(`media leaked: anon=${anon.status} cross=${denied.status}`);
    }
    if (signIn.status === 200 && denied.status !== 403 && denied.status !== 404) {
      throw new Error(`expected 403/404 for authenticated cross-tenant, got ${denied.status}`);
    }
  }

  await db.delete(organizations).where(eq(organizations.id, a.org.id));
  await db.delete(organizations).where(eq(organizations.id, b.org.id));
  await db.delete(users).where(eq(users.id, a.user.id));
  await db.delete(users).where(eq(users.id, b.user.id));

  console.log(
    `E2E_TENANCY_RESULT ${JSON.stringify({ ok: true, snapshotId, http, membershipDenied: !bCan })}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
