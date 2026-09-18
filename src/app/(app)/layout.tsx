import Link from "next/link";
import { headers } from "next/headers";
import { LogoMark } from "@/components/logo";
import { requireOrgContext } from "@/server/tenancy";
import { findOrganizationsForUser } from "@/server/organizations";
import { actionSignOut, actionSwitchOrg } from "@/app/actions";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/overview", label: "Overview" },
  { href: "/sites", label: "Sites" },
  { href: "/incidents", label: "Incidents" },
  { href: "/reports", label: "Reports" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  const orgs = await findOrganizationsForUser(ctx.userId);
  const pathname = (await headers()).get("x-pathname") ?? "";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[208px] shrink-0 flex-col border-r border-[var(--border)] px-4 py-5 md:flex">
        <Link href="/overview" className="mb-8 flex items-center gap-2.5 px-1">
          <LogoMark className="h-[18px] w-[18px]" />
          <span className="text-[13px] font-medium tracking-[0.02em]">Witch</span>
        </Link>
        <nav className="space-y-0.5 text-[13px]">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-1 py-1.5",
                  active ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 px-1 pt-8 text-[12px] text-[var(--text-muted)]">
          <div className="text-[var(--text)]">{ctx.organizationName}</div>
          <OrgSwitcher orgs={orgs} current={ctx.organizationId} />
          <Link href="/docs" className="block hover:text-[var(--text)]">
            Documentation
          </Link>
          <div>{ctx.userName}</div>
          <form action={actionSignOut}>
            <button className="hover:text-[var(--text)]">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 md:hidden">
          <Link href="/overview" className="flex items-center gap-2">
            <LogoMark className="h-5 w-5" />
            <span className="text-[13px]">Witch</span>
          </Link>
          <Link href="/sites" className="text-[13px] text-[var(--text-muted)]">
            Sites
          </Link>
        </div>
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}

function OrgSwitcher({
  orgs,
  current,
}: {
  orgs: { id: string; name: string }[];
  current: string;
}) {
  if (orgs.length < 2) return null;
  return (
    <div className="space-y-1">
      {orgs.map((org) => (
        <form key={org.id} action={actionSwitchOrg.bind(null, org.id)}>
          <button
            className={cn(
              "block w-full text-left",
              org.id === current ? "text-[var(--text)]" : "hover:text-[var(--text)]",
            )}
          >
            {org.name}
          </button>
        </form>
      ))}
    </div>
  );
}
