import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  placement,
  organization,
  studentProfile,
  user,
  department,
} from "@/db/schema";
import {
  PlacementList,
  type PlacementRowItem,
  type SupervisorOption,
  type UnassignedStudentOption,
  type OrganizationOption,
} from "@/components/admin/PlacementList";

export const metadata: Metadata = {
  title: "SIWES Placements — EKSU SIWES Admin",
  description: "Manage student placements, verify self-secured submissions, and assign academic supervisors.",
};

export const dynamic = "force-dynamic";

export default async function AdminPlacementsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "hod") {
    redirect("/login");
  }

  // Aliases for multi-table joins on `user` and `department`
  const studentUser = alias(user, "student_user");
  const supervisorUser = alias(user, "supervisor_user");
  const studentDept = alias(department, "student_dept");

  // 1. Fetch all placements
  const rawPlacements = await db
    .select({
      id: placement.id,
      status: placement.status,
      placementSource: placement.placementSource,
      startDate: placement.startDate,
      endDate: placement.endDate,
      targetDays: placement.targetDays,
      studentProfileId: studentProfile.id,
      studentName: studentUser.name,
      studentEmail: studentUser.email,
      matricNumber: studentProfile.matricNumber,
      departmentName: studentDept.name,
      orgId: organization.id,
      orgName: organization.name,
      orgIndustry: organization.industryType,
      orgState: organization.stateRegion,
      orgAddress: organization.address,
      supervisorId: supervisorUser.id,
      supervisorName: supervisorUser.name,
      supervisorEmail: supervisorUser.email,
    })
    .from(placement)
    .innerJoin(studentProfile, eq(placement.studentId, studentProfile.id))
    .innerJoin(studentUser, eq(studentProfile.userId, studentUser.id))
    .leftJoin(studentDept, eq(studentUser.departmentId, studentDept.id))
    .innerJoin(organization, eq(placement.organizationId, organization.id))
    .leftJoin(supervisorUser, eq(placement.schoolSupervisorId, supervisorUser.id))
    .orderBy(desc(placement.startDate));

  const placementsFormatted: PlacementRowItem[] = rawPlacements.map((p) => ({
    id: p.id,
    status: p.status as "pending" | "active" | "completed",
    placementSource: p.placementSource as "self_secured" | "department_assigned",
    startDate: p.startDate,
    endDate: p.endDate,
    targetDays: p.targetDays,
    student: {
      id: p.studentProfileId,
      name: p.studentName,
      email: p.studentEmail,
      matricNumber: p.matricNumber,
      departmentName: p.departmentName,
    },
    organization: {
      id: p.orgId,
      name: p.orgName,
      industryType: p.orgIndustry,
      stateRegion: p.orgState,
      address: p.orgAddress,
    },
    schoolSupervisor: p.supervisorId
      ? {
          id: p.supervisorId,
          name: p.supervisorName,
          email: p.supervisorEmail,
        }
      : null,
  }));

  // 2. Fetch all school supervisors
  const rawSupervisors = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      departmentName: department.name,
    })
    .from(user)
    .leftJoin(department, eq(user.departmentId, department.id))
    .where(eq(user.role, "school_supervisor"))
    .orderBy(asc(user.name));

  const supervisorsFormatted: SupervisorOption[] = rawSupervisors.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    departmentName: s.departmentName,
  }));

  // 3. Fetch unassigned students (students without pending or active placement)
  const assignedProfiles = await db
    .select({ studentId: placement.studentId })
    .from(placement)
    .where(inArray(placement.status, ["pending", "active"]));

  const assignedProfileIds = new Set(assignedProfiles.map((p) => p.studentId));

  const rawStudents = await db
    .select({
      profileId: studentProfile.id,
      name: user.name,
      email: user.email,
      matricNumber: studentProfile.matricNumber,
      departmentName: department.name,
    })
    .from(studentProfile)
    .innerJoin(user, eq(studentProfile.userId, user.id))
    .leftJoin(department, eq(user.departmentId, department.id))
    .orderBy(asc(user.name));

  const unassignedStudents: UnassignedStudentOption[] = rawStudents
    .filter((s) => !assignedProfileIds.has(s.profileId))
    .map((s) => ({
      profileId: s.profileId,
      name: s.name,
      email: s.email,
      matricNumber: s.matricNumber,
      departmentName: s.departmentName,
    }));

  // 4. Fetch all organizations
  const rawOrgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      industryType: organization.industryType,
      stateRegion: organization.stateRegion,
    })
    .from(organization)
    .orderBy(asc(organization.name));

  const organizationsFormatted: OrganizationOption[] = rawOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    industryType: o.industryType,
    stateRegion: o.stateRegion,
  }));

  return (
    <PlacementList
      placements={placementsFormatted}
      supervisors={supervisorsFormatted}
      unassignedStudents={unassignedStudents}
      organizations={organizationsFormatted}
    />
  );
}
