import React from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { DepartmentList, DepartmentItem } from "@/components/admin/DepartmentList";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentsPage() {
  const rawDepts = await db
    .select({
      id: schema.department.id,
      name: schema.department.name,
      code: schema.department.code,
      createdAt: schema.department.createdAt,
      programCount: sql<number>`count(${schema.program.id})::int`,
    })
    .from(schema.department)
    .leftJoin(schema.program, eq(schema.department.id, schema.program.departmentId))
    .groupBy(schema.department.id)
    .orderBy(schema.department.name);

  const formattedDepts: DepartmentItem[] = rawDepts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    createdAt: d.createdAt,
    programCount: d.programCount || 0,
  }));

  return <DepartmentList initialDepartments={formattedDepts} />;
}
