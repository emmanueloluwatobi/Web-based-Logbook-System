import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendance, placement, studentProfile, organization } from "@/db/schema";
import {
  StudentAttendanceView,
  type StudentAttendancePlacementInfo,
} from "@/components/student/StudentAttendanceView";
import type { AttendanceRecordItem } from "@/components/student/AttendanceForm";

export const metadata: Metadata = {
  title: "Attendance — ULS EKSU SIWES",
  description: "Track work attendance and completion progress for SIWES industrial training.",
};

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect("/");
  }

  // 1. Fetch student profile
  const [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  if (!profile) {
    redirect("/student");
  }

  // 2. Fetch active placement
  const [activePlacement] = await db
    .select({
      id: placement.id,
      organizationId: placement.organizationId,
      targetDays: placement.targetDays,
      startDate: placement.startDate,
      endDate: placement.endDate,
      status: placement.status,
    })
    .from(placement)
    .where(
      and(
        eq(placement.studentId, profile.id),
        eq(placement.status, "active")
      )
    )
    .limit(1);

  let placementInfo: StudentAttendancePlacementInfo | null = null;
  if (activePlacement) {
    let orgName = "Host Organization";
    if (activePlacement.organizationId) {
      const [org] = await db
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, activePlacement.organizationId))
        .limit(1);
      if (org?.name) orgName = org.name;
    }

    placementInfo = {
      id: activePlacement.id,
      organizationName: orgName,
      targetDays: activePlacement.targetDays ?? 60,
      startDate: activePlacement.startDate,
      endDate: activePlacement.endDate,
      status: activePlacement.status,
    };
  }

  // 3. Fetch attendance records for this student
  const attendanceRows = await db
    .select({
      id: attendance.id,
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      hours: attendance.hours,
      status: attendance.status,
      createdAt: attendance.createdAt,
    })
    .from(attendance)
    .where(eq(attendance.studentId, profile.id))
    .orderBy(desc(attendance.date));

  const records: AttendanceRecordItem[] = attendanceRows.map((row) => ({
    id: row.id,
    date: row.date,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    hours: row.hours,
    status: row.status as "present" | "late" | "absent",
    createdAt: row.createdAt.toISOString(),
  }));

  return <StudentAttendanceView placement={placementInfo} records={records} />;
}
