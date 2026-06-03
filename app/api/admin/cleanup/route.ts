import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronSecret } from "@/lib/security";

/**
 * GET /api/admin/cleanup
 * Deletes ActivityLog entries older than 90 days.
 * Called by Vercel Cron — protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { count } = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({
      success: true,
      deleted: count,
      cutoffDate: cutoff.toISOString(),
      message: `Cleaned up ${count} old activity log entries`,
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
