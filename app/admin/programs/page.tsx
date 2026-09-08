import React from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { ProgramList, ProgramItem, DeptOption } from "@/components/admin/ProgramList";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  const rawPrograms = await db
    .select({
      id: schema.program.id,
      name: schema.program.name,
      departmentId: schema.program.departmentId,
      departmentName: schema.department.name,
      departmentCode: schema.department.code,
    })
    .from(schema.program)
    .innerJoin(schema.department, eq(schema.program.departmentId, schema.department.id))
    .orderBy(schema.program.name);

  const rawDepts = await db
    .select({
      id: schema.department.id,
      name: schema.department.name,
      code: schema.department.code,
    })
    .from(schema.department)
    .orderBy(schema.department.name);

  const programs: ProgramItem[] = rawPrograms.map((p) => ({
    id: p.id,
    name: p.name,
    departmentId: p.departmentId,
    departmentName: p.departmentName,
    departmentCode: p.departmentCode,
  }));

  const departments: DeptOption[] = rawDepts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }));

  return <ProgramList initialPrograms={programs} departments={departments} />;
}
