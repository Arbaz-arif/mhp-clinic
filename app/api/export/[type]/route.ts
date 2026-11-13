import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { buildExport, EXPORT_TYPES, type ExportType } from "@/lib/export";
import { todayPK } from "@/lib/utils";

/**
 * GET /api/export/patients | visits | medicines → CSV download.
 * The proxy already requires a session; this checks again so the route is safe on its own.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await ctx.params;
  if (!EXPORT_TYPES.includes(type as ExportType)) {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  const csv = await buildExport(type as ExportType);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mhp-${type}-${todayPK()}.csv"`,
      "Cache-Control": "no-store", // patient data: never cache
    },
  });
}
