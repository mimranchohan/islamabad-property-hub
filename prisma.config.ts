import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session mode (port 5432) for migrations — read from env, never hardcode
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
