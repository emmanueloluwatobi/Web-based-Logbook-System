import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[lib/db] DATABASE_URL is not defined in the environment. Please configure it in your Vercel Project Settings."
  );
}

// Disable prepared statements for compatibility with Supabase transaction pooler (port 6543)
const client = postgres(
  connectionString || "postgresql://postgres:postgres@localhost:5432/postgres",
  { prepare: false }
);

export const db = drizzle(client, { schema });

