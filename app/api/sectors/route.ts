import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ISLAMABAD_SECTORS } from "@/lib/sectors-data";

// GET - list all sectors from DB (fallback to static if DB empty)
export async function GET() {
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

  const { name, zone, city } = await req.json();
  if (!name || !zone) return NextResponse.json({ error: "Name and zone required" }, { status: 400 });

  try {
    const sector = await prisma.sector.create({
      data: { name: name.trim(), zone: zone.trim(), city: city?.trim() || "Islamabad" },
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

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.sector.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH - toggle active status
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, isActive } = await req.json();
  const sector = await prisma.sector.update({ where: { id }, data: { isActive } });
  return NextResponse.json(sector);
}

// Seed helper - used once to populate DB from static data
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
