import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { sanitizeString, safeFloat, safeInt, requireAuth } from "@/lib/security";

const ALLOWED_TYPES = ["HOUSE","FLAT","APARTMENT","PLOT","COMMERCIAL_PLOT","OFFICE","SHOP","WAREHOUSE","FARM_HOUSE","PENTHOUSE","UPPER_PORTION","LOWER_PORTION","ROOM","STUDIO"];
const ALLOWED_PURPOSES = ["FOR_SALE", "FOR_RENT"];
const ALLOWED_PRICE_UNITS = ["PKR", "USD"];
const ALLOWED_AREA_UNITS = ["MARLA", "KANAL", "SQFT", "SQYD", "SQMETER"];

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(req.url);
  const query    = sanitizeString(searchParams.get("q") || "");
  const sector   = sanitizeString(searchParams.get("sector") || "");
  const propertyType = sanitizeString(searchParams.get("type") || "");
  const purpose  = sanitizeString(searchParams.get("purpose") || "");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minArea  = searchParams.get("minArea");
  const maxArea  = searchParams.get("maxArea");
  const bedrooms = searchParams.get("bedrooms");
  const agentId  = searchParams.get("agentId");

  if (query || sector || propertyType) {
    await logActivity({
      agentId: user.id!,
      actionType: "SEARCH",
      metadata: { query, sector, propertyType, purpose, minPrice, maxPrice },
    });
  }

  const where: Record<string, unknown> = {};

  if (agentId === "me") {
    where.agentId = user.id;
  } else if (agentId) {
    // Agents cannot view other agents' private listings (only admins)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    where.agentId = agentId;
  }

  if (!agentId && user.role === "AGENT") where.status = "ACTIVE";
  if (sector) where.sector = { contains: sector };
  if (propertyType && ALLOWED_TYPES.includes(propertyType)) where.propertyType = propertyType;
  if (purpose && ALLOWED_PURPOSES.includes(purpose)) where.purpose = purpose;

  const bedroomsInt = safeInt(bedrooms);
  if (bedroomsInt !== null) where.bedrooms = bedroomsInt;

  const minP = safeFloat(minPrice), maxP = safeFloat(maxPrice);
  if (minP !== null || maxP !== null) {
    where.price = {};
    if (minP !== null) (where.price as Record<string, number>).gte = minP;
    if (maxP !== null) (where.price as Record<string, number>).lte = maxP;
  }
  const minA = safeFloat(minArea), maxA = safeFloat(maxArea);
  if (minA !== null || maxA !== null) {
    where.areaSize = {};
    if (minA !== null) (where.areaSize as Record<string, number>).gte = minA;
    if (maxA !== null) (where.areaSize as Record<string, number>).lte = maxA;
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
    take: 500, // ✅ prevent unbounded queries
    include: { agent: { select: { name: true, phone: true, email: true, agencyName: true, website: true } } },
  });

  return NextResponse.json(properties);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const {
    title, description, propertyType, purpose, price, priceUnit,
    areaSize, areaUnit, bedrooms, bathrooms, floors, kitchens,
    sector, block, streetNo, fullAddress, latitude, longitude,
    images, features, furnishStatus,
  } = body;

  // ✅ Input validation
  const cleanTitle = sanitizeString(title, 200);
  const cleanSector = sanitizeString(sector, 100);
  const cleanAddress = sanitizeString(fullAddress, 500);
  const cleanDescription = sanitizeString(description, 5000);

  if (!cleanTitle || !propertyType || !purpose || !price || !areaSize || !cleanSector || !cleanAddress) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(propertyType)) return NextResponse.json({ error: "Invalid property type" }, { status: 400 });
  if (!ALLOWED_PURPOSES.includes(purpose)) return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });

  const priceVal = safeFloat(price);
  const areaSizeVal = safeFloat(areaSize);
  if (priceVal === null || priceVal < 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  if (areaSizeVal === null || areaSizeVal <= 0) return NextResponse.json({ error: "Invalid area size" }, { status: 400 });

  const property = await prisma.property.create({
    data: {
      agentId: user.id!,
      title: cleanTitle,
      description: cleanDescription || null,
      propertyType,
      purpose,
      price: priceVal,
      priceUnit: ALLOWED_PRICE_UNITS.includes(priceUnit) ? priceUnit : "PKR",
      areaSize: areaSizeVal,
      areaUnit: ALLOWED_AREA_UNITS.includes(areaUnit) ? areaUnit : "MARLA",
      bedrooms: safeInt(bedrooms),
      bathrooms: safeInt(bathrooms),
      floors: safeInt(floors),
      kitchens: safeInt(kitchens),
      sector: cleanSector,
      block: sanitizeString(block, 50) || null,
      streetNo: sanitizeString(streetNo, 50) || null,
      fullAddress: cleanAddress,
      latitude: safeFloat(latitude),
      longitude: safeFloat(longitude),
      images: Array.isArray(images) ? JSON.stringify(images) : null,
      features: Array.isArray(features) ? JSON.stringify(features) : null,
      furnishStatus: sanitizeString(furnishStatus, 50) || null,
    },
  });

  await logActivity({
    agentId: user.id!,
    actionType: "ADD_PROPERTY",
    propertyId: property.id,
    metadata: { title: cleanTitle, sector: cleanSector, propertyType },
  });

  return NextResponse.json(property, { status: 201 });
}
