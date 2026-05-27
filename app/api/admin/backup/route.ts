import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";

// GET - list all backup records
export async function GET() {
  try {
    const user = await requireAdmin();
    if (user instanceof NextResponse) return user;

    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(backups);
  } catch (err) {
    console.error("Backup GET error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - create a backup snapshot + return JSON for download
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (user instanceof NextResponse) return user;

    const body = await req.json().catch(() => ({}));
    const type = body.type || "MANUAL";
    const notes = body.notes || "";

    // Collect all data
    const [agents, properties, sectors, activityLogs] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, email: true, name: true, phone: true,
          role: true, agencyName: true, website: true,
          isActive: true, createdAt: true,
        },
      }),
      prisma.property.findMany({
        include: { agent: { select: { name: true, email: true } } },
      }),
      prisma.sector.findMany(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 1000,
        include: { agent: { select: { name: true } } },
      }),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      platform: "Islamabad Property Hub",
      counts: {
        agents: agents.length,
        properties: properties.length,
        sectors: sectors.length,
        activityLogs: activityLogs.length,
      },
      data: { agents, properties, sectors, activityLogs },
    };

    const json = JSON.stringify(backupData, null, 2);
    const sizeBytes = Buffer.byteLength(json, "utf8");
    const filename = `backup-${type.toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, "-")}.json`;

    // Save backup record to DB (non-blocking — don't fail download if this fails)
    try {
      await prisma.backup.create({
        data: {
          filename,
          type,
          sizeBytes,
          agentCount: agents.length,
          propertyCount: properties.length,
          sectorCount: sectors.length,
          notes,
        },
      });
    } catch (dbErr) {
      console.error("Could not save backup record:", dbErr);
    }

    // Return as downloadable JSON file
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Backup POST error:", err);
    return NextResponse.json({ error: "Backup generation failed" }, { status: 500 });
  }
}
