import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** "← Parent page" link shown above a card, so every form has an obvious way back. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-muted-foreground flex w-fit items-center gap-1 text-sm hover:underline">
      <ArrowLeft className="size-4" /> {children}
    </Link>
  );
}
