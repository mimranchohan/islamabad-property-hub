import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ISLAMABAD_SECTORS } from "@/lib/sectors-data";
import { sanitizeString } from "@/lib/security";

const VALID_ZONES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "R", "S", "T"];

// GET - list all sectors (requires auth)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sectors = await prisma.sector.findMany({ orderBy: [{ zone: "asc" }, { name: "asc" }] });
  return NextResponse.json(sectors);
}

// POST - add new sector (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = sanitizeString(body.name, 50);
  const zone = sanitizeString(body.zone, 5).toUpperCase();
  const city = sanitizeString(body.city, 50);

  if (!name) return NextResponse.json({ error: "Sector name required" }, { status: 400 });
  if (!zone) return NextResponse.json({ error: "Zone required" }, { status: 400 });

  try {
    const sector = await prisma.sector.create({
      data: { name, zone, city: city || "Islamabad" },
    });
    return NextResponse.json(sector, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sector already exists" }, { status: 409 });
  }
}

// DELETE - remove sector (admin only)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : null;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await prisma.sector.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Sector not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

// PATCH - toggle active status (admin only)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : null;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  if (typeof body?.isActive !== "boolean") return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });

  const sector = await prisma.sector.update({ where: { id }, data: { isActive: body.isActive } });
  return NextResponse.json(sector);
}

// PUT - seed from static data (admin only, once)
export async function PUT() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.sector.count();
  if (count > 0) return NextResponse.json({ message: "Already seeded", count });

  const sectors = await prisma.sector.createMany({
    data: ISLAMABAD_SECTORS.map((s) => ({ name: s.name, zone: s.zone, city: s.city })),
    skipDuplicates: true,
  });

  return NextResponse.json({ message: "Seeded successfully", count: sectors.count });
}
