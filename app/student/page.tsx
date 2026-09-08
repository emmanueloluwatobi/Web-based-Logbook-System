import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentProfile, department, user } from "@/db/schema";
import { StudentDashboardView } from "@/components/student/StudentDashboardView";

export const metadata: Metadata = {
  title: "Student Dashboard — ULS EKSU SIWES",
  description: "Ekiti State University SIWES Student Portal and Logbook Management System.",
};

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("[StudentDashboardPage] Error getting session:", err);
  }

  const userId = session?.user?.id;
  let isProfileComplete = false;
  let missingFields: string[] = [
    "Matric Number",
    "Program",
    "Level",
    "Session",
    "Phone Number",
    "Profile Photo",
  ];
  let departmentName = "Department Not Assigned";

  if (userId) {
    try {
      const [profile] = await db
        .select()
        .from(studentProfile)
        .where(eq(studentProfile.userId, userId))
        .limit(1);

      if (profile) {
        isProfileComplete = Boolean(profile.isProfileComplete);

        const missing: string[] = [];
        if (!profile.matricNumber?.trim()) missing.push("Matric Number");
        if (!profile.programId) missing.push("Program");
        if (!profile.level?.trim()) missing.push("Level");
        if (!profile.sessionId) missing.push("Session");
        if (!profile.phone?.trim()) missing.push("Phone Number");
        if (!profile.profilePhotoUrl?.trim()) missing.push("Profile Photo");
        missingFields = missing;
      }

      if (session?.user?.departmentId) {
        const [dept] = await db
          .select({ name: department.name })
          .from(department)
          .where(eq(department.id, session.user.departmentId))
          .limit(1);

        if (dept?.name) {
          departmentName = dept.name;
        }
      }
    } catch (dbErr) {
      console.error("[StudentDashboardPage] DB query error:", dbErr);
    }
  }

  return (
    <StudentDashboardView
      studentName={session?.user?.name || "Student"}
      departmentName={departmentName}
      isProfileComplete={isProfileComplete}
      missingFields={missingFields}
    />
  );
}

