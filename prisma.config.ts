import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.js",
  },
  datasource: {
    url:
      process.env.dashboard_DATABASE_URL_UNPOOLED ||
      process.env.dashboard_DATABASE_URL ||
      "",
  },
});
