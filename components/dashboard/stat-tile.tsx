import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "emerald" | "sky" | "orange" | "red" | "neutral";

const TONES: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/15",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  neutral: "bg-muted text-muted-foreground ring-border",
};

/** KPI tile: icon, label, big value, one line of context underneath. */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "emerald",
  footnote,
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  footnote?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "bg-card flex h-full flex-col gap-3 rounded-xl border p-4 shadow-xs transition-all sm:p-5",
        href && "group-hover:border-foreground/20 group-hover:-translate-y-0.5 group-hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", TONES[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="text-muted-foreground mt-auto flex items-end justify-between gap-2 text-xs">
        <div>{footnote}</div>
        {href && (
          <ArrowRight
            className="text-muted-foreground size-4 shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden
          />
        )}
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      aria-label={`${label}: ${value}. Open`}
      className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
    >
      {body}
    </Link>
  ) : (
    body
  );
}
