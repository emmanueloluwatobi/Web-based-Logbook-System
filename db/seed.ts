import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import * as schema from "./schema";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing connection string (DIRECT_URL or DATABASE_URL) for seeding.");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Starting database seed...");

  // 1. Department
  let [dept] = await db
    .select()
    .from(schema.department)
    .where(eq(schema.department.code, "CSC"))
    .limit(1);

  if (!dept) {
    console.log("Creating default department (Computer Science)...");
    const [insertedDept] = await db
      .insert(schema.department)
      .values({
        name: "Computer Science",
        code: "CSC",
      })
      .returning();
    dept = insertedDept;
  } else {
    console.log(`Department already exists: ${dept.name} (${dept.code})`);
  }

  // 2. Program
  let [prog] = await db
    .select()
    .from(schema.program)
    .where(
      and(
        eq(schema.program.departmentId, dept.id),
        eq(schema.program.name, "B.Sc Computer Science"),
      ),
    )
    .limit(1);

  if (!prog) {
    console.log("Creating default program (B.Sc Computer Science)...");
    const [insertedProg] = await db
      .insert(schema.program)
      .values({
        departmentId: dept.id,
        name: "B.Sc Computer Science",
      })
      .returning();
    prog = insertedProg;
  } else {
    console.log(`Program already exists: ${prog.name}`);
  }

  // 3. Academic Session
  let [session] = await db
    .select()
    .from(schema.academicSession)
    .where(eq(schema.academicSession.label, "2025/2026"))
    .limit(1);

  if (!session) {
    console.log("Creating active academic session (2025/2026)...");
    const [insertedSession] = await db
      .insert(schema.academicSession)
      .values({
        label: "2025/2026",
        isActive: true,
      })
      .returning();
    session = insertedSession;
  } else {
    console.log(`Academic session already exists: ${session.label} (active: ${session.isActive})`);
  }

  // 4. Admin User & Account
  const adminEmail = "admin@siwes.edu.ng";
  const adminPassword = "ChangeMe123!";

  let [adminUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, adminEmail))
    .limit(1);

  if (!adminUser) {
    console.log(`Creating Admin user (${adminEmail})...`);
    const newUserId = crypto.randomUUID();
    const [createdUser] = await db
      .insert(schema.user)
      .values({
        id: newUserId,
        name: "System Administrator",
        email: adminEmail,
        emailVerified: true,
        role: "admin",
        departmentId: null, // Admin is university-wide
      })
      .returning();
    adminUser = createdUser;

    const hashedPassword = await hashPassword(adminPassword);
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      issuer: "local:credential",
      password: hashedPassword,
    });
    console.log(`Admin user and credential account created.`);
  } else {
    console.log(`Admin user already exists: ${adminUser.email} (role: ${adminUser.role})`);
    // Ensure existing accounts have issuer set for Better Auth 1.7.2
    await db
      .update(schema.account)
      .set({ issuer: "local:credential" })
      .where(eq(schema.account.userId, adminUser.id));
  }

  console.log("✅ Database seed completed successfully!");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
