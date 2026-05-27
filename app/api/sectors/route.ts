import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ISLAMABAD_SECTORS } from "@/lib/sectors-data";
import { sanitizeString, requireAuth, requireAdmin } from "@/lib/security";

const VALID_ZONES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "R", "S", "T"];

// GET - list all sectors (requires auth)
export async function GET() {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;

  const sectors = await prisma.sector.findMany({ orderBy: [{ zone: "asc" }, { name: "asc" }] });
  return NextResponse.json(sectors);
}

// POST - add new sector (admin only)
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = sanitizeString(body.name, 50);
  const zone = sanitizeString(body.zone, 5).toUpperCase();
  const city = sanitizeString(body.city, 50);

  if (!name) return NextResponse.json({ error: "Sector name required" }, { status: 400 });
  if (!zone || !VALID_ZONES.includes(zone)) return NextResponse.json({ error: "Valid zone required (A-T)" }, { status: 400 });

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
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

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
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : null;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  if (typeof body?.isActive !== "boolean") return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });

  try {
    const sector = await prisma.sector.update({ where: { id }, data: { isActive: body.isActive } });
    return NextResponse.json(sector);
  } catch {
    return NextResponse.json({ error: "Sector not found" }, { status: 404 });
  }
}

// PUT - seed from static data (admin only, once)
export async function PUT() {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const count = await prisma.sector.count();
  if (count > 0) return NextResponse.json({ message: "Already seeded", count });

  const sectors = await prisma.sector.createMany({
    data: ISLAMABAD_SECTORS.map((s) => ({ name: s.name, zone: s.zone, city: s.city })),
    skipDuplicates: true,
  });

  return NextResponse.json({ message: "Seeded successfully", count: sectors.count });
}
