import "server-only";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // RUNTIME must use the TRANSACTION pooler (port 6543, ?pgbouncer=true) via
  // DATABASE_URL — it is built for serverless (many short-lived connections).
  // DIRECT_URL is the SESSION pooler (port 5432) capped at 15 clients; using it
  // in serverless exhausts the pool → EMAXCONNSESSION. Keep DIRECT_URL for
  // migrations/seed only.
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL!;
  // Cap connections per serverless instance so we never overwhelm the pooler.
  const adapter = new PrismaPg({ connectionString, max: 1 });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
