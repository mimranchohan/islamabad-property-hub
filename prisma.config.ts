import { defineConfig } from "prisma/config";

// Prisma config does NOT auto-load .env — load it manually so
// DIRECT_URL / DATABASE_URL are available here (Node 20.12+ / 22 built-in).
try {
  process.loadEnvFile();
} catch {
  // .env not found or unsupported Node — env vars must already be set
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session mode (port 5432) for migrations — from env, never hardcoded
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
