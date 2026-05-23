import { PrismaClient } from "../../generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` });
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
