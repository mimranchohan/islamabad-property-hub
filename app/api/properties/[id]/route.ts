import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity-logger";
import { sanitizeString, safeFloat, safeInt } from "@/lib/security";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

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
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = session.user as { id?: string; role?: string };
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "ADMIN" && property.agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // ✅ SECURITY FIX: Whitelist only allowed fields — no mass assignment
  const allowedFields = [
    "title", "description", "propertyType", "purpose", "price", "priceUnit",
    "areaSize", "areaUnit", "bedrooms", "bathrooms", "floors", "kitchens",
    "sector", "block", "streetNo", "fullAddress", "latitude", "longitude",
    "images", "features", "furnishStatus", "status",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (!(field in body)) continue;
    const val = body[field];
    // Sanitize strings
    if (["title", "sector", "block", "streetNo", "fullAddress", "furnishStatus", "priceUnit", "areaUnit", "status", "propertyType", "purpose"].includes(field)) {
      updateData[field] = sanitizeString(val, 500);
    } else if (["description"].includes(field)) {
      updateData[field] = sanitizeString(val, 5000);
    } else if (["price", "areaSize", "latitude", "longitude"].includes(field)) {
      const n = safeFloat(val);
      if (n !== null) updateData[field] = n;
    } else if (["bedrooms", "bathrooms", "floors", "kitchens"].includes(field)) {
      const n = safeInt(val);
      updateData[field] = n;
    } else if (field === "images" || field === "features") {
      updateData[field] = Array.isArray(val) ? JSON.stringify(val) : val;
    }
  }

  // Agents can't change agentId or role
  // Agents can only update status to ACTIVE/INACTIVE/SOLD/RENTED (not arbitrary)
  if (updateData.status && !["ACTIVE", "INACTIVE", "SOLD", "RENTED"].includes(String(updateData.status))) {
    delete updateData.status;
  }

  const updated = await prisma.property.update({ where: { id }, data: updateData });

  await logActivity({
    agentId: user.id!,
    actionType: "EDIT_PROPERTY",
    propertyId: id,
    metadata: { changes: Object.keys(updateData) },
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
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

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
