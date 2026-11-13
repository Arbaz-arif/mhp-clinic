import { AppShell } from "@/components/app-shell";
import { getExpiryReport } from "@/lib/expiry";
import { requireAdmin } from "@/lib/session";

// Everything here reads live clinic data, so never prerender at build time.
export const dynamic = "force-dynamic";

const BELL_ITEMS = 8;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const report = await getExpiryReport();
  // Most urgent first: expired (oldest first), then soonest-expiring.
  const top = [...report.expired, ...report.expiring].slice(0, BELL_ITEMS);

  return (
    <AppShell email={session.email} name={session.name} alerts={{ total: report.counts.total, hasExpired: report.counts.expired > 0, top }}>
      {children}
    </AppShell>
  );
}
