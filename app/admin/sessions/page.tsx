import React from "react";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { SessionList, SessionItem } from "@/components/admin/SessionList";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const rawSessions = await db
    .select()
    .from(schema.academicSession)
    .orderBy(desc(schema.academicSession.isActive), schema.academicSession.label);

  const sessions: SessionItem[] = rawSessions.map((s) => ({
    id: s.id,
    label: s.label,
    isActive: s.isActive,
  }));

  return <SessionList initialSessions={sessions} />;
}
