import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@propertyhubishb.com" },
    update: {},
    create: {
      email: "admin@propertyhubishb.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "ADMIN",
      isActive: true,
      agencyName: "Islamabad Property Hub",
    },
  });

  console.log("✅ Admin created:", admin.email);
  console.log("\n==========================================");
  console.log("📧 Login Email  : admin@propertyhubishb.com");
  console.log("🔑 Password     : admin123");
  console.log("==========================================");
  console.log("⚠️  Change the password after first login!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
