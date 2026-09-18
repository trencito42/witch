import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { incidents, monitors, organizations, sites, subscriptions, users, visualDiffs, visualSnapshots } from "@/db/schema";
import { createSite } from "@/features/sites/service";
import { processMonitor } from "@/features/monitors/runner";
import { getPlanLimits } from "@/lib/plans";
import { findOrganizationsForUser } from "@/server/organizations";
import { server } from "./fixture-server";

const fixturePort = Number(process.env.FIXTURE_PORT ?? 3456);
const password = "E2ePassw0rd!";

async function ensureFixture() {
  if (!server.listening) {
    await new Promise<void>((resolve, reject) => {
      server.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") resolve();
        else reject(error);
      });
      server.listen(fixturePort, "127.0.0.1", () => resolve());
    });
  }
}

async function setFixture(state: string) {
  await fetch(`http://127.0.0.1:${fixturePort}/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state }),
  });
}

async function runMonitors(siteId: string) {
  const rows = await db.select().from(monitors).where(eq(monitors.siteId, siteId));
  for (const monitor of rows) {
    await processMonitor(monitor.id, "e2e");
  }
}

async function main() {
  process.env.FIXTURE_ENABLED = "true";
  await ensureFixture();
  await setFixture("healthy");

  const email = `e2e-pipeline-${Date.now()}@witch.test`;
  const leftovers = await db.select().from(users);
  for (const row of leftovers.filter((item) => item.email.startsWith("e2e-pipeline-") || item.email.startsWith("e2e-tenancy-"))) {
    const owned = await findOrganizationsForUser(row.id);
    for (const org of owned) {
      await db.delete(organizations).where(eq(organizations.id, org.id));
    }
    await db.delete(users).where(eq(users.id, row.id));
  }
  await auth.api.signUpEmail({
    body: { email, password, name: "E2E Pipeline" },
  });
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error("signup did not create user");
  const orgs = await findOrganizationsForUser(user.id);
  const org = orgs[0];
  if (!org) throw new Error("signup did not create workspace");

  await db
    .update(subscriptions)
    .set({ planId: "agency_pro", status: "active", updatedAt: new Date() })
    .where(eq(subscriptions.organizationId, org.id));

  const ctx = {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    isAdmin: false,
    organizationId: org.id,
    organizationName: org.name,
    role: "OWNER" as const,
    plan: getPlanLimits("agency_pro"),
    subscriptionStatus: "active",
  };

  const siteId = await createSite(ctx, `http://127.0.0.1:${fixturePort}/`, "Fixture store");
  await runMonitors(siteId);

  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  const snaps = await db.select().from(visualSnapshots).where(eq(visualSnapshots.siteId, siteId));
  if (!site?.lastCheckedAt) throw new Error("HTTP/browser check did not persist lastCheckedAt");
  if (snaps.length < 2) throw new Error(`expected desktop+mobile snapshots, got ${snaps.length}`);

  await setFixture("missing-button");
  await runMonitors(siteId);
  const open = await db
    .select()
    .from(incidents)
    .where(eq(incidents.siteId, siteId));
  const live = open.filter((row) => row.status === "OPEN" || row.status === "ACKNOWLEDGED");
  if (!live.length) throw new Error("missing-button did not open an incident");
  const withDiff = live.find((row) => {
    const meta = row.metadata as { visualDiffId?: string } | null;
    return Boolean(meta?.visualDiffId);
  });
  const diffs = await db.select().from(visualDiffs).where(eq(visualDiffs.siteId, siteId));
  if (!diffs.length && !withDiff) {
    throw new Error("incident opened without visualDiffId or visual_diff row");
  }

  await setFixture("healthy");
  await runMonitors(siteId);
  await runMonitors(siteId);
  const after = await db.select().from(incidents).where(eq(incidents.siteId, siteId));
  const stillOpen = after.filter((row) => row.status === "OPEN" || row.status === "ACKNOWLEDGED");
  if (stillOpen.length) throw new Error("incident did not resolve after healthy recoveries");

  await db.delete(organizations).where(eq(organizations.id, org.id));
  await db.delete(users).where(eq(users.id, user.id));

  const result = {
    ok: true,
    siteId,
    snapshots: snaps.length,
    incidentId: live[0]?.id,
    visualDiffId: withDiff ? (withDiff.metadata as { visualDiffId?: string }).visualDiffId : diffs[0]?.id,
    resolved: true,
  };
  console.log(`E2E_PIPELINE_RESULT ${JSON.stringify(result)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
