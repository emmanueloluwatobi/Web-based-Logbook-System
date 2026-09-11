import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  department,
  placement,
  studentProfile,
  user,
  program,
  organization,
} from "@/db/schema";
import {
  HodStudentRoster,
  type HodStudentItem,
} from "@/components/hod/HodStudentRoster";

export const metadata: Metadata = {
  title: "Department Students — ULS EKSU SIWES",
  description: "Manage student placements and supervisor assignments for the department.",
};

export const dynamic = "force-dynamic";

export default async function HodStudentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "hod" && session.user.role !== "admin") {
    redirect("/");
  }

  const departmentId = session.user.departmentId;

  if (!departmentId && session.user.role !== "admin") {
    return (
      <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl">
        <h2 className="font-heading font-semibold text-error text-lg">No Department Assigned</h2>
        <p className="text-sm text-on-surface-variant mt-2">
          Your account is not attached to any academic department. Please contact the administrator.
        </p>
      </div>
    );
  }

  // Fetch department name
  let departmentName = "Department";
  if (departmentId) {
    const [dept] = await db
      .select({ name: department.name })
      .from(department)
      .where(eq(department.id, departmentId))
      .limit(1);
    if (dept?.name) departmentName = dept.name;
  }

  // 1. Fetch all students in this department
  const studentRows = departmentId
    ? await db
        .select({
          profileId: studentProfile.id,
          userId: user.id,
          studentName: user.name,
          email: user.email,
          matricNumber: studentProfile.matricNumber,
          programId: studentProfile.programId,
          level: studentProfile.level,
        })
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .where(eq(user.departmentId, departmentId))
    : [];

  const studentProfileIds = studentRows.map((s) => s.profileId);

  // 2. Fetch programs in this department
  const programRows = departmentId
    ? await db
        .select({ id: program.id, name: program.name })
        .from(program)
        .where(eq(program.departmentId, departmentId))
    : [];
  const programMap = new Map(programRows.map((p) => [p.id, p.name]));

  // 3. Fetch placements for these students
  const placementRows =
    studentProfileIds.length > 0
      ? await db
          .select({
            id: placement.id,
            studentId: placement.studentId,
            status: placement.status,
            organizationId: placement.organizationId,
            schoolSupervisorId: placement.schoolSupervisorId,
            createdAt: placement.createdAt,
          })
          .from(placement)
          .where(inArray(placement.studentId, studentProfileIds))
      : [];

  // Collect unique org IDs and supervisor IDs
  const orgIds = [
    ...new Set(placementRows.map((p) => p.organizationId).filter(Boolean) as string[]),
  ];
  const supervisorIds = [
    ...new Set(
      placementRows.map((p) => p.schoolSupervisorId).filter(Boolean) as string[]
    ),
  ];

  // 4. Fetch organization names
  const orgRows =
    orgIds.length > 0
      ? await db
          .select({ id: organization.id, name: organization.name })
          .from(organization)
          .where(inArray(organization.id, orgIds))
      : [];
  const orgMap = new Map(orgRows.map((o) => [o.id, o.name]));

  // 5. Fetch supervisor names
  const supervisorRows =
    supervisorIds.length > 0
      ? await db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, supervisorIds))
      : [];
  const supervisorMap = new Map(supervisorRows.map((s) => [s.id, s.name]));

  // 6. Map each student to HodStudentItem
  // Group placements by studentId (prioritizing active, then pending, then completed)
  const studentPlacementMap = new Map<string, (typeof placementRows)[0]>();
  for (const p of placementRows) {
    const existing = studentPlacementMap.get(p.studentId);
    if (!existing) {
      studentPlacementMap.set(p.studentId, p);
    } else {
      // Prioritize active > pending > completed
      const priority = { active: 3, pending: 2, completed: 1 };
      const existingScore = priority[existing.status as keyof typeof priority] || 0;
      const currentScore = priority[p.status as keyof typeof priority] || 0;
      if (currentScore > existingScore) {
        studentPlacementMap.set(p.studentId, p);
      }
    }
  }

  const students: HodStudentItem[] = studentRows.map((s) => {
    const p = studentPlacementMap.get(s.profileId);
    let placementStatus: HodStudentItem["placementStatus"] = "unplaced";
    if (p) {
      placementStatus = p.status as HodStudentItem["placementStatus"];
    }

    return {
      profileId: s.profileId,
      studentName: s.studentName,
      email: s.email,
      matricNumber: s.matricNumber,
      programName: s.programId ? programMap.get(s.programId) || null : null,
      level: s.level,
      placementStatus,
      placementId: p?.id || null,
      organizationName: p?.organizationId ? orgMap.get(p.organizationId) || null : null,
      supervisorName: p?.schoolSupervisorId
        ? supervisorMap.get(p.schoolSupervisorId) || null
        : null,
      supervisorId: p?.schoolSupervisorId || null,
    };
  });

  return <HodStudentRoster students={students} departmentName={departmentName} />;
}
