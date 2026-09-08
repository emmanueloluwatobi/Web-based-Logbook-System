import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env.local first, fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("Neither DIRECT_URL nor DATABASE_URL is defined for Drizzle migrations.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
