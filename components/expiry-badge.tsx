import { Badge } from "@/components/ui/badge";
import { cn, expiryLevel, expiryStatus, type ExpiryLevel } from "@/lib/utils";

/** Red = expired · orange = under 30 days · yellow = under 90 days · grey = OK */
export const EXPIRY_COLORS: Record<ExpiryLevel, string> = {
  expired: "bg-red-600 text-white border-transparent",
  critical: "bg-orange-500 text-white border-transparent",
  warning: "bg-yellow-300 text-yellow-950 border-transparent",
  ok: "bg-secondary text-secondary-foreground border-transparent",
};

export function expiryLabel(daysLeft: number) {
  if (daysLeft < -1) return `Expired ${-daysLeft} days ago`;
  if (daysLeft === -1) return "Expired yesterday";
  if (daysLeft === 0) return "Expires today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}

/** Pass `expiryDate`, or a precomputed `daysLeft` (e.g. from the aggregation). */
export function ExpiryBadge({
  expiryDate,
  daysLeft: given,
  className,
}: {
  expiryDate?: string;
  daysLeft?: number;
  className?: string;
}) {
  const daysLeft = given ?? expiryStatus(expiryDate!).daysLeft;
  const level = expiryLevel(daysLeft);
  return (
    <Badge variant="outline" className={cn(EXPIRY_COLORS[level], className)}>
      {level === "ok" ? "OK" : expiryLabel(daysLeft)}
    </Badge>
  );
}
