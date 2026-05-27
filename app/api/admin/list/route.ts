import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/security";

// GET - list all admins (Super Admin only)
export async function GET() {
  try {
    const user = await requireSuperAdmin();
    if (user instanceof NextResponse) return user;

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: [{ isSuperAdmin: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true, email: true, isSuperAdmin: true, createdAt: true },
    });

    return NextResponse.json(admins);
  } catch (err) {
    console.error("Admin list error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
