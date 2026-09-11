import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { department, placement, user } from "@/db/schema";
import {
  HodSupervisorRoster,
  type HodSupervisorItem,
} from "@/components/hod/HodSupervisorRoster";

export const metadata: Metadata = {
  title: "Department Supervisors — ULS EKSU SIWES",
  description: "Read-only roster of department school supervisors and student workloads.",
};

export const dynamic = "force-dynamic";

export default async function HodSupervisorsPage() {
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

  // 1. Fetch all school supervisors in this department
  const supervisorUsers = departmentId
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
            eq(user.departmentId, departmentId)
          )
        )
        .orderBy(user.name)
    : [];

  const supervisorIds = supervisorUsers.map((u) => u.id);

  // 2. Fetch active and pending placements assigned to these supervisors
  const activePlacements =
    supervisorIds.length > 0
      ? await db
          .select({
            id: placement.id,
            schoolSupervisorId: placement.schoolSupervisorId,
          })
          .from(placement)
          .where(
            and(
              inArray(placement.schoolSupervisorId, supervisorIds),
              inArray(placement.status, ["pending", "active"])
            )
          )
      : [];

  // Group counts by supervisor ID
  const countsMap = new Map<string, number>();
  for (const p of activePlacements) {
    if (p.schoolSupervisorId) {
      countsMap.set(
        p.schoolSupervisorId,
        (countsMap.get(p.schoolSupervisorId) || 0) + 1
      );
    }
  }

  const supervisors: HodSupervisorItem[] = supervisorUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    assignedStudentCount: countsMap.get(u.id) || 0,
  }));

  return (
    <HodSupervisorRoster
      supervisors={supervisors}
      departmentName={departmentName}
    />
  );
}
