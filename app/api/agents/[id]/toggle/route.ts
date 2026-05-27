import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";

// PATCH - toggle agent active status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Safety check: only agents can be toggled via this endpoint
  if (agent.role !== "AGENT") {
    return NextResponse.json({ error: "Forbidden: Only agent accounts can be toggled" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !agent.isActive },
  });

  return NextResponse.json({ isActive: updated.isActive });
}

// DELETE - remove agent (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Safety check: only agents can be soft-deleted via this endpoint
  if (agent.role !== "AGENT") {
    return NextResponse.json({ error: "Forbidden: Only agent accounts can be soft-deleted" }, { status: 403 });
  }

  // Soft delete - just deactivate
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
