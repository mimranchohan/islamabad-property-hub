import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-backup endpoint — called by Vercel Cron (or manually triggered)
// Vercel cron.json will call this every 24h
export async function GET() {
  try {
    // Check if backup already done in last 23 hours (prevent duplicates)
    const lastAutoBackup = await prisma.backup.findFirst({
      where: { type: "AUTO" },
      orderBy: { createdAt: "desc" },
    });

    if (lastAutoBackup) {
      const hoursSinceLast = (Date.now() - new Date(lastAutoBackup.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 23) {
        return NextResponse.json({ message: "Backup already done recently", hoursSinceLast: Math.round(hoursSinceLast) });
      }
    }

    // Collect all data
    const [agents, properties, sectors] = await Promise.all([
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.property.count(),
      prisma.sector.count(),
    ]);

    const filename = `auto-backup-${new Date().toISOString().slice(0, 10)}.json`;

    await prisma.backup.create({
      data: {
        filename,
        type: "AUTO",
        sizeBytes: 0,
        agentCount: agents,
        propertyCount: properties,
        sectorCount: sectors,
        notes: "Automatic daily backup record",
      },
    });

    return NextResponse.json({ success: true, message: "Auto backup recorded", counts: { agents, properties, sectors } });
  } catch (err) {
    console.error("Auto backup error:", err);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
