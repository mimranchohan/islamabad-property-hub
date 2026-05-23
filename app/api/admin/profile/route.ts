import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

const SUPER_ADMIN_EMAIL = "changeyurstyle@gmail.com";

// PATCH — update own profile (name, email, password)
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

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 });
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      if (newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (name?.trim()) updateData.name = name.trim();
    if (email?.trim()) {
      const existing = await prisma.user.findFirst({ where: { email: email.trim(), NOT: { id: user.id } } });
      if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      updateData.email = email.trim();
    }
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12);

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

// POST — Add new admin (SUPER ADMIN ONLY)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { role?: string; isSuperAdmin?: boolean; email?: string } | undefined;

    // Only Super Admin can add admins
    if (!session || sessionUser?.role !== "ADMIN" || !sessionUser?.isSuperAdmin) {
      return NextResponse.json({ error: "Sirf Super Admin naya admin add kar sakta hai" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const newAdmin = await prisma.user.create({
      data: { name, email, password: hashed, role: "ADMIN", isActive: true, isSuperAdmin: false },
      select: { id: true, name: true, email: true, role: true, isSuperAdmin: true },
    });

    return NextResponse.json({ success: true, admin: newAdmin }, { status: 201 });
  } catch (err) {
    console.error("Add admin error:", err);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

// DELETE — Remove admin (SUPER ADMIN ONLY)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { role?: string; isSuperAdmin?: boolean } | undefined;

    if (!session || sessionUser?.role !== "ADMIN" || !sessionUser?.isSuperAdmin) {
      return NextResponse.json({ error: "Sirf Super Admin admin remove kar sakta hai" }, { status: 403 });
    }

    const body = await req.json();
    const { adminId } = body;
    if (!adminId) return NextResponse.json({ error: "adminId required" }, { status: 400 });

    // Cannot delete Super Admin itself
    const target = await prisma.user.findUnique({ where: { id: adminId } });
    if (!target) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    if (target.isSuperAdmin) return NextResponse.json({ error: "Super Admin ko delete nahi kar sakte" }, { status: 400 });
    if (target.email === SUPER_ADMIN_EMAIL) return NextResponse.json({ error: "Super Admin ko delete nahi kar sakte" }, { status: 400 });

    await prisma.user.delete({ where: { id: adminId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete admin error:", err);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
