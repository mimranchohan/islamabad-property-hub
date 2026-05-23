import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

// PATCH — update own profile (email, name, password)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!session || user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const admin = await prisma.user.findUnique({ where: { id: user.id } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, string> = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email && email.trim()) {
      // Check email not taken by another user
      const existing = await prisma.user.findFirst({ where: { email: email.trim(), NOT: { id: user.id } } });
      if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      updateData.email = email.trim();
    }
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// POST — add new admin account (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as { role?: string } | undefined;
    if (!session || user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const newAdmin = await prisma.user.create({
      data: { name, email, password: hashed, role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, admin: newAdmin }, { status: 201 });
  } catch (err) {
    console.error("Add admin error:", err);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
