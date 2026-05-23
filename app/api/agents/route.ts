import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { sanitizeString, isValidEmail, isValidPassword } from "@/lib/security";

// GET - list all agents (admin only)
export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true, name: true, email: true, phone: true,
      agencyName: true, website: true, isActive: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(agents);
}

// POST - create new agent (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, phone, agencyName, website, password } = body;

  const cleanName = sanitizeString(name, 100);
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPhone = sanitizeString(phone, 20);
  const cleanAgency = sanitizeString(agencyName, 200);

  if (!cleanName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!isValidEmail(cleanEmail)) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });

  const pwCheck = isValidPassword(password);
  if (!pwCheck.ok) return NextResponse.json({ error: pwCheck.error }, { status: 400 });

  // Validate website URL if provided
  const cleanWebsite = sanitizeString(website, 200);
  if (cleanWebsite && !/^https?:\/\/.+/.test(cleanWebsite)) {
    return NextResponse.json({ error: "Website must start with http:// or https://" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);

  const agent = await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || null,
      agencyName: cleanAgency || null,
      website: cleanWebsite || null,
      password: hashedPassword,
      role: "AGENT",
      isActive: false,
    },
  });

  return NextResponse.json({ id: agent.id, name: agent.name, email: agent.email }, { status: 201 });
}
