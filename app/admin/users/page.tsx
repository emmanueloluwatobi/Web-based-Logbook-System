import React from "react";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { UserList, StaffUserItem, DeptOption } from "@/components/admin/UserList";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const rawStaff = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      departmentId: schema.user.departmentId,
      departmentName: schema.department.name,
      departmentCode: schema.department.code,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .leftJoin(schema.department, eq(schema.user.departmentId, schema.department.id))
    .where(
      sql`${schema.user.role} IN ('school_supervisor', 'hod', 'admin')`
    )
    .orderBy(schema.user.name);

  const rawDepts = await db
    .select({
      id: schema.department.id,
      name: schema.department.name,
      code: schema.department.code,
    })
    .from(schema.department)
    .orderBy(schema.department.name);

  const users: StaffUserItem[] = rawStaff.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "admin" | "hod" | "school_supervisor",
    departmentId: u.departmentId,
    departmentName: u.departmentName,
    departmentCode: u.departmentCode,
    createdAt: u.createdAt,
  }));

  const departments: DeptOption[] = rawDepts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }));

  return (
    <UserList
      initialUsers={users}
      departments={departments}
      currentAdminId={session?.user?.id || ""}
    />
  );
}
