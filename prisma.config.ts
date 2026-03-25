import fs from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

function readDotEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return {} as Record<string, string>;

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((acc, rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return acc;

      const separator = line.indexOf("=");
      if (separator < 0) return acc;

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

if (process.env.NODE_ENV !== "production") {
  const currentUrl = String(process.env.dashboard_DATABASE_URL || "");
  if (/neon\.tech/i.test(currentUrl)) {
    const localEnv = readDotEnvFile(path.join(process.cwd(), ".env"));
    const localUrl = String(localEnv.dashboard_DATABASE_URL || "");
    if (/(localhost|127\.0\.0\.1)/i.test(localUrl)) {
      process.env.dashboard_DATABASE_URL = localUrl;
      if (localEnv.dashboard_DATABASE_URL_UNPOOLED) {
        process.env.dashboard_DATABASE_URL_UNPOOLED =
          localEnv.dashboard_DATABASE_URL_UNPOOLED;
      }
    }
  }
}

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
