import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity-logger";

// GET - list properties (with filters)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const sector = searchParams.get("sector") || "";
  const propertyType = searchParams.get("type") || "";
  const purpose = searchParams.get("purpose") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minArea = searchParams.get("minArea");
  const maxArea = searchParams.get("maxArea");
  const bedrooms = searchParams.get("bedrooms");
  const agentId = searchParams.get("agentId");

  const user = session.user as { id?: string; role?: string };

  // Log search activity
  if (query || sector || propertyType) {
    await logActivity({
      agentId: user.id!,
      actionType: "SEARCH",
      metadata: { query, sector, propertyType, purpose, minPrice, maxPrice },
    });
  }

  const where: Record<string, unknown> = {};
  // agentId=me → filter to logged-in agent's own properties
  if (agentId === "me") {
    where.agentId = user.id;
  } else if (agentId) {
    where.agentId = agentId;
  }
  // Agents on explore (no agentId) see all active; on "my properties" (agentId=me) see all their own
  if (!agentId && user.role === "AGENT") where.status = "ACTIVE";
  if (sector) where.sector = { contains: sector };
  if (propertyType) where.propertyType = propertyType;
  if (purpose) where.purpose = purpose;
  if (bedrooms) where.bedrooms = parseInt(bedrooms);
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
    if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
  }
  if (minArea || maxArea) {
    where.areaSize = {};
    if (minArea) (where.areaSize as Record<string, number>).gte = parseFloat(minArea);
    if (maxArea) (where.areaSize as Record<string, number>).lte = parseFloat(maxArea);
  }
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { fullAddress: { contains: query } },
      { sector: { contains: query } },
      { description: { contains: query } },
    ];
  }

  const properties = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { name: true, phone: true, email: true, agencyName: true, website: true } } },
  });

  return NextResponse.json(properties);
}

// POST - create new property
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id?: string; role?: string; isActive?: boolean };
  if (user.role === "AGENT" && !user.isActive) {
    return NextResponse.json({ error: "Your account is not active" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title, description, propertyType, purpose, price, priceUnit,
    areaSize, areaUnit, bedrooms, bathrooms, floors, kitchens,
    sector, block, streetNo, fullAddress, latitude, longitude,
    images, features, furnishStatus,
  } = body;

  if (!title || !propertyType || !purpose || !price || !areaSize || !sector || !fullAddress) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const property = await prisma.property.create({
    data: {
      agentId: user.id!,
      title, description,
      propertyType, purpose,
      price: parseFloat(price),
      priceUnit: priceUnit || "PKR",
      areaSize: parseFloat(areaSize),
      areaUnit: areaUnit || "MARLA",
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      floors: floors ? parseInt(floors) : null,
      kitchens: kitchens ? parseInt(kitchens) : null,
      sector, block, streetNo, fullAddress,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      images: images ? JSON.stringify(images) : null,
      features: features ? JSON.stringify(features) : null,
      furnishStatus: furnishStatus || null,
    },
  });

  await logActivity({
    agentId: user.id!,
    actionType: "ADD_PROPERTY",
    propertyId: property.id,
    metadata: { title, sector, propertyType },
  });

  return NextResponse.json(property, { status: 201 });
}
