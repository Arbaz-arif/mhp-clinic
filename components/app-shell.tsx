"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, LayoutDashboard, Menu, Pill, Settings, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExpiryBell } from "@/components/expiry-bell";
import { LogoutButton } from "@/components/logout-button";
import { SearchBar } from "@/components/search-bar";
import { initials } from "@/components/dashboard/follow-up-list";
import { cn } from "@/lib/utils";
import type { ExpiryAlert } from "@/lib/expiry";

type Alerts = { total: number; hasExpired: boolean; top: ExpiryAlert[] };

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/alerts", label: "Expiry Alerts", icon: AlertTriangle },
] as const;

/** Which sidebar item is highlighted. Visit pages belong to Patients. */
function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Visits and search results belong to Patients.
  if (href === "/patients") return ["/patients", "/visits", "/search", "/follow-ups"].some((p) => pathname.startsWith(p));
  return pathname.startsWith(href);
}

/**
 * Admin layout: fixed sidebar on large screens; on phones/tablets a top bar
 * with a menu button that opens the same sidebar as a drawer.
 */
export function AppShell({
  email,
  name,
  alerts,
  children,
}: {
  email: string;
  name?: string;
  alerts: Alerts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="bg-card sticky top-0 hidden h-dvh flex-col border-r lg:flex print:hidden">
        <SidebarContent pathname={pathname} email={email} name={name} alertCount={alerts.total} />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar (mobile: menu + brand; all sizes: alerts bell) */}
        <header className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:px-4 lg:px-8 print:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main menu</SheetDescription>
              <SidebarContent pathname={pathname} email={email} name={name} alertCount={alerts.total} />
            </SheetContent>
          </Sheet>
          {pathname === "/" ? (
            // Dashboard: search sits in the page's action row instead, so only the brand here (phones).
            <Link href="/" className="flex items-center gap-2 font-semibold lg:hidden">
              <Stethoscope className="text-primary size-5" /> MHP Clinic
            </Link>
          ) : (
            // Every other page: the search lives in the top bar.
            <Suspense fallback={<div className="h-10 min-w-0 flex-1 md:max-w-md" />}>
              <SearchBar className="flex-1 md:max-w-md" />
            </Suspense>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ExpiryBell total={alerts.total} hasExpired={alerts.hasExpired} top={alerts.top} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  email,
  name,
  alertCount,
}: {
  pathname: string;
  email: string;
  name?: string;
  alertCount: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex h-14 shrink-0 items-center gap-2 border-b px-5 font-semibold">
        <Stethoscope className="text-primary size-5" /> MHP Clinic
      </Link>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main">
        <ul className="grid gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors lg:py-2",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {href === "/alerts" && alertCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                        active ? "bg-primary-foreground text-primary" : "bg-orange-500 text-white",
                      )}
                    >
                      {alertCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-1 border-t p-3">
        {/* Who is signed in */}
        <div className="flex items-center gap-3 px-3 pt-1 pb-2">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700"
            aria-hidden
          >
            {initials(name || email)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{name || "Doctor"}</span>
            <span className="text-muted-foreground block truncate text-xs" title={email}>
              {email}
            </span>
          </span>
        </div>
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors lg:py-2",
            pathname.startsWith("/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" /> Settings
        </Link>
        <LogoutButton email={email} />
      </div>
    </div>
  );
}
