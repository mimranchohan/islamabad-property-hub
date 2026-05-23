import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity-logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { agent: { select: { name: true, phone: true, email: true, agencyName: true, website: true } } },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = session.user as { id?: string };
  await logActivity({
    agentId: user.id!,
    actionType: "VIEW_PROPERTY",
    propertyId: id,
    metadata: { propertyTitle: property.title },
  });

  return NextResponse.json(property);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = session.user as { id?: string; role?: string };
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "ADMIN" && property.agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.property.update({ where: { id }, data: body });

  await logActivity({
    agentId: user.id!,
    actionType: "EDIT_PROPERTY",
    propertyId: id,
    metadata: { changes: Object.keys(body) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = session.user as { id?: string; role?: string };
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "ADMIN" && property.agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logActivity({
    agentId: user.id!,
    actionType: "DELETE_PROPERTY",
    propertyId: id,
    metadata: { propertyTitle: property.title },
  });

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
