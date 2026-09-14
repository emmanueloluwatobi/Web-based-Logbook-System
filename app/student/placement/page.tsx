import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  studentProfile,
  placement,
  organization,
  user,
} from "@/db/schema";
import {
  StudentPlacementView,
  type PlacementDetails,
  type OrganizationItem,
} from "@/components/student/StudentPlacementView";

export const metadata: Metadata = {
  title: "My Placement — ULS EKSU SIWES",
  description: "Register and view your SIWES training placement details and assigned supervisor.",
};

export const dynamic = "force-dynamic";

export default async function StudentPlacementPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  // Retrieve student profile
  const [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  let placementDetails: PlacementDetails | null = null;

  if (profile) {
    const [p] = await db
      .select({
        id: placement.id,
        status: placement.status,
        placementSource: placement.placementSource,
        startDate: placement.startDate,
        endDate: placement.endDate,
        targetDays: placement.targetDays,
        orgId: organization.id,
        orgName: organization.name,
        orgAddress: organization.address,
        orgState: organization.stateRegion,
        orgIndustry: organization.industryType,
        supervisorId: user.id,
        supervisorName: user.name,
        supervisorEmail: user.email,
      })
      .from(placement)
      .innerJoin(organization, eq(placement.organizationId, organization.id))
      .leftJoin(user, eq(placement.schoolSupervisorId, user.id))
      .where(eq(placement.studentId, profile.id))
      .orderBy(desc(placement.startDate))
      .limit(1);

    if (p) {
      placementDetails = {
        id: p.id,
        status: p.status as "pending" | "active" | "completed",
        placementSource: p.placementSource as "self_secured" | "department_assigned",
        startDate: p.startDate,
        endDate: p.endDate,
        targetDays: p.targetDays,
        organization: {
          id: p.orgId,
          name: p.orgName,
          address: p.orgAddress,
          stateRegion: p.orgState,
          industryType: p.orgIndustry,
        },
        schoolSupervisor: p.supervisorId
          ? {
              id: p.supervisorId,
              name: p.supervisorName,
              email: p.supervisorEmail,
            }
          : null,
      };
    }
  }

  // Fetch list of registered organizations
  const orgList = await db
    .select()
    .from(organization)
    .orderBy(asc(organization.name));

  const organizationsFormatted: OrganizationItem[] = orgList.map((org) => ({
    id: org.id,
    name: org.name,
    address: org.address,
    stateRegion: org.stateRegion,
    industryType: org.industryType,
  }));

  return (
    <StudentPlacementView
      placement={placementDetails}
      organizations={organizationsFormatted}
      studentName={session.user.name || "Student"}
      matricNumber={profile?.matricNumber}
    />
  );
}
