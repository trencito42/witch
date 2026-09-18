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
        {/* DESKTOP FLOATING SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[232px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-elevated)]/40 p-4 sticky top-0 h-screen z-30 select-none">
          {/* Brand header */}
          <div className="flex items-center justify-between mb-5 px-2">
            <Link href="/overview" className="transition-opacity hover:opacity-90">
              <Wordmark />
            </Link>
          </div>

          {/* Workspace Switcher */}
          <div className="relative mb-6" ref={orgDropdownRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]/70 hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="text-[12px] font-medium text-[var(--text)] truncate">
                  {organization.name}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-40 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] p-1 shadow-xl animate-in fade-in duration-100">
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-[var(--text-faint)] tracking-wider">
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
                        "flex items-center justify-between w-full px-2 py-1.5 text-[12px] rounded-md transition-colors cursor-pointer",
                        org.id === organization.id
                          ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium"
                          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                      )}
                    >
                      <span className="truncate">{org.name}</span>
                      {org.id === organization.id && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>

          {/* Primary Navigation */}
          <div className="space-y-1 mb-6">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider">
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
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold shadow-[0_0_12px_var(--accent-dim)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text)]",
                    )}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1 mb-auto">
            <div className="px-2 pb-1 text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider">
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
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                    active
                      ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text)]",
                    )}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-[var(--border)] space-y-3">
            <Link
              href="/docs"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Documentation</span>
            </Link>

            {/* Account & Sign out */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-strong)] text-[11px] font-semibold text-[var(--text-muted)] shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[var(--text)] truncate">
                    {user.name || "User"}
                  </div>
                </div>
              </div>
              <form action={onSignOut}>
                <button
                  type="submit"
                  title="Sign out"
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--critical)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* MOBILE TOP BAR */}
          <header className="flex lg:hidden items-center justify-between min-h-14 gap-3 px-4 border-b border-[var(--border)]/60 bg-[var(--bg)] sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
            <Link href="/overview" className="shrink-0 transition-opacity hover:opacity-90">
              <Wordmark size="mobile" />
            </Link>

            <div className="flex min-w-0 items-center justify-end">
              <span className="block max-w-[120px] truncate text-[12px] px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]">
                {organization.name}
              </span>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
            {children}
          </main>

          {/* MOBILE FIXED BOTTOM NAVIGATION */}
          <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 z-40 min-h-14 items-end justify-around border-t border-[var(--border)]/60 bg-[var(--bg)] px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom,0px))]">
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-12 flex-1 gap-0.5 py-1 text-[11px] font-medium transition-colors select-none min-w-0",
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileMoreOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center min-h-12 flex-1 gap-0.5 py-1 text-[11px] font-medium transition-colors select-none cursor-pointer min-w-0",
                mobileMoreOpen || pathname === "/team" || pathname === "/settings"
                  ? "text-[var(--accent)]"
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
                <div className="text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider mb-2">
                  Active Workspace
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-[13px] font-medium truncate">{organization.name}</span>
                  </div>
                </div>

                {organizations.length > 1 && (
                  <div className="mt-2 space-y-1">
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
                            className="flex items-center justify-between w-full px-3 py-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] rounded-md hover:bg-[var(--bg-hover)]"
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
                <div className="text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider mb-2">
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
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                        active
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Documentation</span>
                </Link>
              </div>

              {/* User Account & Logout */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-strong)] text-[12px] font-semibold text-[var(--text-muted)]">
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium text-[var(--critical)] hover:bg-[var(--critical-dim)] transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
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
