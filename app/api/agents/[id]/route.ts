import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sanitizeString, isValidEmail, isValidPassword, requireAdmin } from "@/lib/security";

// PATCH - edit an agent's details (name, email, phone, agency, website, password)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (agent.role !== "AGENT") {
    return NextResponse.json({ error: "Only agent accounts can be edited" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data: {
    name?: string;
    email?: string;
    phone?: string | null;
    agencyName?: string | null;
    website?: string | null;
    password?: string;
  } = {};

  if (body.name !== undefined) {
    const cleanName = sanitizeString(body.name, 100);
    if (!cleanName) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    data.name = cleanName;
  }

  if (body.email !== undefined) {
    const cleanEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isValidEmail(cleanEmail)) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    data.email = cleanEmail;
  }

  if (body.phone !== undefined) data.phone = sanitizeString(body.phone, 20) || null;
  if (body.agencyName !== undefined) data.agencyName = sanitizeString(body.agencyName, 200) || null;

  if (body.website !== undefined) {
    const cleanWebsite = sanitizeString(body.website, 200);
    if (cleanWebsite && !/^https?:\/\/.+/.test(cleanWebsite)) {
      return NextResponse.json({ error: "Website must start with http:// or https://" }, { status: 400 });
    }
    data.website = cleanWebsite || null;
  }

  // Password is optional — only update if a non-empty value is provided
  if (body.password) {
    const pw = isValidPassword(body.password);
    if (!pw.ok) return NextResponse.json({ error: pw.error }, { status: 400 });
    data.password = await bcrypt.hash(body.password, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, agencyName: true, website: true, isActive: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Agent PATCH error:", err);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

// DELETE - permanently remove an agent and all their properties/activity (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (agent.role !== "AGENT") {
    return NextResponse.json({ error: "Only agent accounts can be removed" }, { status: 403 });
  }

  try {
    await prisma.$transaction([
      prisma.activityLog.deleteMany({ where: { OR: [{ agentId: id }, { property: { agentId: id } }] } }),
      prisma.property.deleteMany({ where: { agentId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Agent DELETE error:", err);
    return NextResponse.json({ error: "Failed to remove agent" }, { status: 500 });
  }
}
