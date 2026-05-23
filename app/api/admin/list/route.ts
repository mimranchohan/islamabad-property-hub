import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - list all admins (Super Admin only)
export async function GET() {
  try {
    const session = await auth();
    const sessionUser = session?.user as { role?: string; isSuperAdmin?: boolean } | undefined;

    if (!session || sessionUser?.role !== "ADMIN" || !sessionUser?.isSuperAdmin) {
      return NextResponse.json({ error: "Super Admin only" }, { status: 403 });
    }

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
