import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ISLAMABAD_SECTORS } from "@/lib/sectors-data";

// Public API - returns active sectors for agents to use in forms
export async function GET() {
  try {
    const dbSectors = await prisma.sector.findMany({
      where: { isActive: true },
      orderBy: [{ zone: "asc" }, { name: "asc" }],
    });

    // If DB has no sectors, fallback to static list
    if (dbSectors.length === 0) {
      return NextResponse.json(ISLAMABAD_SECTORS);
    }

    return NextResponse.json(dbSectors);
  } catch {
    // On any error, return static data
    return NextResponse.json(ISLAMABAD_SECTORS);
  }
}
