"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/logo";
import {
  Activity,
  Globe,
  ShieldAlert,
  FileText,
  Users,
  Settings,
  BookOpen,
  LogOut,
  ChevronDown,
  Menu,
  Check,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/sheet";
import { ToastProvider } from "@/components/ui/toast";

interface Org {
  id: string;
  name: string;
}

interface AppShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
  organizations: Org[];
  onSignOut: () => Promise<void>;
  onSwitchOrg: (orgId: string) => Promise<void>;
}

const primaryNav = [
  { href: "/overview", label: "Overview", icon: Activity },
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: FileText },
];

const secondaryNav = [
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
  organization,
  organizations,
  onSignOut,
  onSwitchOrg,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileMoreOpen, setMobileMoreOpen] = React.useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);
  const orgDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    if (orgDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [orgDropdownOpen]);

  // Close mobile sheet on path change
  React.useEffect(() => {
    setMobileMoreOpen(false);
  }, [pathname]);

  const initials = (user.name || user.email || "W")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
        {/* TIER 1: DESKTOP SIDEBAR (1024px and up: 240px) */}
        <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 sticky top-0 h-screen z-30 select-none">
          {/* Brand header */}
          <div className="flex items-center justify-between mb-5 px-2">
            <Link href="/overview" className="transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-md">
              <Wordmark />
            </Link>
          </div>

          {/* Workspace Switcher */}
          <div className="relative mb-6" ref={orgDropdownRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer touch-target focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
              aria-expanded={orgDropdownOpen}
              aria-label="Switch workspace"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                <span className="text-[13px] font-medium text-[var(--text)] truncate">
                  {organization.name}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0 ml-1" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-strong)] p-1.5 shadow-md">
                <div className="px-2 py-1 text-[11px] uppercase font-semibold text-[var(--text-faint)] tracking-wider">
                  Workspaces
                </div>
                {organizations.map((org) => (
                  <form
                    key={org.id}
                    action={() => {
                      setOrgDropdownOpen(false);
                      onSwitchOrg(org.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-2 text-[13px] rounded-lg transition-colors cursor-pointer touch-target",
                        org.id === organization.id
                          ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                      )}
                    >
                      <span className="truncate">{org.name}</span>
                      {org.id === organization.id && (
                        <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                      )}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>

          {/* Primary Navigation */}
          <div className="space-y-1 mb-6">
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
              Monitor
            </div>
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-colors touch-target",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1 mb-auto">
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
              Manage
            </div>
            {secondaryNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-colors touch-target",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            <Link
              href="/docs"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors touch-target"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Documentation</span>
            </Link>

            {/* Account & Sign out */}
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text-muted)] shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--text)] truncate">
                    {user.name || "User"}
                  </div>
                </div>
              </div>
              <form action={onSignOut}>
                <button
                  type="submit"
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--critical)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer touch-target"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* TIER 2: TABLET ICON RAIL (768px to 1023px: 72px) */}
        <aside className="hidden md:flex lg:hidden flex-col items-center w-[72px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] py-4 sticky top-0 h-screen z-30 select-none">
          <Link href="/overview" className="mb-6 p-2 transition-opacity hover:opacity-90" aria-label="Witch Overview">
            <Wordmark size="mobile" className="[&>span]:hidden" />
          </Link>

          {/* Primary Nav Icons */}
          <div className="space-y-2 mb-auto flex flex-col items-center w-full px-2">
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl transition-colors touch-target",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}

            <div className="w-6 h-[1px] bg-[var(--border)] my-2" />

            {secondaryNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl transition-colors touch-target",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>

          {/* Rail Footer */}
          <div className="flex flex-col items-center gap-3 pt-3 border-t border-[var(--border)] w-full">
            <form action={onSignOut}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-[var(--text-muted)] hover:text-[var(--critical)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer touch-target"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </aside>

        {/* MAIN VIEWPORT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TIER 3A: MOBILE SLIM TOP BAR (< 768px) with Workspace Switcher */}
          <header className="flex md:hidden items-center justify-between min-h-14 gap-3 px-4 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
            <Link href="/overview" className="shrink-0 transition-opacity hover:opacity-90">
              <Wordmark size="mobile" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMoreOpen(true)}
              className="flex items-center gap-1.5 max-w-[160px] truncate text-[13px] font-medium px-2.5 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] touch-target cursor-pointer"
              aria-label={`Current workspace: ${organization.name}. Tap to switch or view menu.`}
            >
              <Building2 className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
              <span className="truncate">{organization.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
            </button>
          </header>

          {/* PAGE CONTENT CONTAINER (Fluid, Centered, Max Width 1200px) */}
          <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
            {children}
          </main>

          {/* TIER 3B: MOBILE FIXED BOTTOM TAB BAR (< 768px) with safe-area insets */}
          <nav
            aria-label="Mobile navigation"
            className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 min-h-14 items-center justify-around border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
          >
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 py-1 text-[11px] font-medium rounded-lg transition-colors select-none min-w-0 touch-target",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileMoreOpen(true)}
              aria-label="Open management menu and workspace details"
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 py-1 text-[11px] font-medium rounded-lg transition-colors select-none cursor-pointer min-w-0 touch-target",
                mobileMoreOpen || pathname === "/team" || pathname === "/settings"
                  ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]",
              )}
            >
              <Menu className="h-4 w-4 shrink-0" />
              <span>More</span>
            </button>
          </nav>

          {/* MOBILE "MORE" SHEET DRAWER */}
          <Sheet open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
            <div className="space-y-6 pb-6">
              {/* Workspace details */}
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-2">
                  Active Workspace
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="h-4 w-4 text-[var(--accent)] shrink-0" />
                    <span className="text-[14px] font-medium text-[var(--text)] truncate">{organization.name}</span>
                  </div>
                </div>

                {organizations.length > 1 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1">
                      Switch Workspace
                    </div>
                    {organizations
                      .filter((o) => o.id !== organization.id)
                      .map((org) => (
                        <form
                          key={org.id}
                          action={() => {
                            setMobileMoreOpen(false);
                            onSwitchOrg(org.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="flex items-center justify-between w-full px-3 py-2.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-hover)] touch-target cursor-pointer"
                          >
                            <span className="truncate">Switch to {org.name}</span>
                          </button>
                        </form>
                      ))}
                  </div>
                )}
              </div>

              {/* Navigation links */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-2">
                  Management
                </div>
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors touch-target",
                        active
                          ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/docs"
                  onClick={() => setMobileMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors touch-target"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Documentation</span>
                </Link>
              </div>

              {/* User Account & Logout */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[12px] font-semibold text-[var(--text-muted)]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text)] truncate">
                        {user.name || "User"}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <form action={onSignOut}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--critical)] hover:bg-[var(--critical-dim)] transition-colors cursor-pointer touch-target"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </Sheet>
        </div>
      </div>
    </ToastProvider>
  );
}
