import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Session mode (port 5432) for migrations
    url: "postgresql://postgres.zagyoznuzwvcyqfycvqf:Emi240988%40%40%21@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
  },
});
