import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  studentProfile,
  user,
  department,
  program,
  placement,
  organization,
} from "@/db/schema";
import {
  HodStudentDetailView,
  type StudentProfileData,
  type StudentPlacementData,
  type DepartmentSupervisorOption,
  type OrganizationOption,
} from "@/components/hod/HodStudentDetailView";

export const metadata: Metadata = {
  title: "Student Details & Placement — ULS EKSU SIWES",
  description: "Assign school supervisor and configure industrial placement for department student.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HodStudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "hod" && session.user.role !== "admin") {
    redirect("/");
  }

  // 1. Fetch student profile and associated user record
  const [studentRow] = await db
    .select({
      profileId: studentProfile.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: studentProfile.phone,
      matricNumber: studentProfile.matricNumber,
      programId: studentProfile.programId,
      level: studentProfile.level,
      isProfileComplete: studentProfile.isProfileComplete,
      departmentId: user.departmentId,
    })
    .from(studentProfile)
    .innerJoin(user, eq(studentProfile.userId, user.id))
    .where(eq(studentProfile.id, id))
    .limit(1);

  if (!studentRow) {
    notFound();
  }

  // 2. Department-scoping check for HOD: student must be in HOD's department
  if (session.user.role === "hod") {
    if (
      !session.user.departmentId ||
      studentRow.departmentId !== session.user.departmentId
    ) {
      return (
        <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg mx-auto mt-12">
          <h2 className="font-heading font-semibold text-error text-lg">
            Access Restricted
          </h2>
          <p className="text-sm text-on-surface-variant mt-2">
            This student belongs to a different academic department. You can only view and manage students within your own department.
          </p>
        </div>
      );
    }
  }

  // 3. Fetch department name
  let departmentName = "Department";
  if (studentRow.departmentId) {
    const [dept] = await db
      .select({ name: department.name })
      .from(department)
      .where(eq(department.id, studentRow.departmentId))
      .limit(1);
    if (dept?.name) departmentName = dept.name;
  }

  // 4. Fetch program name
  let programName: string | null = null;
  if (studentRow.programId) {
    const [prog] = await db
      .select({ name: program.name })
      .from(program)
      .where(eq(program.id, studentRow.programId))
      .limit(1);
    if (prog?.name) programName = prog.name;
  }

  // 5. Fetch student's placement (prioritize active/pending, then most recent)
  const placements = await db
    .select({
      id: placement.id,
      organizationId: placement.organizationId,
      schoolSupervisorId: placement.schoolSupervisorId,
      startDate: placement.startDate,
      endDate: placement.endDate,
      targetDays: placement.targetDays,
      status: placement.status,
      placementSource: placement.placementSource,
      createdAt: placement.createdAt,
    })
    .from(placement)
    .where(eq(placement.studentId, studentRow.profileId))
    .orderBy(desc(placement.createdAt));

  // Find active or pending, or fall back to the newest
  const activePlacement =
    placements.find((p) => p.status === "active" || p.status === "pending") ||
    placements[0] ||
    null;

  let placementData: StudentPlacementData | null = null;
  if (activePlacement) {
    // Fetch organization info
    let orgName = "Unknown Organization";
    let orgAddress = "";
    let orgState = "";
    let orgIndustry = "";

    if (activePlacement.organizationId) {
      const [org] = await db
        .select({
          name: organization.name,
          address: organization.address,
          stateRegion: organization.stateRegion,
          industryType: organization.industryType,
        })
        .from(organization)
        .where(eq(organization.id, activePlacement.organizationId))
        .limit(1);

      if (org) {
        orgName = org.name;
        orgAddress = org.address;
        orgState = org.stateRegion;
        orgIndustry = org.industryType;
      }
    }

    // Fetch supervisor info
    let supervisorName: string | null = null;
    let supervisorEmail: string | null = null;

    if (activePlacement.schoolSupervisorId) {
      const [sup] = await db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, activePlacement.schoolSupervisorId))
        .limit(1);

      if (sup) {
        supervisorName = sup.name;
        supervisorEmail = sup.email;
      }
    }

    placementData = {
      id: activePlacement.id,
      organizationId: activePlacement.organizationId || "",
      organizationName: orgName,
      organizationAddress: orgAddress,
      organizationStateRegion: orgState,
      organizationIndustryType: orgIndustry,
      schoolSupervisorId: activePlacement.schoolSupervisorId,
      supervisorName,
      supervisorEmail,
      startDate: activePlacement.startDate,
      endDate: activePlacement.endDate,
      targetDays: activePlacement.targetDays,
      status: activePlacement.status,
      placementSource: activePlacement.placementSource,
      createdAt: activePlacement.createdAt.toISOString(),
    };
  }

  // 6. Fetch department supervisors (users with role school_supervisor in this department)
  const targetDeptId = studentRow.departmentId || session.user.departmentId;
  const supervisorRows = targetDeptId
    ? await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(
          and(
            eq(user.role, "school_supervisor"),
            eq(user.departmentId, targetDeptId)
          )
        )
    : [];

  const departmentSupervisors: DepartmentSupervisorOption[] = supervisorRows.map(
    (s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
    })
  );

  // 7. Fetch all organizations
  const allOrgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      address: organization.address,
      stateRegion: organization.stateRegion,
      industryType: organization.industryType,
    })
    .from(organization)
    .orderBy(organization.name);

  const organizations: OrganizationOption[] = allOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
    stateRegion: o.stateRegion,
    industryType: o.industryType,
  }));

  const studentData: StudentProfileData = {
    id: studentRow.profileId,
    userId: studentRow.userId,
    name: studentRow.name,
    email: studentRow.email,
    matricNumber: studentRow.matricNumber,
    programName,
    level: studentRow.level,
    phone: studentRow.phone,
    departmentName,
    isProfileComplete: studentRow.isProfileComplete,
  };

  return (
    <HodStudentDetailView
      student={studentData}
      placement={placementData}
      departmentSupervisors={departmentSupervisors}
      organizations={organizations}
    />
  );
}
