import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Use session mode (port 5432) for seed — read from env, never hardcode
const SESSION_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!SESSION_URL) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const adapter = new PrismaPg({ connectionString: SESSION_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "changeyurstyle@gmail.com" },
    update: {
      role: "ADMIN",
      isActive: true,
      isSuperAdmin: true,
    },
    create: {
      email: "changeyurstyle@gmail.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      isActive: true,
      isSuperAdmin: true,
      agencyName: "Islamabad Property Hub",
    },
  });

  console.log("✅ Super Admin created:", admin.email);
  console.log("\n==========================================");
  console.log("📧 Login Email  : changeyurstyle@gmail.com");
  console.log("🔑 Password     : admin123");
  console.log("==========================================");
  console.log("⚠️  Change the password after first login!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
