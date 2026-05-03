import "dotenv/config";
import { defineConfig } from "prisma/config";

// Turso için URL'e auth token ekle (CLI migrate için gerekli)
function buildUrl(): string {
  const base  = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const token = process.env.TURSO_AUTH_TOKEN;
  if (token && base.startsWith("libsql://")) {
    return `${base}?authToken=${token}`;
  }
  return base;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: buildUrl(),
  },
});
